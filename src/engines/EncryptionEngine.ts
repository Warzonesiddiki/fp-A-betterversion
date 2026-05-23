// Encryption Engine - AES-256 encryption for sensitive fields
// Pure TypeScript, no external dependencies

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  salt: string;
  algorithm: string;
}

export class EncryptionEngine {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;
  private static readonly IV_LENGTH = 12;
  private static readonly SALT_LENGTH = 16;
  private static readonly ITERATIONS = 100000;

  static async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: this.ITERATIONS, hash: 'SHA-256' },
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
    const key = await this.deriveKey(password, salt);
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
    };
  }

  static async decrypt(data: EncryptedData, password: string): Promise<string> {
    const salt = this.base64ToBuffer(data.salt);
    const iv = this.base64ToBuffer(data.iv);
    const ciphertext = this.base64ToBuffer(data.ciphertext);
    const key = await this.deriveKey(password, new Uint8Array(salt));
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
    return `enc:${btoa(JSON.stringify(encrypted))}`;
  }

  static async decryptField<T>(encryptedStr: string, password: string): Promise<T> {
    if (!encryptedStr.startsWith('enc:')) throw new Error('Not an encrypted field');
    const json = atob(encryptedStr.slice(4));
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
      binary += String.fromCharCode(bytes[i]);
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
