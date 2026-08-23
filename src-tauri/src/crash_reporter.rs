//! Local crash reporter (BLUEPRINT F-DESK-012; wired by wave-3 lane R20,
//! 2026-08-23). Writes panic reports to
//! `%LOCALAPPDATA%\com.finplanpro.app\crash-logs\` and mirrors them to
//! stderr. STRICTLY LOCAL BY DESIGN: nothing here transmits. BLUEPRINT
//! §23.6/R-26 requires monetary values and PII to be scrubbed BEFORE any
//! transmission; if an upload path is ever added, redaction must land
//! first (§12.3 egress chokepoint extends to crash dumps).
use std::fs;
use std::panic;
use std::path::{Path, PathBuf};
use std::time::SystemTime;

const APP_IDENTIFIER: &str = "com.finplanpro.app";
const CRASH_LOG_DIR: &str = "crash-logs";

/// Pure path construction: `<base>/<APP_IDENTIFIER>/<CRASH_LOG_DIR>`.
/// Split from [`crash_log_dir`] so tests exercise the layout against a
/// hermetic temp base instead of the real `%LOCALAPPDATA%` tree.
fn crash_dir_under(base: &Path) -> PathBuf {
    base.join(APP_IDENTIFIER).join(CRASH_LOG_DIR)
}

/// Replace characters illegal in path components on common host filesystems
/// (notably Windows NTFS: `< > : " / \ | ? *`) plus control characters with
/// `_`. Without this, a panic on an unnamed thread produced the filename
/// `panic-<ts>-<unnamed>.log`, which `fs::write` silently refuses to create
/// on Windows (the `let _` swallowed the error).
fn sanitize_component(name: &str) -> String {
    name.chars()
        .map(|c| match c {
            '<' | '>' | ':' | '"' | '/' | '\\' | '|' | '?' | '*' => '_',
            c if c.is_control() => '_',
            c => c,
        })
        .collect()
}

/// Pure filename construction for one crash-log entry.
fn crash_log_file_name(timestamp: &str, thread_name: &str) -> String {
    let safe_thread = sanitize_component(thread_name);
    format!("panic-{timestamp}-{safe_thread}.log")
}

fn crash_log_dir() -> Option<PathBuf> {
    let base = dirs::data_local_dir()?;
    let dir = crash_dir_under(&base);
    fs::create_dir_all(&dir).ok()?;
    Some(dir)
}

fn timestamp() -> String {
    match SystemTime::now().duration_since(SystemTime::UNIX_EPOCH) {
        Ok(d) => format!("{}", d.as_secs()),
        Err(_) => "0".to_string(),
    }
}

/// Pure report formatting — byte-identical layout to the historical inline
/// `format!` inside the panic hook.
fn report_text(
    timestamp: &str,
    thread_name: &str,
    location: &str,
    payload: &str,
    backtrace: &str,
) -> String {
    format!(
        "=== PANIC ===\ntimestamp: {timestamp}\nthread: {thread_name}\nlocation: {location}\npayload: {payload}\nbacktrace:\n{backtrace}\n\n"
    )
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

        let report = report_text(
            &timestamp(),
            thread_name,
            &location,
            &payload,
            &backtrace.to_string(),
        );

        if let Some(dir) = crash_log_dir() {
            let filename = crash_log_file_name(&timestamp(), thread_name);
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
    use std::sync::atomic::{AtomicU32, Ordering};

    /// Monotonic counter guaranteeing unique hermetic dirs across rapid calls.
    static HERMETIC_SEQ: AtomicU32 = AtomicU32::new(0);

    /// Unique directory per call under the OS temp dir — never touches the
    /// real `%LOCALAPPDATA%` tree. Cleaned up best-effort by the caller.
    fn hermetic_base(tag: &str) -> PathBuf {
        let seq = HERMETIC_SEQ.fetch_add(1, Ordering::Relaxed);
        let nanos = SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .map(|d| d.as_nanos())
            .unwrap_or(0);
        std::env::temp_dir().join(format!(
            "finplan-crash-test-{tag}-{}-{seq}-{nanos}",
            std::process::id()
        ))
    }

    fn cleanup_hermetic(base: &Path) {
        let _ = fs::remove_dir_all(base);
    }

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

    #[test]
    fn timestamp_looks_like_unix_seconds() {
        let ts = timestamp();
        let secs: u64 = ts.parse().expect("timestamp parses as u64");
        // Floor at 2020-09-01T00:00:00Z; guards against epoch-0 fallback and
        // unit mixups while staying future-proof.
        assert!(secs >= 1_598_870_600, "implausible unix seconds: {secs}");
    }

    #[test]
    fn sanitize_component_replaces_ntfs_illegal_and_control_chars() {
        assert_eq!(
            sanitize_component("a<b>c:d\"e/f\\g|h?i*j"),
            "a_b_c_d_e_f_g_h_i_j"
        );
        assert_eq!(sanitize_component("tab\there"), "tab_here");
        assert_eq!(sanitize_component("nl\nline"), "nl_line");
    }

    #[test]
    fn sanitize_component_keeps_plain_names_untouched() {
        assert_eq!(sanitize_component("main"), "main");
        assert_eq!(
            sanitize_component("tokio-runtime-worker-3"),
            "tokio-runtime-worker-3"
        );
        assert_eq!(sanitize_component(""), "");
    }

    #[test]
    fn crash_log_file_name_format_matches_layout() {
        assert_eq!(
            crash_log_file_name("1700000000", "main"),
            "panic-1700000000-main.log"
        );
    }

    #[test]
    fn crash_log_file_name_is_writable_for_unnamed_threads_on_windows() {
        let name = crash_log_file_name("1700000000", "<unnamed>");
        assert_eq!(name, "panic-1700000000-_unnamed_.log");
        for ch in name.chars() {
            assert!(!matches!(
                ch,
                '<' | '>' | ':' | '"' | '/' | '\\' | '|' | '?' | '*'
            ));
            assert!(!ch.is_control());
        }
    }

    #[test]
    fn crash_dir_under_appends_identifier_then_subdir() {
        let base = hermetic_base("layout");
        let dir = crash_dir_under(&base);
        assert_eq!(dir, base.join(APP_IDENTIFIER).join(CRASH_LOG_DIR));
        assert!(dir.starts_with(&base));
        cleanup_hermetic(&base);
    }

    #[test]
    fn report_text_layout_is_byte_exact() {
        let report = report_text(
            "1700000000",
            "main",
            "src/lib.rs:10:5",
            "explicit panic",
            "stack backtrace body",
        );
        let expected = "=== PANIC ===\n\
                        timestamp: 1700000000\n\
                        thread: main\n\
                        location: src/lib.rs:10:5\n\
                        payload: explicit panic\n\
                        backtrace:\n\
                        stack backtrace body\n\
                        \n";
        assert_eq!(report, expected);
        assert!(report.ends_with("\n\n"));
    }

    #[test]
    fn hermetic_write_roundtrip_through_real_helpers() {
        let base = hermetic_base("roundtrip");
        let dir = crash_dir_under(&base);
        fs::create_dir_all(&dir).expect("create crash dir under hermetic base");

        let report = report_text(
            &timestamp(),
            "hermetic-thread",
            "tests.rs:1:1",
            "hermetic panic",
            "frame_a\nframe_b",
        );
        let path = dir.join(crash_log_file_name(&timestamp(), "hermetic-thread"));
        fs::write(&path, &report).expect("write crash log hermetically");

        let read_back = fs::read_to_string(&path).expect("read crash log back");
        assert_eq!(read_back, report);
        assert!(path
            .file_name()
            .unwrap()
            .to_string_lossy()
            .starts_with("panic-"));

        // Best-effort cleanup; only assert absence when removal succeeded so
        // a lingering OS handle cannot flake the suite.
        let removed = fs::remove_dir_all(&base).is_ok();
        if removed {
            assert!(!base.exists());
        }
    }
}
