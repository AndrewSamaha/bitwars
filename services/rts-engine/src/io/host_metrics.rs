use std::time::Instant;

use serde::Serialize;

/// One host sample per engine timing window. Missing sensors stay absent rather
/// than being reported as zero or conflated with another machine's sensors.
#[derive(Clone, Serialize)]
pub struct HostMetrics {
    pub hostname: String,
    pub host_os: &'static str,
    pub cpu_model: Option<String>,
    pub available_cpu_count: usize,
    pub process_cpu_core_equivalents: Option<f64>,
    pub process_cpu_capacity_percent: Option<f64>,
    pub thermal_state: Option<&'static str>,
    pub cpu_temperature_c: Option<f64>,
    pub cpu_temperature_sensor: Option<String>,
}

pub struct HostSampler {
    hostname: String,
    cpu_model: Option<String>,
    available_cpu_count: usize,
    previous_wall: Instant,
    previous_cpu_seconds: Option<f64>,
}

impl HostSampler {
    pub fn new() -> Self {
        Self {
            hostname: hostname().unwrap_or_else(|| "unknown".to_string()),
            cpu_model: cpu_model(),
            available_cpu_count: std::thread::available_parallelism().map_or(1, usize::from),
            previous_wall: Instant::now(),
            previous_cpu_seconds: process_cpu_seconds(),
        }
    }

    pub fn sample(&mut self) -> HostMetrics {
        let now = Instant::now();
        let cpu_seconds = process_cpu_seconds();
        let elapsed = now.duration_since(self.previous_wall).as_secs_f64();
        let core_equivalents = self
            .previous_cpu_seconds
            .zip(cpu_seconds)
            .filter(|_| elapsed > 0.0)
            .map(|(before, after)| ((after - before) / elapsed).max(0.0));
        self.previous_wall = now;
        self.previous_cpu_seconds = cpu_seconds;

        let (cpu_temperature_c, cpu_temperature_sensor) = cpu_temperature();
        HostMetrics {
            hostname: self.hostname.clone(),
            host_os: std::env::consts::OS,
            cpu_model: self.cpu_model.clone(),
            available_cpu_count: self.available_cpu_count,
            process_cpu_core_equivalents: core_equivalents,
            process_cpu_capacity_percent: core_equivalents
                .map(|cores| cores * 100.0 / self.available_cpu_count as f64),
            thermal_state: thermal_state(),
            cpu_temperature_c,
            cpu_temperature_sensor,
        }
    }
}

pub fn hostname() -> Option<String> {
    let mut bytes = [0_u8; 256];
    // gethostname is available on both macOS and Linux. The buffer is local
    // and the kernel writes at most its specified length.
    let status = unsafe { libc::gethostname(bytes.as_mut_ptr().cast(), bytes.len()) };
    if status != 0 {
        return None;
    }
    let end = bytes
        .iter()
        .position(|byte| *byte == 0)
        .unwrap_or(bytes.len());
    let name = String::from_utf8_lossy(&bytes[..end]).trim().to_string();
    (!name.is_empty()).then_some(name)
}

fn process_cpu_seconds() -> Option<f64> {
    let mut usage = std::mem::MaybeUninit::<libc::rusage>::uninit();
    let status = unsafe { libc::getrusage(libc::RUSAGE_SELF, usage.as_mut_ptr()) };
    if status != 0 {
        return None;
    }
    let usage = unsafe { usage.assume_init() };
    let timeval_seconds =
        |time: libc::timeval| time.tv_sec as f64 + time.tv_usec as f64 / 1_000_000.0;
    Some(timeval_seconds(usage.ru_utime) + timeval_seconds(usage.ru_stime))
}

#[cfg(target_os = "macos")]
fn cpu_model() -> Option<String> {
    std::process::Command::new("sysctl")
        .args(["-n", "machdep.cpu.brand_string"])
        .output()
        .ok()
        .filter(|output| output.status.success())
        .and_then(|output| String::from_utf8(output.stdout).ok())
        .map(|model| model.trim().to_string())
        .filter(|model| !model.is_empty())
}

#[cfg(target_os = "linux")]
fn cpu_model() -> Option<String> {
    std::fs::read_to_string("/proc/cpuinfo")
        .ok()?
        .lines()
        .find_map(|line| {
            line.split_once(':')
                .filter(|(key, _)| matches!(key.trim(), "model name" | "Hardware" | "Processor"))
                .map(|(_, value)| value.trim().to_string())
        })
}

#[cfg(not(any(target_os = "macos", target_os = "linux")))]
fn cpu_model() -> Option<String> {
    None
}

#[cfg(target_os = "linux")]
fn cpu_temperature() -> (Option<f64>, Option<String>) {
    let Ok(devices) = std::fs::read_dir("/sys/class/hwmon") else {
        return (None, None);
    };
    for device in devices.flatten() {
        let path = device.path();
        let Ok(name) = std::fs::read_to_string(path.join("name")) else {
            continue;
        };
        let name = name.trim();
        if !matches!(
            name,
            "coretemp" | "k10temp" | "zenpower" | "peci_cputemp" | "cpu_thermal"
        ) {
            continue;
        }
        for index in 1..=32 {
            let label = std::fs::read_to_string(path.join(format!("temp{index}_label")))
                .unwrap_or_default();
            let label = label.trim();
            if index != 1
                && !["Package id", "Tctl", "Tdie", "Die"]
                    .iter()
                    .any(|prefix| label.starts_with(prefix))
            {
                continue;
            }
            let Ok(raw) = std::fs::read_to_string(path.join(format!("temp{index}_input"))) else {
                continue;
            };
            let Ok(millidegrees) = raw.trim().parse::<f64>() else {
                continue;
            };
            if !(-40_000.0..=150_000.0).contains(&millidegrees) {
                continue;
            }
            return (
                Some(millidegrees / 1_000.0),
                Some(format!(
                    "{name}:{}",
                    if label.is_empty() {
                        format!("temp{index}")
                    } else {
                        label.to_string()
                    }
                )),
            );
        }
    }
    (None, None)
}

#[cfg(not(target_os = "linux"))]
fn cpu_temperature() -> (Option<f64>, Option<String>) {
    (None, None)
}

#[cfg(target_os = "macos")]
fn thermal_state() -> Option<&'static str> {
    use std::ffi::{c_char, c_void};

    #[link(name = "objc")]
    extern "C" {
        fn objc_getClass(name: *const c_char) -> *mut c_void;
        fn sel_registerName(name: *const c_char) -> *mut c_void;
        fn objc_msgSend();
    }
    #[link(name = "Foundation", kind = "framework")]
    extern "C" {}

    unsafe {
        let class = objc_getClass(c"NSProcessInfo".as_ptr());
        if class.is_null() {
            return None;
        }
        let process_info_selector = sel_registerName(c"processInfo".as_ptr());
        let thermal_selector = sel_registerName(c"thermalState".as_ptr());
        if process_info_selector.is_null() || thermal_selector.is_null() {
            return None;
        }
        let send_object: unsafe extern "C" fn(*mut c_void, *mut c_void) -> *mut c_void =
            std::mem::transmute(objc_msgSend as *const ());
        let process_info = send_object(class, process_info_selector);
        if process_info.is_null() {
            return None;
        }
        let send_integer: unsafe extern "C" fn(*mut c_void, *mut c_void) -> isize =
            std::mem::transmute(objc_msgSend as *const ());
        match send_integer(process_info, thermal_selector) {
            0 => Some("nominal"),
            1 => Some("fair"),
            2 => Some("serious"),
            3 => Some("critical"),
            _ => None,
        }
    }
}

#[cfg(not(target_os = "macos"))]
fn thermal_state() -> Option<&'static str> {
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn samples_current_host_without_requiring_optional_sensors() {
        let mut sampler = HostSampler::new();
        let sample = sampler.sample();
        assert!(!sample.hostname.is_empty());
        assert!(sample.available_cpu_count > 0);
        assert!(sample.process_cpu_core_equivalents.is_some());
    }
}
