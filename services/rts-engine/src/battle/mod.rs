//! Developer-only, process-isolated battle runner. No live game services.
mod draft;
mod simulation;

#[cfg(test)]
pub(crate) use {draft::Bounds, simulation::Battle};

use std::collections::HashMap;
use std::fs::{self, File, OpenOptions};
use std::io;
use std::os::fd::AsRawFd;
use std::os::unix::fs::{DirBuilderExt, FileTypeExt, MetadataExt, OpenOptionsExt, PermissionsExt};
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use anyhow::{ensure, Context, Result};
use serde::Deserialize;
use serde_json::json;
use tokio::io::{AsyncBufReadExt, AsyncReadExt, AsyncWriteExt, BufReader};
use tokio::net::{UnixListener, UnixStream};
use tokio::sync::Semaphore;
use uuid::Uuid;

use crate::config::GameConfig;
use crate::content_revision::{hash_bytes, valid_hash};
use draft::Draft;
use simulation::{Replay, MAX_REPLAY_BYTES};

const MAX_BODY: u64 = 128 * 1024;
const MAX_HEADER: u64 = 1_024;
const MAX_RETAINED: usize = 32 * 1024 * 1024;
const MAX_RECORDS: usize = 64;
const MAX_CONNECTIONS: usize = 16;
const TTL: Duration = Duration::from_secs(15 * 60);
const IO_TIMEOUT: Duration = Duration::from_secs(15);

#[derive(Deserialize)]
#[serde(tag = "action", rename_all = "snake_case", deny_unknown_fields)]
enum Request {
    Catalog { owner: String, revision: String },
    Submit { owner: String },
    Status { owner: String, run_id: String },
    Replay { owner: String, run_id: String, page: usize },
}

impl Request {
    fn owner(&self) -> &str {
        match self {
            Self::Catalog { owner, .. } | Self::Submit { owner } |
            Self::Status { owner, .. } | Self::Replay { owner, .. } => owner,
        }
    }
}

#[derive(Clone)]
struct Failure { code: &'static str, message: String }

enum Status { Pending, Rejected(Failure), Failed(Failure), Ready(Replay) }

struct Record { owner: String, status: Status, finished: Option<Instant> }

impl Record {
    fn bytes(&self) -> usize {
        if let Status::Ready(replay) = &self.status { replay.bytes } else { 0 }
    }
}

#[derive(Default)]
struct Registry { runs: HashMap<Uuid, Record>, bytes: usize }

impl Registry {
    fn prune(&mut self) {
        self.runs.retain(|_, run| {
            let expired = run.finished.is_some_and(|t| t.elapsed() >= TTL);
            if expired { self.bytes -= run.bytes(); }
            !expired
        });
    }

    fn evict_oldest(&mut self) {
        let id = self.runs.iter().filter_map(|(id, run)| Some((*id, run.finished?)))
            .min_by_key(|(id, finished)| (*finished, *id)).expect("at most two pending records").0;
        self.bytes -= self.runs.remove(&id).unwrap().bytes();
    }

    fn complete(&mut self, id: Uuid, status: Status) {
        let bytes = if let Status::Ready(replay) = &status { replay.bytes } else { 0 };
        debug_assert!(bytes <= MAX_REPLAY_BYTES);
        self.prune();
        while self.bytes + bytes > MAX_RETAINED { self.evict_oldest(); }
        let run = self.runs.get_mut(&id).expect("pending run is retained");
        run.finished = Some(Instant::now());
        run.status = status;
        self.bytes += bytes;
    }
}

struct Runner {
    root: PathBuf,
    config: GameConfig,
    jobs: Arc<Semaphore>,
    catalog: Arc<Semaphore>,
    records: Mutex<Registry>,
}

struct Reply {
    status: u16,
    body: Vec<u8>,
    frames: Option<Arc<Box<[u8]>>>,
}

impl Reply {
    fn json(status: u16, body: serde_json::Value) -> Self {
        Self { status, body: body.to_string().into_bytes(), frames: None }
    }

    fn error(status: u16, code: &str, message: impl Into<String>) -> Self {
        Self::json(status, json!({"code": code, "message": message.into()}))
    }

    async fn write(self, socket: &mut UnixStream) -> io::Result<()> {
        socket.write_all(format!("{}\n", self.status).as_bytes()).await?;
        socket.write_all(&self.body).await?;
        if let Some(frames) = self.frames {
            socket.write_all(&frames).await?;
            socket.write_all(b"}").await?;
        }
        socket.shutdown().await
    }
}

fn unavailable() -> Reply {
    Reply::error(404, "run_unavailable", "Run or replay unavailable. It may have expired or the runner restarted. Reset and run again.")
}

fn execute(root: &Path, config: &GameConfig, draft: Draft) -> Status {
    let mut revision = match draft::load_revision(root, &draft.revision) {
        Ok(revision) => revision,
        Err(error) => return Status::Rejected(Failure { code: "revision_unavailable", message: error.to_string() }),
    };
    let bounds = draft.bounds;
    let entities = match draft.materialize(&mut revision.pack) {
        Ok(entities) => entities,
        Err(error) => return Status::Rejected(Failure { code: "invalid_draft", message: format!("{error:#}") }),
    };
    match simulation::simulate(&revision.pack, bounds, entities, config) {
        Ok(replay) => Status::Ready(replay),
        Err(error) => Status::Failed(Failure { code: "simulation_failed", message: error.to_string() }),
    }
}

impl Runner {
    async fn dispatch(self: &Arc<Self>, request: Request, body: Vec<u8>) -> Reply {
        if !Uuid::parse_str(request.owner()).is_ok_and(|id| id.to_string() == request.owner()) {
            return Reply::error(403, "unauthorized", "A developer session is required.");
        }
        match request {
            Request::Catalog { revision, .. } => {
                if !valid_hash(&revision) { return Reply::error(400, "invalid_revision", "Use a SHA-256 content revision."); }
                let Ok(permit) = self.catalog.clone().try_acquire_owned() else {
                    return Reply::error(429, "catalog_busy", "The catalog is busy. Retry in a moment.");
                };
                let runner = self.clone();
                match tokio::task::spawn_blocking(move || {
                    let _permit = permit;
                    draft::catalog(&runner.root, &revision)
                }).await {
                    Ok(Ok(body)) if body.len() <= MAX_BODY as usize => Reply { status: 200, body, frames: None },
                    Ok(Ok(_)) => Reply::error(413, "catalog_limit", "The pinned catalog exceeds 128 KiB."),
                    Ok(Err(error)) => Reply::error(404, "revision_unavailable", error.to_string()),
                    Err(_) => Reply::error(500, "catalog_failed", "Catalog loading failed. Check the runner logs."),
                }
            }
            Request::Submit { owner } => {
                let Ok(permit) = self.jobs.clone().try_acquire_owned() else {
                    return Reply::error(429, "run_capacity", "Two battles are already running. Try Go again when one finishes.");
                };
                let draft: Draft = match serde_json::from_slice(&body) {
                    Ok(draft) => draft,
                    Err(error) => return Reply::error(400, "invalid_draft", format!("Invalid draft JSON or value: {error}.")),
                };
                if let Err(error) = draft.validate_shape() { return Reply::error(400, "invalid_draft", error.to_string()); }
                let id = Uuid::now_v7();
                {
                    let mut records = self.records.lock().unwrap();
                    records.prune();
                    if records.runs.len() >= MAX_RECORDS { records.evict_oldest(); }
                    records.runs.insert(id, Record { owner, status: Status::Pending, finished: None });
                }
                let runner = self.clone();
                tokio::spawn(async move {
                    let worker = runner.clone();
                    let status = tokio::task::spawn_blocking(move || execute(&worker.root, &worker.config, draft)).await
                        .unwrap_or_else(|_| Status::Failed(Failure { code: "simulation_failed", message: "Battle worker failed. Check the runner logs.".into() }));
                    runner.records.lock().unwrap().complete(id, status);
                    drop(permit);
                });
                Reply::json(202, json!({"run_id": id.to_string()}))
            }
            Request::Status { owner, run_id } => self.lookup(&owner, &run_id, None),
            Request::Replay { owner, run_id, page } => self.lookup(&owner, &run_id, Some(page)),
        }
    }

    fn lookup(&self, owner: &str, run_id: &str, page: Option<usize>) -> Reply {
        let Ok(id) = Uuid::parse_str(run_id) else { return unavailable(); };
        if id.to_string() != run_id { return unavailable(); }
        let mut records = self.records.lock().unwrap();
        records.prune();
        let Some(record) = records.runs.get(&id).filter(|r| r.owner == owner) else { return unavailable(); };
        if let Some(page) = page {
            let Status::Ready(replay) = &record.status else { return unavailable(); };
            let Some(frames) = replay.pages.get(page) else { return unavailable(); };
            let body = format!("{{\"run_id\":\"{run_id}\",\"page\":{page},\"frames\":").into_bytes();
            return Reply { status: 200, body, frames: Some(frames.clone()) };
        }
        let body = match &record.status {
            Status::Pending => json!({"run_id":run_id,"status":"pending"}),
            Status::Rejected(error) | Status::Failed(error) => json!({"run_id":run_id,
                "status":if matches!(record.status, Status::Rejected(_)) { "rejected" } else { "failed" },
                "code":error.code,"message":error.message}),
            Status::Ready(replay) => json!({"run_id":run_id,"status":"ready","tps":replay.tps,
                "last_tick":replay.last_tick,"outcome":replay.outcome,"page_count":replay.pages.len()}),
        };
        Reply::json(200, body)
    }
}

async fn serve(stream: &mut UnixStream, runner: &Arc<Runner>) -> io::Result<()> {
    let (request, body) = {
        let mut reader = BufReader::new(&mut *stream);
        let mut header = Vec::new();
        (&mut reader).take(MAX_HEADER + 1).read_until(b'\n', &mut header).await?;
        let request = (header.len() <= MAX_HEADER as usize && header.last() == Some(&b'\n'))
            .then(|| serde_json::from_slice::<Request>(&header).ok()).flatten();
        let mut body = Vec::new();
        if matches!(request, Some(Request::Submit { .. })) {
            reader.take(MAX_BODY + 1).read_to_end(&mut body).await?;
        }
        (request, body)
    };
    let reply = if body.len() as u64 > MAX_BODY {
        Reply::error(413, "request_limit", "A draft cannot exceed 128 KiB.")
    } else if let Some(request) = request {
        runner.dispatch(request, body).await
    } else {
        Reply::error(400, "invalid_request", "Malformed runner request.")
    };
    reply.write(stream).await
}

struct PrivateSocket { path: PathBuf, _lock: File }

impl Drop for PrivateSocket {
    fn drop(&mut self) { let _ = fs::remove_file(&self.path); }
}

fn listen(workspace: &Path) -> Result<(PrivateSocket, UnixListener)> {
    let digest = hash_bytes(workspace.as_os_str().as_encoded_bytes());
    let dir = Path::new("/tmp").join(format!("bitwars-battle-{}", &digest[..24]));
    match fs::DirBuilder::new().mode(0o700).create(&dir) {
        Err(error) if error.kind() == io::ErrorKind::AlreadyExists => {},
        result => result?,
    }
    let meta = fs::symlink_metadata(&dir)?;
    ensure!(meta.is_dir() && meta.uid() == unsafe { libc::geteuid() } && meta.mode() & 0o777 == 0o700,
        "{} must be a user-owned private directory (0700)", dir.display());
    let lock = OpenOptions::new().write(true).create(true).truncate(false).mode(0o600)
        .custom_flags(libc::O_NOFOLLOW).open(dir.join("runner.lock"))?;
    ensure!(unsafe { libc::flock(lock.as_raw_fd(), libc::LOCK_EX | libc::LOCK_NB) } == 0,
        "A battle runner already holds the socket lock: {}", dir.display());
    let path = dir.join("runner.sock");
    match fs::symlink_metadata(&path) {
        Ok(meta) if meta.file_type().is_socket() => fs::remove_file(&path)?,
        Err(error) if error.kind() == io::ErrorKind::NotFound => {},
        Ok(_) => anyhow::bail!("Refusing to replace a non-socket: {}", path.display()),
        Err(error) => return Err(error.into()),
    }
    let listener = UnixListener::bind(&path).context("Bind private battle runner socket")?;
    let guard = PrivateSocket { path, _lock: lock };
    fs::set_permissions(&guard.path, fs::Permissions::from_mode(0o600))?;
    Ok((guard, listener))
}

/// Run from the workspace root. The private socket is worktree-scoped.
pub async fn run() -> Result<()> {
    if !std::env::var("BATTLE_DEV_KEY").is_ok_and(|key| key.len() >= 32) {
        eprintln!("Battle runner disabled: set BATTLE_DEV_KEY (at least 32 bytes).");
        return Ok(());
    }
    let workspace = std::env::current_dir()?.canonicalize()?;
    let root = workspace.join("packages/content/.battle-revisions");
    ensure!(root.parent().unwrap().join("entities.yaml").is_file(), "Start the battle runner from the workspace root.");
    let (_socket, listener) = listen(&workspace)?;
    let runner = Arc::new(Runner { root, config: GameConfig::from_env(), jobs: Arc::new(Semaphore::new(2)),
        catalog: Arc::new(Semaphore::new(1)), records: Mutex::new(Registry::default()) });
    let connections = Arc::new(Semaphore::new(MAX_CONNECTIONS));
    let mut prune = tokio::time::interval(Duration::from_secs(30));
    let mut sigterm = tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())?;
    let sigint = tokio::signal::ctrl_c();
    tokio::pin!(sigint);
    eprintln!("Battle runner listening on {}", _socket.path.display());
    loop {
        tokio::select! {
            _ = &mut sigint => break,
            _ = sigterm.recv() => break,
            _ = prune.tick() => runner.records.lock().unwrap().prune(),
            accepted = listener.accept() => {
                let (mut stream, _) = accepted?;
                let Ok(permit) = connections.clone().try_acquire_owned() else { continue; };
                let runner = runner.clone();
                tokio::spawn(async move {
                    let _permit = permit;
                    let _ = tokio::time::timeout(IO_TIMEOUT, serve(&mut stream, &runner)).await;
                });
            }
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn foreign_and_expired_runs_and_pages_are_unavailable() {
        let runner = Runner {
            root: PathBuf::new(), config: GameConfig::default(), jobs: Arc::new(Semaphore::new(2)),
            catalog: Arc::new(Semaphore::new(1)), records: Mutex::new(Registry::default()),
        };
        let owner = Uuid::now_v7().to_string();
        let foreign = Uuid::now_v7().to_string();
        let id = Uuid::now_v7();
        let replay = Replay { tps: 20, last_tick: 0, outcome: simulation::Outcome::Draw, bytes: 2,
            pages: vec![Arc::new(Box::from(b"[]".as_slice()))] };
        {
            let mut records = runner.records.lock().unwrap();
            records.runs.insert(id, Record { owner: owner.clone(), status: Status::Pending, finished: None });
            records.complete(id, Status::Ready(replay));
        }
        let id_str = id.to_string();
        let unknown = Uuid::now_v7().to_string();
        for page in [None, Some(0)] {
            assert_eq!(runner.lookup(&owner, &id_str, page).status, 200);
            let rejected = runner.lookup(&foreign, &id_str, page);
            assert_eq!(rejected.status, 404);
            assert_eq!(rejected.body, runner.lookup(&owner, &unknown, page).body);
        }
        runner.records.lock().unwrap().runs.get_mut(&id).unwrap().finished = Some(Instant::now() - TTL);
        for page in [None, Some(0)] {
            let expired = runner.lookup(&owner, &id_str, page);
            assert_eq!(expired.status, 404);
            assert_eq!(expired.body, runner.lookup(&owner, &unknown, page).body);
        }
        assert_eq!(runner.records.lock().unwrap().bytes, 0);
    }
}
