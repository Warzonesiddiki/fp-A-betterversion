use std::fs::{self, OpenOptions};
use std::io::Write;
use std::panic;
use std::path::PathBuf;
use std::time::SystemTime;

const APP_IDENTIFIER: &str = "com.finplanpro.app";
const CRASH_LOG_DIR: &str = "crash-logs";

fn crash_log_dir() -> Option<PathBuf> {
    let base = dirs::data_local_dir()?;
    let dir = base.join(APP_IDENTIFIER).join(CRASH_LOG_DIR);
    fs::create_dir_all(&dir).ok()?;
    Some(dir)
}

fn timestamp() -> String {
    match SystemTime::now().duration_since(SystemTime::UNIX_EPOCH) {
        Ok(d) => format!("{}", d.as_secs()),
        Err(_) => "0".to_string(),
    }
}

fn install_panic_hook() {
    let default_hook = panic::take_hook();
    panic::set_hook(Box::new(move |info| {
        let thread = std::thread::current();
        let thread_name = thread.name().unwrap_or("<unnamed>");

        let payload = if let Some(s) = info.payload().downcast_ref::<&str>() {
            s.to_string()
        } else if let Some(s) = info.payload().downcast_ref::<String>() {
            s.clone()
        } else {
            "Box<dyn Any>".to_string()
        };

        let location = info
            .location()
            .map(|l| format!("{}:{}:{}", l.file(), l.line(), l.column()))
            .unwrap_or_else(|| "<unknown>".to_string());

        let backtrace = std::backtrace::Backtrace::force_capture();

        let report = format!(
            "=== PANIC ===\ntimestamp: {}\nthread: {}\nlocation: {}\npayload: {}\nbacktrace:\n{}\n\n",
            timestamp(),
            thread_name,
            location,
            payload,
            backtrace
        );

        if let Some(dir) = crash_log_dir() {
            let filename = format!("panic-{}-{}.log", timestamp(), thread_name);
            let path = dir.join(filename);
            let _ = fs::write(&path, &report);
        }

        // Also write to stderr for dev tools / console
        eprintln!("{}", report);

        // Call the default hook (which will print to stderr and abort)
        default_hook(info);
    }));
}

/// Initialize the crash reporter. Call once at startup before Tauri builder.
pub fn init() {
    install_panic_hook();
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn crash_log_dir_returns_path() {
        let dir = crash_log_dir();
        assert!(dir.is_some());
        let dir = dir.unwrap();
        assert!(dir.to_string_lossy().contains(APP_IDENTIFIER));
    }

    #[test]
    fn timestamp_is_nonempty() {
        let ts = timestamp();
        assert!(!ts.is_empty());
        assert!(ts.parse::<u64>().is_ok());
    }
}
