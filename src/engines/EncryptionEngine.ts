// Encryption Engine - AES-256 encryption for sensitive fields
// Pure TypeScript, no external dependencies

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  salt: string;
  algorithm: string;
  // SECURITY (Phase 7 audit, Hephaestus PATCH 5): added iterations field for backward-compat decryption. Old data without this field falls back to ITERATIONS_LEGACY (100,000).
  iterations: number;
}

export class EncryptionEngine {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;
  private static readonly IV_LENGTH = 12;
  private static readonly SALT_LENGTH = 16;
  // SECURITY (Phase 7 audit, Hephaestus PATCH 5): OWASP 2023 recommends 600,000 PBKDF2-HMAC-SHA256 iterations. Bumped from 100,000. Iteration count is stored in EncryptedData.iterations for backward compat — old ciphertexts decrypt with their original count.
  private static readonly ITERATIONS = 600000;
  // SECURITY (PATCH 5): LEGACY constant retained for decrypting pre-PATCH-5 data that lacks the iterations field.
  private static readonly ITERATIONS_LEGACY = 100000;

  static async deriveKey(password: string, salt: Uint8Array, iterations: number = EncryptionEngine.ITERATIONS): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: salt as BufferSource, iterations: iterations, hash: 'SHA-256' },
      keyMaterial,
      { name: this.ALGORITHM, length: this.KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    );
  }

  static async encrypt(plaintext: string, password: string): Promise<EncryptedData> {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));
    const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
    const key = await this.deriveKey(password, salt, this.ITERATIONS);
    const encrypted = await crypto.subtle.encrypt(
      { name: this.ALGORITHM, iv },
      key,
      encoder.encode(plaintext)
    );
    return {
      ciphertext: this.bufferToBase64(encrypted),
      iv: this.bufferToBase64(iv.buffer),
      salt: this.bufferToBase64(salt.buffer),
      algorithm: this.ALGORITHM,
      // SECURITY (PATCH 5): record iteration count for backward-compat decryption
      iterations: this.ITERATIONS,
    };
  }

  static async decrypt(data: EncryptedData, password: string): Promise<string> {
    const salt = this.base64ToBuffer(data.salt);
    const iv = this.base64ToBuffer(data.iv);
    const ciphertext = this.base64ToBuffer(data.ciphertext);
    const key = await this.deriveKey(password, new Uint8Array(salt), data.iterations ?? this.ITERATIONS_LEGACY);
    const decrypted = await crypto.subtle.decrypt(
      { name: this.ALGORITHM, iv: new Uint8Array(iv) },
      key,
      ciphertext
    );
    return new TextDecoder().decode(decrypted);
  }

  static async encryptField(value: unknown, password: string): Promise<string> {
    const json = JSON.stringify(value);
    const encrypted = await this.encrypt(json, password);
    return `enc:${this.bufferToBase64(new TextEncoder().encode(JSON.stringify(encrypted)).buffer)}`;
  }

  static async decryptField<T>(encryptedStr: string, password: string): Promise<T> {
    if (!encryptedStr.startsWith('enc:')) throw new Error('Not an encrypted field');
    const json = new TextDecoder().decode(this.base64ToBuffer(encryptedStr.slice(4)));
    const data: EncryptedData = JSON.parse(json);
    const decrypted = await this.decrypt(data, password);
    return JSON.parse(decrypted);
  }

  static isEncrypted(value: unknown): boolean {
    return typeof value === 'string' && value.startsWith('enc:');
  }

  private static bufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]!);
    }
    return btoa(binary);
  }

  private static base64ToBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}
