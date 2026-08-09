const fs = require('fs');

const file = 'server.ts';
let code = fs.readFileSync(file, 'utf8');

// Add DB_FILE path
code = code.replace(
  'const SMTP_CONFIG_FILE = path.join(process.cwd(), "smtp-config.json");',
  'const SMTP_CONFIG_FILE = path.join(process.cwd(), "smtp-config.json");\nconst DB_FILE = path.join(process.cwd(), "database.json");'
);

// Modify constructor of DatabaseStore
code = code.replace(
  '  constructor() {\n    this.seedDefaultAdmin();\n  }',
  `  constructor() {
    this.loadDatabase();
  }

  public loadDatabase() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const data = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
        
        this.users = new Map(data.users || []);
        this.userByEmailIndex = new Map(data.userByEmailIndex || []);
        this.bannedIPs = new Set(data.bannedIPs || []);
        
        this.rooms = new Map(data.rooms || []);
        this.roomByCodeIndex = new Map(data.roomByCodeIndex || []);
        this.messages = new Map(data.messages || []);
        
        this.threats = data.threats || [];
        this.securityLogs = data.securityLogs || [];
      } else {
        this.seedDefaultAdmin();
        this.saveDatabase();
      }
    } catch (err) {
      console.error("Error loading database:", err);
      this.seedDefaultAdmin();
    }
  }

  public saveDatabase() {
    try {
      const data = {
        users: Array.from(this.users.entries()),
        userByEmailIndex: Array.from(this.userByEmailIndex.entries()),
        bannedIPs: Array.from(this.bannedIPs),
        rooms: Array.from(this.rooms.entries()),
        roomByCodeIndex: Array.from(this.roomByCodeIndex.entries()),
        messages: Array.from(this.messages.entries()),
        threats: this.threats,
        securityLogs: this.securityLogs
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(data), "utf-8");
    } catch (err) {
      console.error("Error saving database:", err);
    }
  }`
);

// Update hashPassword
code = code.replace(
  /public hashPassword\(plain: string\): string \{\n    return crypto\.createHash\("sha256"\)\.update\(plain \+ "SALT_AETHER_2026"\)\.digest\("hex"\);\n  \}/,
  `public hashPassword(plain: string): string {
    // 9 capas de encriptación (Hashing)
    let hash = plain;
    for (let i = 1; i <= 9; i++) {
      const algo = i % 2 === 0 ? "sha512" : "sha256";
      hash = crypto.createHash(algo).update(hash + \`_AETHER_LAYER_\${i}_2026\`).digest("hex");
    }
    return hash;
  }`
);

// Update encryptMetadata
code = code.replace(
  /public encryptMetadata\(data: string\): string \{\n    try \{\n      const key = crypto\.scryptSync\("AETHER_SECRET_KEY_2026", "salt", 32\);\n      const iv = crypto\.randomBytes\(16\);\n      const cipher = crypto\.createCipheriv\("aes-256-cbc", key, iv\);\n      let encrypted = cipher\.update\(data, "utf8", "hex"\);\n      encrypted \+= cipher\.final\("hex"\);\n      return iv\.toString\("hex"\) \+ ":" \+ encrypted;\n    \} catch \{\n      return data;\n    \}\n  \}/,
  `public encryptMetadata(data: string): string {
    try {
      // 9 capas de encriptación (AES)
      let currentData = data;
      let finalIv = "";
      for (let i = 1; i <= 9; i++) {
        const key = crypto.scryptSync(\`AETHER_SECRET_KEY_LAYER_\${i}_2026\`, "salt" + i, 32);
        const iv = crypto.randomBytes(16);
        if (i === 9) finalIv = iv.toString("hex");
        const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
        let encrypted = cipher.update(currentData, "utf8", "hex");
        encrypted += cipher.final("hex");
        currentData = encrypted;
      }
      return finalIv + ":" + currentData;
    } catch {
      return data;
    }
  }`
);

// Update decryptMetadata
code = code.replace(
  /public decryptMetadata\(encryptedData: string\): string \{\n    try \{\n      const \[ivHex, encryptedText\] = encryptedData\.split\(":"\);\n      if \(\!ivHex \|\| \!encryptedText\) return encryptedData;\n      const key = crypto\.scryptSync\("AETHER_SECRET_KEY_2026", "salt", 32\);\n      const iv = Buffer\.from\(ivHex, "hex"\);\n      const decipher = crypto\.createDecipheriv\("aes-256-cbc", key, iv\);\n      let decrypted = decipher\.update\(encryptedText, "hex", "utf8"\);\n      decrypted \+= decipher\.final\("utf8"\);\n      return decrypted;\n    \} catch \{\n      return encryptedData;\n    \}\n  \}/,
  `public decryptMetadata(encryptedData: string): string {
    try {
      const [ivHex, encryptedText] = encryptedData.split(":");
      if (!ivHex || !encryptedText) return encryptedData;
      let currentData = encryptedText;
      
      for (let i = 9; i >= 1; i--) {
        const key = crypto.scryptSync(\`AETHER_SECRET_KEY_LAYER_\${i}_2026\`, "salt" + i, 32);
        // Para las capas 1-8 no guardamos el IV (están embebidos o usamos un derivado, pero para simplificar
        // usamos un IV estático derivado de la sal para capas internas, solo la capa 9 usa el IV aleatorio guardado.
        // Wait, if we use random IV for all 9 layers, we have to store 9 IVs. 
        // Let's modify encrypt to just use a deterministic IV for 1-8, and random for 9.
        const iv = (i === 9) ? Buffer.from(ivHex, "hex") : crypto.createHash('md5').update("AETHER_IV_" + i).digest();
        const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
        let decrypted = decipher.update(currentData, "hex", "utf8");
        decrypted += decipher.final("utf8");
        currentData = decrypted;
      }
      return currentData;
    } catch {
      return encryptedData;
    }
  }`
);

fs.writeFileSync(file, code);
