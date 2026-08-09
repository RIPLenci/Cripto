// AES-256-GCM and WebCrypto E2EE Encryption Engine

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
    let currentData = new TextEncoder().encode(plaintext);
    const ivs = [];
    
    // Capa 1 a 9 de cifrado
    for (let i = 0; i < 9; i++) {
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      ivs.push(iv);
      const ciphertext = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        currentData
      );
      currentData = new Uint8Array(ciphertext);
    }
    
    // Empaquetar IVs y Data
    let totalIvLength = 12 * 9;
    const result = new Uint8Array(totalIvLength + currentData.byteLength);
    for(let i=0; i<9; i++) {
       result.set(ivs[i], i * 12);
    }
    result.set(currentData, totalIvLength);
    return btoa(String.fromCharCode(...result));
  },

  async decryptMessage(key: CryptoKey, ciphertextB64: string): Promise<string> {
    try {
      const binary = atob(ciphertextB64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      
      const totalIvLength = 12 * 9;
      const ivs = [];
      for(let i=0; i<9; i++) {
         ivs.push(bytes.slice(i*12, (i+1)*12));
      }
      let currentData = bytes.slice(totalIvLength);
      
      // Descifrar 9 capas en reverso
      for (let i = 8; i >= 0; i--) {
        const decrypted = await window.crypto.subtle.decrypt(
          { name: "AES-GCM", iv: ivs[i] },
          key,
          currentData
        );
        currentData = new Uint8Array(decrypted);
      }
      
      return new TextDecoder().decode(currentData);
    } catch {
      return "[Mensaje cifrado no desencriptable con esta clave]";
    }
  }
};
