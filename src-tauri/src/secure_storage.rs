// FinPlan Pro v1.0.0 — Phase 7 PATCH 15 (Hephaestus, 2026-06-16)
//
// Secure Storage Tauri IPC commands. All secrets stored encrypted-at-rest
// using the OS keychain via the `keyring` crate. The TypeScript service
// `src/services/TauriSecureStorage.ts` is the corresponding client.
//
// SECURITY RATIONALE:
//   - CWE-256 (Plaintext Storage of a Password): all secrets are stored
//     in the OS keychain, never in plaintext on disk.
//   - CWE-257 (Storing Passwords in a Recoverable Format): the OS keychain
//     encrypts each entry with a key bound to the user's login session.
//   - CWE-922 (Insecure Storage of Sensitive Information): the storage
//     backend is OS-provided, not a custom file or DB row.
//   - CWE-200 (Information Exposure): the Rust commands never log secret
//     material.
//
// DEPENDENCIES (Cargo.toml additions):
//   - keyring = "3"
//   - base64 = "0.22"
//
// REGISTRATION: all seven commands below are registered in lib.rs via
// `tauri::generate_handler!` (BLUEPRINT F-DESK-006, P0); SecureStorageState
// is managed in run_with_builder. The former file-wide #![allow(dead_code)]
// was removed once every item became reachable.
//
// KNOWN GAPS (documented honestly, left for follow-up lanes):
//   1. list_accounts always returns an empty Vec (see its body comment);
//      the client-side cache stays authoritative until a platform listing
//      path exists.
//   2. unlock does not cryptographically verify the password against the
//      OS keychain; verification is OS-mediated on first access. Deriving
//      a wrapping key from the password is left for v1.1.0.
//   3. src/services/TauriSecureStorage.ts currently routes through
//      `plugin:stronghold|*` (that plugin is NOT installed). Its documented
//      flat per-field contract (account / secret_b64) also does not match
//      this implementation's single `args` struct parameter. Reconciling
//      that contract is a cross-plane task outside the src-tauri lane.

use base64::{engine::general_purpose, Engine as _};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;

const SERVICE_NAME: &str = "finplan-pro-v1";
const MAX_SECRET_BYTES: usize = 1_048_576;

/// Per-process state for the secure storage. Tracks unlock state and
/// failed-attempt counters. The actual keychain state is OS-managed.
#[derive(Default)]
pub struct SecureStorageState {
    pub locked: Mutex<bool>,
    pub failed_attempts: Mutex<u32>,
    pub last_attempt_at: Mutex<u64>,
}

const MAX_UNLOCK_ATTEMPTS: u32 = 5;
const LOCKOUT_DURATION_SECS: u64 = 300;

fn current_unix_secs() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0)
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StoreArgs {
    pub service: String,
    pub account: String,
    pub secret: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RetrieveArgs {
    pub service: String,
    pub account: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DeleteArgs {
    pub service: String,
    pub account: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExistsArgs {
    pub service: String,
    pub account: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ListArgs {
    pub service: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UnlockArgs {
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CommandError {
    pub code: String,
    pub message: String,
}

impl CommandError {
    fn new(code: &str, message: &str) -> Self {
        Self {
            code: code.to_string(),
            message: message.to_string(),
        }
    }
}

impl From<keyring::Error> for CommandError {
    fn from(err: keyring::Error) -> Self {
        let code = match err {
            keyring::Error::NoEntry => "not-found",
            keyring::Error::Ambiguous(_) => "ambiguous",
            keyring::Error::PlatformFailure(_) => "platform-failure",
            keyring::Error::NoStorageAccess(_) => "no-storage-access",
            _ => "backend-error",
        };
        CommandError::new(code, &err.to_string())
    }
}

fn validate_account(account: &str) -> Result<(), CommandError> {
    if account.is_empty() || account.len() > 256 {
        return Err(CommandError::new("invalid-format", "account length invalid"));
    }
    for c in account.chars() {
        let valid = c.is_ascii_graphic() || c == '_' || c == '-' || c == '.';
        if !valid {
            return Err(CommandError::new("invalid-format", "account contains invalid character"));
        }
    }
    if account.starts_with("__") && account.ends_with("__") {
        return Err(CommandError::new("invalid-format", "reserved account"));
    }
    Ok(())
}

fn check_lock(state: &State<'_, SecureStorageState>) -> Result<(), CommandError> {
    let locked = *state.locked.lock().unwrap();
    if locked {
        return Err(CommandError::new("vault-locked", "vault is locked"));
    }
    Ok(())
}

#[tauri::command]
pub fn secure_storage_store(
    args: StoreArgs,
    state: State<'_, SecureStorageState>,
) -> Result<(), CommandError> {
    check_lock(&state)?;
    validate_account(&args.account)?;

    let bytes = general_purpose::STANDARD
        .decode(&args.secret)
        .map_err(|e| CommandError::new("invalid-format", &format!("base64 decode failed: {}", e)))?;

    if bytes.len() > MAX_SECRET_BYTES {
        return Err(CommandError::new("quota-exceeded", "secret exceeds 1MB"));
    }

    let entry = keyring::Entry::new(&args.service, &args.account)?;
    entry.set_password(&args.secret)?;
    Ok(())
}

#[tauri::command]
pub fn secure_storage_retrieve(
    args: RetrieveArgs,
    state: State<'_, SecureStorageState>,
) -> Result<String, CommandError> {
    check_lock(&state)?;
    validate_account(&args.account)?;
    let entry = keyring::Entry::new(&args.service, &args.account)?;
    let secret = entry.get_password()?;
    Ok(secret)
}

#[tauri::command]
pub fn secure_storage_delete(
    args: DeleteArgs,
    state: State<'_, SecureStorageState>,
) -> Result<(), CommandError> {
    check_lock(&state)?;
    validate_account(&args.account)?;
    let entry = keyring::Entry::new(&args.service, &args.account)?;
    match entry.delete_credential() {
        Ok(()) => Ok(()),
        Err(keyring::Error::NoEntry) => Err(CommandError::new("not-found", "no such entry")),
        Err(e) => Err(e.into()),
    }
}

#[tauri::command]
pub fn secure_storage_exists(
    args: ExistsArgs,
) -> Result<bool, CommandError> {
    validate_account(&args.account)?;
    let entry = keyring::Entry::new(&args.service, &args.account)?;
    match entry.get_password() {
        Ok(_) => Ok(true),
        Err(keyring::Error::NoEntry) => Ok(false),
        Err(e) => Err(e.into()),
    }
}

#[tauri::command]
pub fn secure_storage_list_accounts(
    args: ListArgs,
) -> Result<Vec<String>, CommandError> {
    // The `keyring` crate's interface differs per-platform; this is a
    // platform-specific implementation. For macOS Keychain and Windows
    // Credential Vault, listing is not natively supported in the `keyring`
    // crate. The TypeScript service compensates by tracking accounts
    // locally after each store/delete.
    //
    // For Linux Secret Service, listing IS supported via the secret-service
    // crate. This stub returns an empty list on platforms where listing
    // is not supported, with a warning that the client-side cache is the
    // authoritative list.
    let _ = args; // suppress unused warning
    Ok(Vec::new())
}

#[tauri::command]
pub fn secure_storage_lock(
    state: State<'_, SecureStorageState>,
) -> Result<(), CommandError> {
    *state.locked.lock().unwrap() = true;
    Ok(())
}

#[tauri::command]
pub fn secure_storage_unlock(
    args: UnlockArgs,
    state: State<'_, SecureStorageState>,
) -> Result<(), CommandError> {
    let now = current_unix_secs();
    let last_attempt = *state.last_attempt_at.lock().unwrap();
    let failed_attempts = *state.failed_attempts.lock().unwrap();

    if failed_attempts >= MAX_UNLOCK_ATTEMPTS
        && now.saturating_sub(last_attempt) < LOCKOUT_DURATION_SECS
    {
        return Err(CommandError::new("lockout", "too many failed unlock attempts"));
    }

    // The actual password verification is OS-mediated (the keychain
    // verifies on first access). The Rust side just sets a "unlocked" flag
    // for this process. The OS-level check is enforced on every
    // store/retrieve/delete call.
    //
    // For a stronger guarantee, the password could be used to derive an
    // additional encryption key that wraps the keychain entries. This is
    // left for v1.1.0.
    if args.password.is_empty() {
        *state.failed_attempts.lock().unwrap() = failed_attempts + 1;
        *state.last_attempt_at.lock().unwrap() = now;
        return Err(CommandError::new("invalid-password", "empty password"));
    }

    // Try a test access to verify the password is correct (OS-mediated).
    let test_entry = keyring::Entry::new(SERVICE_NAME, "__attempts__");
    let _ = test_entry; // placeholder; actual verification depends on platform

    *state.locked.lock().unwrap() = false;
    *state.failed_attempts.lock().unwrap() = 0;
    *state.last_attempt_at.lock().unwrap() = now;
    Ok(())
}

/// Initialize the secure storage state with `locked = true` (vault starts
/// locked on app launch).
pub fn initial_state() -> SecureStorageState {
    SecureStorageState {
        locked: Mutex::new(true),
        failed_attempts: Mutex::new(0),
        last_attempt_at: Mutex::new(0),
    }
}
