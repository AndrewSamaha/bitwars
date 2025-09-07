// services/rts-engine/build.rs
use std::{env, fs, path::PathBuf};

fn main() {
    // Use vendored protoc so we don't rely on system installs
    let protoc = protoc_bin_vendored::protoc_bin_path().expect("Could not get vendored protoc");
    env::set_var("PROTOC", &protoc);

    // Resolve absolute paths to avoid any ../ surprises
    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let proto_dir_rel = manifest_dir.join("../../packages/schemas/proto");
    let proto_dir = fs::canonicalize(&proto_dir_rel)
        .unwrap_or_else(|_| panic!("Proto dir not found: {}", proto_dir_rel.display()));
    let entry = proto_dir.join("world.proto");

    // Ensure output dir exists *before* we run codegen
    let out_dir = manifest_dir.join("src/pb");
    fs::create_dir_all(&out_dir).expect("Failed to create src/pb directory");

    // Debug prints
    eprintln!("CARGO_MANIFEST_DIR = {}", manifest_dir.display());
    eprintln!("PROTOC             = {}", PathBuf::from(protoc).display());
    eprintln!("PROTO_DIR          = {}", proto_dir.display());
    eprintln!("ENTRY              = {}", entry.display());
    eprintln!("OUT_DIR            = {}", out_dir.display());

    // Validate existence
    assert_file(&entry, "Entry proto not found (expected world.proto here)");
    println!("cargo:rerun-if-changed={}", proto_dir.display());

    // Configure prost-build
    let mut config = prost_build::Config::new();
    config.out_dir(&out_dir);

    // Compile a single entry; imports are resolved via include path(s)
    config
        .compile_protos(&[entry], &[proto_dir.clone()])
        .expect("Failed to compile protos");
}

fn assert_file(p: &PathBuf, msg: &str) {
    match fs::metadata(p) {
        Ok(m) if m.is_file() => {}
        _ => panic!("{msg}: {}", p.display()),
    }
}
