# Tauri Updater Public Key Rotation

## Current Key (Placeholder)

The current `pubkey` in `src-tauri/tauri.conf.json` is a **placeholder** and must be replaced before production release.

```
pubkey: "dW50cmFja2VkIHB1YmtleSAtIGdlbmVyYXRlIHdpdGggdGF1cmkgc2lnbmVyIGFuZCBzdG9yZSBzZWN1cmVseQ=="
```

## Generating a Real Key Pair

Run the Tauri signer to generate a new key pair:

```bash
# Install Tauri CLI if not already installed
cargo install tauri-cli --version ^2.0

# Generate key pair
tauri signer generate -w ~/.tauri/finplan-pro.key
```

This creates:
- `~/.tauri/finplan-pro.key` (private key - **KEEP SECURE**)
- `~/.tauri/finplan-pro.key.pub` (public key - add to `tauri.conf.json`)

## Updating the Configuration

1. Copy the public key content from `~/.tauri/finplan-pro.key.pub`
2. Replace the `pubkey` value in `src-tauri/tauri.conf.json`
3. Commit the updated `tauri.conf.json` (public key only)

**Never commit the private key.**

## Key Rotation Procedure

### When to Rotate
- Annual rotation (recommended)
- Suspected private key compromise
- Team member with access leaves
- Major version release

### Rotation Steps

1. **Generate new key pair**
   ```bash
   tauri signer generate -w ~/.tauri/finplan-pro-new.key
   ```

2. **Update `tauri.conf.json`** with new public key

3. **Sign the update** with the **old** private key (for backward compatibility)
   ```bash
   tauri signer sign -w ~/.tauri/finplan-pro.key \
     --app-path ./target/release/bundle/nsis/FinPlan_Pro_1.0.0_x64_en-US.msi
   ```

4. **Publish update** - clients will verify with old key, then trust new key for future updates

5. **After 2 release cycles**, you can switch to signing with the new key only

6. **Archive old private key** securely

## CI/CD Integration

For automated releases, store the private key in GitHub Secrets:
- `TAURI_PRIVATE_KEY` - the private key content
- `TAURI_KEY_PASSWORD` - if key is password-protected

Example release workflow step:
```yaml
- name: Sign Tauri artifacts
  uses: tauri-apps/tauri-action@v0
  env:
    TAURI_PRIVATE_KEY: ${{ secrets.TAURI_PRIVATE_KEY }}
    TAURI_KEY_PASSWORD: ${{ secrets.TAURI_KEY_PASSWORD }}
```

## Security Notes

- Private key must never leave secure storage
- Use hardware security module (HSM) for production
- Rotate keys annually at minimum
- Monitor for unauthorized updates
- Keep key generation offline when possible