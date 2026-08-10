export const CryptoEngine = {
  async generateRoomKey(secret: string): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      enc.encode(secret.padEnd(32, "0").slice(0, 32)),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );
    return await window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: enc.encode("AETHER_AES_GCM_SALT_2026"),
        iterations: 100000,
        hash: "SHA-256"
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  },
  async encryptMessage(key: CryptoKey, plaintext: string): Promise<string> {
    try {
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encoded = new TextEncoder().encode(plaintext);
      const ciphertext = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
      
      const result = new Uint8Array(iv.length + ciphertext.byteLength);
      result.set(iv, 0);
      result.set(new Uint8Array(ciphertext), iv.length);
      
      let binary = '';
      for (let i = 0; i < result.length; i++) {
        binary += String.fromCharCode(result[i]);
      }
      return btoa(binary);
    } catch (e) {
      console.error("Encryption error:", e);
      return plaintext; // Fallback so it doesn't break chat
    }
  },
  async decryptMessage(key: CryptoKey, ciphertextB64: string): Promise<string> {
    try {
      // If the text is plain (e.g. from fallback or system), atob will likely fail or we can catch it.
      // But let's check if it's base64 first loosely.
      if (!/^[A-Za-z0-9+/=]+$/.test(ciphertextB64)) {
        return ciphertextB64;
      }

      const binary = atob(ciphertextB64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      
      const iv = bytes.slice(0, 12);
      const data = bytes.slice(12);
      const decrypted = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
      
      return new TextDecoder().decode(decrypted);
    } catch {
      return "[Mensaje cifrado no desencriptable con esta clave]";
    }
  }
};
