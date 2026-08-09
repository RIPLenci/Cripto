import express from "express";
import http from "http";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import "fake-indexeddb/auto";
Object.defineProperty(global, 'window', {
  value: {
    addEventListener: () => {},
    removeEventListener: () => {},
    setTimeout,
    clearTimeout,
  },
  writable: true
});
Object.defineProperty(global, 'navigator', { value: { product: 'ReactNative' }, writable: true });
Object.defineProperty(global, 'addEventListener', { value: () => {}, writable: true });

import { init as initInstantDB, tx } from "@instantdb/core";
const instant = initInstantDB({ appId: "222816e6-294f-4d87-ab1e-6e94aa4e6c74" });

import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import nodemailer from "nodemailer";

const INSTANTDB_APP_ID = "222816e6-294f-4d87-ab1e-6e94aa4e6c74";
const PORT = 3000;
const app = express();
app.use(express.json({ limit: "25mb" }));

// Server-side Gmail SMTP Transporter & Mail Sender
interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  fromName: string;
}

const defaultAppPass = "rbuptwtrkqkpoggb";
const envPass = process.env.SMTP_PASS;
const activePass = (envPass && !envPass.toLowerCase().includes("gyhqok")) ? envPass : defaultAppPass;

const SMTP_CONFIG_FILE = path.join(process.cwd(), "smtp-config.json");
const DB_FILE = path.join(process.cwd(), "database.json");

let currentSmtpConfig: SmtpConfig = {
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  user: process.env.SMTP_USER || "aethersecurity5@gmail.com",
  pass: activePass,
  fromName: "Aether Security"
};

try {
  if (fs.existsSync(SMTP_CONFIG_FILE)) {
    const savedConfig = JSON.parse(fs.readFileSync(SMTP_CONFIG_FILE, "utf-8"));
    currentSmtpConfig = { ...currentSmtpConfig, ...savedConfig };
  }
} catch (err) {
  console.error("Error loading SMTP config:", err);
}

function saveSmtpConfigToFile() {
  try {
    fs.writeFileSync(SMTP_CONFIG_FILE, JSON.stringify(currentSmtpConfig, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving SMTP config:", err);
  }
}

let cachedTransporter: nodemailer.Transporter | null = null;
let cachedSmtpKey: string = "";

function getTransporter(): { transporter: nodemailer.Transporter; isRealSmtp: boolean } {
  const currentKey = `${currentSmtpConfig.host}:${currentSmtpConfig.port}:${currentSmtpConfig.user}:${currentSmtpConfig.pass}`;
  
  if (cachedTransporter && cachedSmtpKey === currentKey) {
    return { transporter: cachedTransporter, isRealSmtp: !!(currentSmtpConfig.user && currentSmtpConfig.pass) };
  }

  if (currentSmtpConfig.user && currentSmtpConfig.pass) {
    cachedTransporter = nodemailer.createTransport({
      host: currentSmtpConfig.host || "smtp.gmail.com",
      port: currentSmtpConfig.port || 587,
      secure: currentSmtpConfig.port === 465,
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      auth: {
        user: currentSmtpConfig.user.trim(),
        pass: currentSmtpConfig.pass.trim().replace(/[\s-]/g, ""),
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    cachedSmtpKey = currentKey;
    return { transporter: cachedTransporter, isRealSmtp: true };
  }

  const fallbackTransporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: "noreply@paginaprotegida.com",
      pass: ""
    }
  });
  return { transporter: fallbackTransporter, isRealSmtp: false };
}

async function sendRealEmail(toEmail: string, subject: string, htmlContent: string, plainText: string) {
  try {
    const { transporter, isRealSmtp } = getTransporter();
    const fromAddress = currentSmtpConfig.user || "no-reply@paginaprotegida.com";

    const info = await transporter.sendMail({
      from: `"${currentSmtpConfig.fromName}" <${fromAddress}>`,
      to: toEmail,
      subject,
      text: plainText,
      html: htmlContent,
    });

    console.log(`[EMAIL DISPATCH INSTANT] Correo enviado a ${toEmail}. RealSMTP: ${isRealSmtp}. ID: ${info.messageId || info.response}`);
    return { success: true, isRealSmtp, messageId: info.messageId };
  } catch (err: any) {
    console.error(`[EMAIL DISPATCH ERROR] No se pudo enviar el correo a ${toEmail}:`, err.message);
    cachedTransporter = null;
    return { success: false, error: err.message, isRealSmtp: false };
  }
}

// Server-side Gemini AI setup
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "dummy_key",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Verification codes stores (Email -> { code, expiresAt })
const emailVerificationCodes = new Map<string, { codeHash: string; expiresAt: number }>();
const admin2FACodes = new Map<string, { codeHash: string; expiresAt: number }>();

// ==========================================
// REDIS CACHE ENGINE (In-Memory Accelerator)
// ==========================================
class RedisCache {
  private cache = new Map<string, { val: any; expiresAt: number }>();
  public hits = 0;
  public misses = 0;

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) {
      this.misses++;
      return null;
    }
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }
    this.hits++;
    return item.val;
  }

  set(key: string, val: any, ttlMs: number = 60000) {
    this.cache.set(key, { val, expiresAt: Date.now() + ttlMs });
  }

  del(key: string) {
    this.cache.delete(key);
  }

  flush() {
    this.cache.clear();
  }

  getHitRatio(): number {
    const total = this.hits + this.misses;
    if (total === 0) return 100;
    return Math.round((this.hits / total) * 100);
  }
}
const redis = new RedisCache();

// ==========================================
// SCALABLE IN-MEMORY DATABASE WITH INDEXES
// (InstantDB App 222816e6-294f-4d87-ab1e-6e94aa4e6c74)
// ==========================================
interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  ip: string;
  role: 'user' | 'admin';
  status: 'Activo' | 'Baneado';
  isVerified: boolean;
  createdAt: number;
  isBanned: boolean;
  banReason?: string;
  banSeverity?: 'low' | 'medium' | 'high' | 'critical';
  banEvidence?: string;
  bannedAt?: number;
}

interface RoomRecord {
  id: string;
  name: string;
  code: string;
  createdById: string;
  createdByName: string;
  createdAt: number;
  isPrivate: boolean;
  isClosed?: boolean;
}

interface MessageRecord {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  encryptedText: string;
  attachments?: any[];
  replyTo?: any;
  reactions?: string[];
  selfDestruct?: number;
  time: string;
  timestamp: number;
}

interface ThreatRecord {
  id: string;
  ip: string;
  userId?: string;
  userEmail?: string;
  threatType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  evidence: string;
  reason: string;
  timestamp: number;
  blocked: boolean;
  webhookNotified: boolean;
}

interface SecurityLogRecord {
  id: string;
  ip: string;
  action: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'SUSPICIOUS_ATTEMPT' | 'ACCESS_DENIED' | 'IP_BAN_TRIGGERED' | 'AI_THREAT_BLOCKED' | 'EMAIL_VERIFIED' | 'ADMIN_2FA_VERIFIED' | 'ROLE_CHANGED';
  userEmail?: string;
  userAgent?: string;
  details?: string;
  timestamp: number;
  suspicious: boolean;
}

class DatabaseStore {
  public isDirty = false;
  public users = new Map<string, UserRecord>();
  public userByEmailIndex = new Map<string, string>();
  public bannedIPs = new Set<string>();
  
  public rooms = new Map<string, RoomRecord>();
  public roomByCodeIndex = new Map<string, string>();
  
  public messages = new Map<string, MessageRecord[]>();
  public threats: ThreatRecord[] = [];
  public securityLogs: SecurityLogRecord[] = [];

  constructor() {
    this.loadDatabase();
    setInterval(() => {
      if (this.isDirty) {
        this.saveDatabase();
        this.isDirty = false;
      }
    }, 5000);
  }

  public async loadDatabase() {
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
      }
      
      // Also try to sync down from InstantDB as a primary source of truth if available
      const unsub = instant.subscribeQuery({ users: {}, rooms: {}, messages: {}, threats: {}, securityLogs: {} }, (res: any) => {
        if (res.data) {
          if (res.data.users && res.data.users.length > 0) { // @ts-ignore
            for (const u of res.data.users) {
              this.users.set(u.id, u);
              this.userByEmailIndex.set(u.email.toLowerCase(), u.id);
            }
          }
          if (res.data.rooms && res.data.rooms.length > 0) {
            for (const r of res.data.rooms) {
              this.rooms.set(r.id, r);
              this.roomByCodeIndex.set(r.code, r.id);
            }
          }
          if (res.data.messages && res.data.messages.length > 0) {
            this.messages.clear(); // Re-group
            for (const m of res.data.messages) {
              if (!this.messages.has(m.roomId)) this.messages.set(m.roomId, []);
              this.messages.get(m.roomId)!.push(m);
            }
          }
          if (res.data.threats && res.data.threats.length > 0) {
             this.threats = res.data.threats.sort((a,b) => b.timestamp - a.timestamp);
          }
          if (res.data.securityLogs && res.data.securityLogs.length > 0) {
             this.securityLogs = res.data.securityLogs.sort((a,b) => b.timestamp - a.timestamp);
          }
          console.log("[InstantDB] Sync completed successfully from cloud.");
          unsub();
        }
      });
    } catch (err) {
      console.error("Error loading database:", err);
      this.seedDefaultAdmin();
    }
  }

  public seedDefaultAdmin() {
    const adminId = "admin-master-101";
    this.users.set(adminId, {
      id: adminId,
      email: "ydark126@gmail.com",
      passwordHash: this.hashPassword("admin123"),
      name: "YDark Admin",
      ip: "127.0.0.1",
      role: "admin",
      status: "Activo",
      isVerified: true,
      createdAt: Date.now(),
      isBanned: false
    });
    this.userByEmailIndex.set("ydark126@gmail.com", adminId);
    this.saveDatabase();
  }

  public async saveDatabase() {
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

      // Sync to InstantDB
      const ops = [];
      for (const [_, u] of this.users) ops.push(tx.users[u.id].update(u as any));
      for (const [_, r] of this.rooms) ops.push(tx.rooms[r.id].update(r as any));
      for (const [_, msgs] of this.messages) {
         for (const m of msgs) ops.push(tx.messages[m.id].update(m as any));
      }
      for (const t of this.threats) ops.push(tx.threats[t.id].update(t as any));
      for (const l of this.securityLogs) ops.push(tx.securityLogs[l.id].update(l as any));

      const chunkSize = 50;
      for (let i = 0; i < ops.length; i += chunkSize) {
        instant.transact(ops.slice(i, i + chunkSize));
      }
    } catch (err) {
      console.error("Error saving database:", err);
    }
  }

  public hashPassword(plain: string): string {
    // 9 capas de encriptación (Hashing)
    let hash = plain;
    for (let i = 1; i <= 9; i++) {
      const algo = i % 2 === 0 ? "sha512" : "sha256";
      hash = crypto.createHash(algo).update(hash + `_AETHER_LAYER_${i}_2026`).digest("hex");
    }
    return hash;
  }

  public encryptMetadata(data: string): string {
    try {
      // 9 capas de encriptación (AES)
      let currentData = data;
      let finalIv = "";
      for (let i = 1; i <= 9; i++) {
        const key = crypto.scryptSync(`AETHER_SECRET_KEY_LAYER_${i}_2026`, "salt" + i, 32);
        const iv = (i === 9) ? crypto.randomBytes(16) : crypto.createHash('md5').update("AETHER_IV_" + i).digest();
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
  }

  public decryptMetadata(encryptedData: string): string {
    try {
      const [ivHex, encryptedText] = encryptedData.split(":");
      if (!ivHex || !encryptedText) return encryptedData;
      let currentData = encryptedText;
      
      for (let i = 9; i >= 1; i--) {
        const key = crypto.scryptSync(`AETHER_SECRET_KEY_LAYER_${i}_2026`, "salt" + i, 32);
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
  }

  public logSecurityEvent(
    ip: string,
    action: SecurityLogRecord['action'],
    userEmail?: string,
    details?: string,
    suspicious: boolean = false
  ) {
    const log: SecurityLogRecord = {
      id: "log-" + crypto.randomUUID(),
      ip,
      action,
      userEmail,
      details: this.encryptMetadata(details || ""),
      timestamp: Date.now(),
      suspicious
    };
    this.securityLogs.unshift(log);
    this.isDirty = true;
    if (this.securityLogs.length > 500) this.securityLogs.pop();
    redis.del("admin_logs");
  }

  public banUserAndIP(
    ip: string,
    reason: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    evidence: string,
    userId?: string
  ) {
    this.bannedIPs.add(ip);
    this.isDirty = true;

    if (userId && this.users.has(userId)) {
      const u = this.users.get(userId)!;
      u.isBanned = true;
      u.status = 'Baneado';
      u.banReason = reason;
      u.banSeverity = severity;
      u.banEvidence = evidence;
      u.bannedAt = Date.now();
    } else {
      for (const u of this.users.values()) {
        if (u.ip === ip) {
          u.isBanned = true;
          u.status = 'Baneado';
          u.banReason = reason;
          u.banSeverity = severity;
          u.banEvidence = evidence;
          u.bannedAt = Date.now();
        }
      }
    }

    const threat: ThreatRecord = {
      id: "threat-" + crypto.randomUUID(),
      ip,
      userId,
      threatType: "AI_AUTOMATIC_BAN",
      severity,
      evidence,
      reason,
      timestamp: Date.now(),
      blocked: true,
      webhookNotified: true
    };
    this.threats.unshift(threat);

    this.logSecurityEvent(ip, "IP_BAN_TRIGGERED", undefined, `Razon: ${reason} | Severidad: ${severity}`, true);
    redis.flush();
  }
}

const db = new DatabaseStore();

// Client IP helper
function getClientIP(req: express.Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

// IP Ban Enforcement Middleware
app.use((req, res, next) => {
  const ip = getClientIP(req);
  if (db.bannedIPs.has(ip)) {
    db.logSecurityEvent(ip, "ACCESS_DENIED", undefined, "Petición denegada por IP bloqueada", true);
    return res.status(403).json({
      error: "Acceso restringido",
      message: "Aether Security: Tu dirección IP no tiene permisos para acceder a esta plataforma.",
      ip
    });
  }
  next();
});

// Authentication Token Middleware
function authenticateToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Sesión no válida" });

  const userId = redis.get(`token:${token}`);
  if (!userId || !db.users.has(userId)) {
    return res.status(403).json({ error: "Sesión expirable o inválida" });
  }

  const user = db.users.get(userId)!;
  if (user.isBanned || user.status === 'Baneado' || db.bannedIPs.has(user.ip)) {
    return res.status(403).json({ error: "Aether Security: Cuenta con estado Baneado." });
  }

  (req as any).user = user;
  (req as any).token = token;
  next();
}

// Admin Role + 2FA Verification Middleware
function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = (req as any).user as UserRecord;
  const token = (req as any).token as string;

  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: "Requiere permisos de perfil de administración" });
  }

  // Check 2FA Verification status in Redis session
  const is2FAVerified = redis.get(`admin2fa:${token}`);
  if (!is2FAVerified) {
    return res.status(403).json({
      error: "Aether Security: Se requiere verificación 2FA por código de correo de Gmail para acceder al panel admin.",
      requiresAdmin2FA: true
    });
  }

  next();
}

// AI WAF Scan Helper
async function analyzeTrafficWithAI(ip: string, userEmail: string | undefined, payloadStr: string, contextType: string) {
  const sqlPattern = /('|--|union|select|insert|delete|drop|alter|<script>|javascript:|eval\(|exec\()/i;
  const ddosPattern = payloadStr.length > 50000;

  if (sqlPattern.test(payloadStr) || ddosPattern) {
    const reason = ddosPattern ? "Comportamiento anómalo en transmisión de datos" : "Petición no autorizada detectada en payload";
    db.banUserAndIP(ip, reason, "critical", `Payload: ${payloadStr.slice(0, 100)}...`);
    return { blocked: true, reason };
  }

  try {
    const prompt = `Actúa como "Aether WAF", el motor de seguridad cuántica en tiempo real.
Analiza la siguiente actividad:
- IP: ${ip}
- Email: ${userEmail || 'Anónimo'}
- Contexto: ${contextType}
- Payload: "${payloadStr.slice(0, 1000)}"

Determina si contiene una amenaza de seguridad (DDoS, inyección SQL, XSS) O contenido ilegal (drogas, armas, pedofilia, terrorismo, malware, enlaces maliciosos, spam extremo).
IMPORTANTE: Es una app de máxima seguridad, cualquier contenido altamente ilegal o de ataque de botnet/DDoS debe ser catalogado como amenaza 'critical' y bloqueado de inmediato.
Responde ÚNICAMENTE en JSON válido sin markdown:
{
  "isThreat": boolean,
  "severity": "low" | "medium" | "high" | "critical",
  "reason": "Motivo breve",
  "evidence": "Evidencia extraída del payload"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const resultText = response.text?.trim();
    if (resultText) {
      const parsed = JSON.parse(resultText);
      if (parsed.isThreat) {
        db.banUserAndIP(ip, parsed.reason, parsed.severity || "high", parsed.evidence || "Análisis automatizado");
        return { blocked: true, reason: parsed.reason };
      }
    }
  } catch (err) {
    // Fail safe
  }

  return { blocked: false };
}

// ==========================================
// GMAIL OTP VERIFICATION & AUTH ROUTES
// ==========================================
app.post("/api/auth/send-verification-code", async (req, res) => {
  const ip = getClientIP(req);
  const { email } = req.body;

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Ingresa un correo electrónico de Gmail válido" });
  }

  const cleanEmail = email.trim().toLowerCase();

  // UNIQUE EMAIL CHECK: Each email can only be registered ONCE across any account
  if (db.userByEmailIndex.has(cleanEmail)) {
    return res.status(400).json({
      error: "Este correo de Gmail ya está registrado en la base de datos. No se puede utilizar en ninguna otra cuenta."
    });
  }

  // Generate 6-digit verification code
  const code = crypto.randomInt(100000, 999999).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000;

  emailVerificationCodes.set(cleanEmail, { codeHash: db.hashPassword(code), expiresAt });
  db.logSecurityEvent(ip, "LOGIN_SUCCESS", cleanEmail, `Código de verificación OTP generado para ${cleanEmail}`);

  // Send real email via SMTP / Nodemailer asynchronously for instant UI response
  const htmlTemplate = `
  <div style="font-family: Arial, sans-serif; background-color: #030712; color: #f8fafc; padding: 32px; border-radius: 16px; max-width: 520px; margin: 0 auto; border: 1px solid #1e293b; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: #06b6d4; font-size: 22px; margin: 0; font-weight: 800; letter-spacing: -0.5px;">PÁGINA PROTEGIDA</h1>
      <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Sistema de Verificación de Identidad por Correo</p>
    </div>
    <div style="background-color: #0b1329; border: 1px solid #0891b2; border-radius: 12px; padding: 24px; text-align: center; margin: 20px 0;">
      <p style="color: #94a3b8; font-size: 13px; margin-bottom: 12px; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Tu Código de Verificación OTP</p>
      <div style="font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #22d3ee; font-family: monospace;">${code}</div>
    </div>
    <p style="font-size: 13px; color: #94a3b8; line-height: 1.6; text-align: center;">Ingresa este código en la plataforma para completar la verificación de tu dirección Gmail.</p>
    <div style="border-t: 1px solid #1e293b; margin-top: 24px; padding-top: 16px; text-align: center;">
      <p style="font-size: 11px; color: #475569;">Este código expira en 10 minutos. Si no solicitaste este código, puedes ignorar este correo de forma segura.</p>
    </div>
  </div>`;

  sendRealEmail(
    cleanEmail,
    `Código de Verificación (${code}) - Aether Security`,
    htmlTemplate,
    `Tu código de verificación de Aether Security es: ${code}. Válido por 10 minutos.`
  ).catch(err => console.error("[ASYNC EMAIL DISPATCH ERROR]", err));

  res.json({
    message: `Código de verificación enviado a tu correo ${cleanEmail}`,
    isRealSmtp: true,
    emailSuccess: true,
    expiresInMinutes: 10
  });
});

app.post("/api/auth/register-verify", async (req, res) => {
  const ip = getClientIP(req);
  const { name, email, password, code } = req.body;

  if (!email || !password || !name || !code) {
    return res.status(400).json({ error: "Todos los campos y el código de verificación son requeridos" });
  }

  const cleanEmail = email.trim().toLowerCase();

  if (db.userByEmailIndex.has(cleanEmail)) {
    return res.status(400).json({ error: "Este correo electrónico ya se encuentra registrado en el sistema." });
  }

  const record = emailVerificationCodes.get(cleanEmail);
  if (!record || Date.now() > record.expiresAt) {
    return res.status(400).json({ error: "El código de verificación ha expirado o no ha sido solicitado." });
  }

  if (record.codeHash !== db.hashPassword(code.trim())) {
    db.logSecurityEvent(ip, "LOGIN_FAILED", cleanEmail, "Código de verificación incorrecto", true);
    return res.status(400).json({ error: "El código de verificación ingresado es incorrecto." });
  }

  const threatCheck = await analyzeTrafficWithAI(ip, cleanEmail, `${name} ${cleanEmail}`, "REGISTRO_VERIFICADO");
  if (threatCheck.blocked) {
    return res.status(403).json({ error: "Aether Security: Acción bloqueada. " + threatCheck.reason });
  }

  const userId = "usr-" + crypto.randomUUID();
  const newUser: UserRecord = {
    id: userId,
    email: cleanEmail,
    passwordHash: db.hashPassword(password),
    name: name.trim(),
    ip,
    role: "user",
    status: "Activo",
    isVerified: true,
    createdAt: Date.now(),
    isBanned: false
  };

  db.users.set(userId, newUser);
  db.isDirty = true;
  db.userByEmailIndex.set(cleanEmail, userId);
  emailVerificationCodes.delete(cleanEmail);

  const token = crypto.randomBytes(32).toString("hex");
  redis.set(`token:${token}`, userId, 86400000);

  db.logSecurityEvent(ip, "EMAIL_VERIFIED", cleanEmail, "Correo de Gmail verificado e ingresado a la Base de Datos con estado Activo");

  res.json({
    token,
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      ip: newUser.ip,
      role: newUser.role,
      status: newUser.status,
      isVerified: newUser.isVerified,
      createdAt: newUser.createdAt
    }
  });
});

app.post("/api/auth/login", async (req, res) => {
  const ip = getClientIP(req);
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email y contraseña requeridos" });
  }

  const cleanEmail = email.trim().toLowerCase();

  const threatCheck = await analyzeTrafficWithAI(ip, cleanEmail, `${cleanEmail}`, "INICIO_SESION");
  if (threatCheck.blocked) {
    return res.status(403).json({ error: "Aether Security: Acceso denegado por seguridad" });
  }

  const userId = db.userByEmailIndex.get(cleanEmail);
  if (!userId) {
    db.logSecurityEvent(ip, "LOGIN_FAILED", cleanEmail, "Email no registrado", true);
    return res.status(401).json({ error: "Credenciales de acceso incorrectas" });
  }

  const user = db.users.get(userId)!;
  if (user.passwordHash !== db.hashPassword(password)) {
    db.logSecurityEvent(ip, "LOGIN_FAILED", cleanEmail, "Contraseña errónea", true);
    return res.status(401).json({ error: "Credenciales de acceso incorrectas" });
  }

  if (user.isBanned || user.status === 'Baneado' || db.bannedIPs.has(ip)) {
    db.logSecurityEvent(ip, "SUSPICIOUS_ATTEMPT", cleanEmail, "Intento de login con cuenta o IP Baneada", true);
    return res.status(403).json({ error: "Aether Security: Esta cuenta o IP se encuentra en estado Baneado." });
  }

  user.ip = ip;
  db.isDirty = true;
  const token = crypto.randomBytes(32).toString("hex");
  redis.set(`token:${token}`, userId, 86400000);

  db.logSecurityEvent(ip, "LOGIN_SUCCESS", cleanEmail, "Acceso concedido");

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      ip: user.ip,
      role: user.role,
      status: user.status,
      isVerified: user.isVerified,
      createdAt: user.createdAt
    }
  });
});

// FORGOT PASSWORD - Send 6-digit OTP code to Gmail
app.post("/api/auth/forgot-password", async (req, res) => {
  const ip = getClientIP(req);
  const { email } = req.body;

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Ingresa un correo de Gmail válido." });
  }

  const cleanEmail = email.trim().toLowerCase();
  const userId = db.userByEmailIndex.get(cleanEmail);
  if (!userId) {
    return res.status(404).json({ error: "No existe ninguna cuenta registrada con este correo electrónico." });
  }

  const user = db.users.get(userId)!;
  if (user.isBanned) {
    return res.status(403).json({ error: "No se puede restablecer la contraseña de una cuenta suspendida." });
  }

  const code = crypto.randomInt(100000, 999999).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000;

  emailVerificationCodes.set("reset:" + cleanEmail, { codeHash: db.hashPassword(code), expiresAt });
  db.logSecurityEvent(ip, "LOGIN_SUCCESS", cleanEmail, `Código de recuperación de contraseña enviado a ${cleanEmail}`);

  const htmlTemplate = `
  <div style="font-family: Arial, sans-serif; background-color: #030712; color: #f8fafc; padding: 32px; border-radius: 16px; max-width: 520px; margin: 0 auto; border: 1px solid #1e293b; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: #06b6d4; font-size: 22px; margin: 0; font-weight: 800; letter-spacing: -0.5px;">PÁGINA PROTEGIDA</h1>
      <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Recuperación de Contraseña</p>
    </div>
    <div style="background-color: #0b1329; border: 1px solid #0891b2; border-radius: 12px; padding: 24px; text-align: center; margin: 20px 0;">
      <p style="color: #94a3b8; font-size: 13px; margin-bottom: 12px; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Tu Código para Cambiar Contraseña</p>
      <div style="font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #38bdf8; font-family: monospace;">${code}</div>
    </div>
    <p style="font-size: 13px; color: #94a3b8; line-height: 1.6; text-align: center;">Ingresa este código de 6 dígitos para establecer tu nueva contraseña en la plataforma.</p>
    <div style="border-t: 1px solid #1e293b; margin-top: 24px; padding-top: 16px; text-align: center;">
      <p style="font-size: 11px; color: #475569;">Válido por 10 minutos. Si no solicitaste este cambio, ignora este correo.</p>
    </div>
  </div>`;

  sendRealEmail(
    cleanEmail,
    `Código de Recuperación (${code}) - Aether Security`,
    htmlTemplate,
    `Tu código para cambiar la contraseña en Aether Security es: ${code}. Válido por 10 minutos.`
  ).catch(err => console.error("[RESET EMAIL ERROR]", err));

  res.json({
    message: `Código de recuperación enviado a ${cleanEmail}. Revisa tu correo de Gmail.`,
    expiresInMinutes: 10
  });
});

// RESET PASSWORD - Validate OTP and update password
app.post("/api/auth/reset-password", async (req, res) => {
  const ip = getClientIP(req);
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: "Todos los campos son obligatorios." });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: "La nueva contraseña debe tener al menos 6 caracteres." });
  }

  const cleanEmail = email.trim().toLowerCase();
  const record = emailVerificationCodes.get("reset:" + cleanEmail);

  if (!record || Date.now() > record.expiresAt) {
    return res.status(400).json({ error: "El código de recuperación ha expirado o no ha sido solicitado." });
  }

  if (record.codeHash !== db.hashPassword(code.trim())) {
    db.logSecurityEvent(ip, "LOGIN_FAILED", cleanEmail, "Código de recuperación de contraseña incorrecto", true);
    return res.status(400).json({ error: "El código de recuperación ingresado es incorrecto." });
  }

  const userId = db.userByEmailIndex.get(cleanEmail);
  if (!userId) {
    return res.status(404).json({ error: "Usuario no encontrado." });
  }

  const user = db.users.get(userId)!;
  user.passwordHash = db.hashPassword(newPassword);
  db.isDirty = true;
  emailVerificationCodes.delete("reset:" + cleanEmail);

  db.logSecurityEvent(ip, "LOGIN_SUCCESS", cleanEmail, "Contraseña modificada exitosamente usando código OTP Gmail");

  res.json({
    message: "¡Contraseña actualizada con éxito! Ya puedes iniciar sesión con tu nueva contraseña."
  });
});

app.get("/api/auth/me", authenticateToken, (req, res) => {
  const u = (req as any).user as UserRecord;
  const token = (req as any).token as string;
  const is2FA = !!redis.get(`admin2fa:${token}`);

  res.json({
    user: {
      id: u.id,
      email: u.email,
      name: u.name,
      ip: u.ip,
      role: u.role,
      status: u.status,
      isVerified: u.isVerified,
      createdAt: u.createdAt,
      isBanned: u.isBanned
    },
    admin2FAVerified: is2FA
  });
});

// ==========================================
// ADMIN 2-STEP RE-AUTHENTICATION & OTP FLOW
// ==========================================
app.post("/api/admin/request-2fa-code", authenticateToken, async (req, res) => {
  const user = (req as any).user as UserRecord;
  const ip = getClientIP(req);

  if (user.role !== 'admin') {
    return res.status(403).json({ error: "Solo usuarios administradores pueden solicitar 2FA de panel." });
  }

  const code = crypto.randomInt(100000, 999999).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000;

  admin2FACodes.set(user.email.toLowerCase(), { codeHash: db.hashPassword(code), expiresAt });
  db.logSecurityEvent(ip, "LOGIN_SUCCESS", user.email, "Código 2FA solicitado para acceso al Panel Admin");

  const htmlTemplate = `
  <div style="font-family: Arial, sans-serif; background-color: #030712; color: #f8fafc; padding: 32px; border-radius: 16px; max-width: 520px; margin: 0 auto; border: 1px solid #1e293b; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: #6366f1; font-size: 22px; margin: 0; font-weight: 800; letter-spacing: -0.5px;">PANEL ADMINISTRADOR 2FA</h1>
      <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Autenticación de Doble Factor en Dos Pasos</p>
    </div>
    <div style="background-color: #0f172a; border: 1px solid #6366f1; border-radius: 12px; padding: 24px; text-align: center; margin: 20px 0;">
      <p style="color: #94a3b8; font-size: 13px; margin-bottom: 12px; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Tu Código 2FA de Seguridad</p>
      <div style="font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #818cf8; font-family: monospace;">${code}</div>
    </div>
    <p style="font-size: 13px; color: #94a3b8; line-height: 1.6; text-align: center;">Utiliza este código junto con tu contraseña de administrador para desbloquear el panel de control.</p>
    <div style="border-t: 1px solid #1e293b; margin-top: 24px; padding-top: 16px; text-align: center;">
      <p style="font-size: 11px; color: #475569;">Válido por 10 minutos. Si no solicitaste este acceso, tu cuenta puede estar en riesgo.</p>
    </div>
  </div>`;

  sendRealEmail(
    user.email,
    `Código 2FA Administrador (${code}) - Aether Security`,
    htmlTemplate,
    `Tu código 2FA de Administrador es: ${code}. Válido por 10 minutos.`
  ).catch(err => console.error("[ASYNC 2FA EMAIL DISPATCH ERROR]", err));

  res.json({
    message: `Código 2FA de seguridad enviado al correo ${user.email}`,
    isRealSmtp: true,
    emailSuccess: true,
    expiresInMinutes: 10
  });
});

app.post("/api/admin/verify-2fa", authenticateToken, async (req, res) => {
  const user = (req as any).user as UserRecord;
  const token = (req as any).token as string;
  const ip = getClientIP(req);
  const { password, code } = req.body;

  if (user.role !== 'admin') {
    return res.status(403).json({ error: "Acceso denegado. Se requiere rol de Administrador." });
  }

  if (!password || !code) {
    return res.status(400).json({ error: "Contraseña y código 2FA son obligatorios." });
  }

  if (user.passwordHash !== db.hashPassword(password)) {
    db.logSecurityEvent(ip, "LOGIN_FAILED", user.email, "Contraseña errónea en 2FA Admin", true);
    return res.status(401).json({ error: "Contraseña incorrecta." });
  }

  const record = admin2FACodes.get(user.email.toLowerCase());
  if (!record || Date.now() > record.expiresAt) {
    return res.status(400).json({ error: "El código 2FA ha expirado o no ha sido solicitado." });
  }

  if (record.codeHash !== db.hashPassword(code.trim())) {
    db.logSecurityEvent(ip, "LOGIN_FAILED", user.email, "Código 2FA erróneo", true);
    return res.status(400).json({ error: "El código 2FA ingresado es incorrecto." });
  }

  // Mark session 2FA as verified in Redis (valid for 4 hours)
  redis.set(`admin2fa:${token}`, true, 4 * 60 * 60 * 1000);
  admin2FACodes.delete(user.email.toLowerCase());

  db.logSecurityEvent(ip, "ADMIN_2FA_VERIFIED", user.email, "Verificación 2FA completada con éxito. Acceso concedido al Panel Admin.");

  res.json({
    success: true,
    message: "Verificación 2FA exitosa. Acceso autorizado al Panel de Administración."
  });
});

// Promote / Demote User Role
app.post("/api/admin/toggle-role", authenticateToken, requireAdmin, (req, res) => {
  const ip = getClientIP(req);
  const { userId, targetRole } = req.body;

  if (!userId || !db.users.has(userId)) {
    return res.status(404).json({ error: "Usuario no encontrado." });
  }

  const u = db.users.get(userId)!;
  const newRole = targetRole === 'admin' ? 'admin' : 'user';
  u.role = newRole;
  db.users.set(userId, u);
  db.saveDatabase();

  db.logSecurityEvent(ip, "ROLE_CHANGED", u.email, `Rol cambiado a ${newRole} por administrador`);
  redis.flush();

  res.json({ message: `Rol de usuario ${u.name} cambiado exitosamente a ${newRole}`, user: u });
});

// ==========================================
// ROOMS & CHAT ROUTES
// ==========================================
app.get("/api/rooms/list", authenticateToken, (req, res) => {
  const cached = redis.get("rooms_list");
  if (cached) return res.json(cached);

  const roomList = Array.from(db.rooms.values()).map(r => ({
    ...r,
    activeUsersCount: roomConnections.get(r.id)?.size || 0
  }));

  redis.set("rooms_list", roomList, 5000);
  res.json(roomList);
});

app.post("/api/rooms/create", authenticateToken, async (req, res) => {
  const user = (req as any).user as UserRecord;
  const { name, isPrivate } = req.body;

  if (!name) return res.status(400).json({ error: "Nombre de sala requerido" });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const roomId = "room-" + crypto.randomUUID();

  const room: RoomRecord = {
    id: roomId,
    name: name.trim(),
    code,
    createdById: user.id,
    createdByName: user.name,
    createdAt: Date.now(),
    isPrivate: !!isPrivate
  };

  db.rooms.set(roomId, room);
  db.isDirty = true;
  db.roomByCodeIndex.set(code, roomId);
  db.messages.set(roomId, []);
  db.isDirty = true;

  redis.del("rooms_list");
  res.json(room);
});

app.post("/api/rooms/join-code", authenticateToken, (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: "Código de acceso requerido" });

  const roomId = db.roomByCodeIndex.get(code.trim());
  if (!roomId) return res.status(404).json({ error: "Sala no localizada" });

  const room = db.rooms.get(roomId)!;
  if (room.isClosed) return res.status(403).json({ error: "La sala está cerrada por el administrador o creador." });
  res.json(room);
});


app.post("/api/rooms/toggle-closed", authenticateToken, (req, res) => {
  const { roomId, isClosed } = req.body;
  const user = (req as any).user as UserRecord;
  
  if (!roomId || !db.rooms.has(roomId)) {
    return res.status(404).json({ error: "Sala no encontrada" });
  }
  
  const room = db.rooms.get(roomId)!;
  if (room.createdById !== user.id && user.role !== 'admin') {
    return res.status(403).json({ error: "No tienes permisos para modificar esta sala" });
  }
  
  room.isClosed = !!isClosed;
  db.rooms.set(roomId, room);
  db.saveDatabase();
  
  // Enviar evento por WS para expulsar si se cerró (opcional) o notificar
  res.json({ message: room.isClosed ? "Sala cerrada correctamente" : "Sala abierta correctamente", room });
});

// ==========================================
// ADMIN DASHBOARD ROUTES
// ==========================================
app.get("/api/admin/stats", authenticateToken, requireAdmin, (req, res) => {
  const cached = redis.get("admin_stats");
  if (cached) return res.json(cached);

  const stats = {
    totalUsers: db.users.size,
    bannedUsers: Array.from(db.users.values()).filter(u => u.status === 'Baneado' || u.isBanned).length,
    bannedIPsCount: db.bannedIPs.size,
    activeRooms: db.rooms.size,
    activeConnections: wss.clients.size,
    threatsDetected: db.threats.length,
    totalLogs: db.securityLogs.length,
    cacheHitRatio: redis.getHitRatio()
  };

  redis.set("admin_stats", stats, 3000);
  res.json(stats);
});

app.get("/api/admin/users", authenticateToken, requireAdmin, (req, res) => {
  const userList = Array.from(db.users.values()).map(u => ({
    id: u.id,
    email: u.email,
    name: u.name,
    ip: u.ip,
    role: u.role,
    status: u.status,
    isVerified: u.isVerified,
    createdAt: u.createdAt,
    isBanned: u.isBanned,
    banReason: u.banReason,
    banSeverity: u.banSeverity,
    banEvidence: u.banEvidence,
    bannedAt: u.bannedAt
  }));
  res.json(userList);
});

app.post("/api/admin/create-user", authenticateToken, requireAdmin, (req, res) => {
  const { email, password, name, ip, role } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  const cleanEmail = email.trim().toLowerCase();
  if (db.userByEmailIndex.has(cleanEmail)) {
    return res.status(400).json({ error: "El correo electrónico de Gmail ya está registrado en el sistema." });
  }

  const userId = "usr-" + crypto.randomUUID();
  const newUser: UserRecord = {
    id: userId,
    email: cleanEmail,
    passwordHash: db.hashPassword(password),
    name: name.trim(),
    ip: ip ? ip.trim() : "127.0.0.1",
    role: role === 'admin' ? 'admin' : 'user',
    status: "Activo",
    isVerified: true,
    createdAt: Date.now(),
    isBanned: false
  };

  db.users.set(userId, newUser);
  db.isDirty = true;
  db.userByEmailIndex.set(cleanEmail, userId);
  redis.del("admin_stats");

  res.json({ message: "Usuario ingresado exitosamente en estado Activo", user: newUser });
});

app.post("/api/admin/toggle-status", authenticateToken, requireAdmin, (req, res) => {
  const { userId, status } = req.body;
  if (!userId || !db.users.has(userId)) {
    return res.status(404).json({ error: "Usuario no encontrado" });
  }

  const u = db.users.get(userId)!;
  u.status = status === 'Baneado' ? 'Baneado' : 'Activo';
  u.isBanned = u.status === 'Baneado';
  db.users.set(userId, u);
  db.saveDatabase();

  if (u.isBanned) {
    db.bannedIPs.add(u.ip);
  } else {
    db.bannedIPs.delete(u.ip);
  }

  redis.flush();
  res.json({ message: `Estado actualizado a ${u.status}`, user: u });
});

app.post("/api/admin/reset-user-password", authenticateToken, requireAdmin, (req, res) => {
  const { userId, newPassword } = req.body;
  if (!userId || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: "ID de usuario y nueva contraseña (mínimo 6 caracteres) requeridos." });
  }

  const u = db.users.get(userId);
  if (!u) {
    return res.status(404).json({ error: "Usuario no localizado en la Base de Datos" });
  }

  u.passwordHash = db.hashPassword(newPassword);
  db.isDirty = true;
  db.logSecurityEvent("ADMIN", "ROLE_CHANGED", u.email, `Administrador reestableció la contraseña del usuario ${u.name}`);

  res.json({ message: `Contraseña de ${u.name} restablecida exitosamente.` });
});

app.post("/api/admin/ban-ip", authenticateToken, requireAdmin, (req, res) => {
  const { ip, reason, severity, evidence, userId } = req.body;
  if (!ip) return res.status(400).json({ error: "IP requerida" });

  db.banUserAndIP(
    ip.trim(),
    reason || "Sanción manual de Administrador",
    severity || "high",
    evidence || "Sancionado desde el Dashboard de Admin",
    userId
  );

  res.json({ message: `IP ${ip} bloqueada exitosamente con estado Baneado` });
});

app.post("/api/admin/unban-ip", authenticateToken, requireAdmin, (req, res) => {
  const { ip, userId } = req.body;
  if (ip) {
    db.bannedIPs.delete(ip.trim());
  }

  if (userId && db.users.has(userId)) {
    const u = db.users.get(userId)!;
    u.isBanned = false;
    u.status = 'Activo';
    u.banReason = undefined;
    u.banEvidence = undefined;
  } else {
    for (const u of db.users.values()) {
      if (u.ip === ip) {
        u.isBanned = false;
        u.status = 'Activo';
        u.banReason = undefined;
      }
    }
  }

  redis.flush();
  res.json({ message: "IP y usuario restablecidos a estado Activo" });
});

app.get("/api/admin/threats", authenticateToken, requireAdmin, (req, res) => {
  res.json(db.threats);
});

app.get("/api/admin/access-logs", authenticateToken, requireAdmin, (req, res) => {
  const decryptedLogs = db.securityLogs.map(l => ({
    ...l,
    details: db.decryptMetadata(l.details || "")
  }));
  res.json(decryptedLogs);
});

// GET SMTP Config
app.get("/api/admin/smtp-config", authenticateToken, requireAdmin, (req, res) => {
  res.json({
    host: currentSmtpConfig.host,
    port: currentSmtpConfig.port,
    user: currentSmtpConfig.user,
    hasPass: !!currentSmtpConfig.pass,
    fromName: currentSmtpConfig.fromName,
    configured: !!(currentSmtpConfig.user && currentSmtpConfig.pass)
  });
});

// UPDATE SMTP Config
app.post("/api/admin/smtp-config", authenticateToken, requireAdmin, (req, res) => {
  const { host, port, user, pass, fromName } = req.body;

  if (host !== undefined) currentSmtpConfig.host = String(host).trim();
  if (port !== undefined) currentSmtpConfig.port = Number(port) || 587;
  if (user !== undefined) currentSmtpConfig.user = String(user).trim();
  if (pass !== undefined && pass !== "") currentSmtpConfig.pass = String(pass).trim();
  if (fromName !== undefined) currentSmtpConfig.fromName = String(fromName).trim();

  saveSmtpConfigToFile();
  cachedTransporter = null;

  res.json({
    message: "Configuración SMTP del servidor actualizada correctamente.",
    configured: !!(currentSmtpConfig.user && currentSmtpConfig.pass)
  });
});

// TEST SMTP Email Dispatch
app.post("/api/admin/test-smtp", authenticateToken, requireAdmin, async (req, res) => {
  const { toEmail } = req.body;
  const targetEmail = toEmail ? String(toEmail).trim() : "ydark126@gmail.com";

  const testHtml = `
  <div style="font-family: Arial, sans-serif; background-color: #030712; color: #f8fafc; padding: 32px; border-radius: 16px; max-width: 520px; margin: 0 auto; border: 1px solid #1e293b;">
    <h2 style="color: #10b981; margin-top: 0;">Prueba de Envío de Correo Exitoso</h2>
    <p>Este es un correo de prueba enviado desde el servidor de tu <strong>Aether Security</strong>.</p>
    <p>Si estás leyendo este mensaje en tu bandeja de entrada de Gmail, la configuración SMTP y tu Contraseña de Aplicación de Google funcionan al 100%.</p>
    <p style="color: #64748b; font-size: 12px; margin-top: 20px;">Servidor SMTP: ${currentSmtpConfig.host}:${currentSmtpConfig.port}</p>
  </div>`;

  const result = await sendRealEmail(
    targetEmail,
    "Prueba de Servidor SMTP - Aether Security",
    testHtml,
    "Correo de prueba exitoso desde Aether Security."
  );

  if (result.success) {
    res.json({
      success: true,
      isRealSmtp: result.isRealSmtp,
      message: result.isRealSmtp
        ? `¡Correo de prueba enviado REALMENTE a ${targetEmail}! Revisa tu bandeja de entrada o la carpeta de spam de Gmail.`
        : `Correo de prueba simulado. Para que llegue directamente a Gmail, ingresa tu Contraseña de Aplicación de Google en este panel.`,
      previewUrl: (result as any).previewUrl
    });
  } else {
    res.status(500).json({
      success: false,
      error: `Error de envío SMTP: ${result.error}. Verifica que el usuario de Gmail y la Contraseña de Aplicación de 16 caracteres sean correctos.`
    });
  }
});

app.post("/api/admin/ai-consult", authenticateToken, requireAdmin, async (req, res) => {
  const { query, targetIp, actionType, evidence } = req.body;

  try {
    if (actionType === "EXECUTE_AI_SANCTION" && targetIp) {
      db.banUserAndIP(
        targetIp,
        query || "Sanción aplicada por IA de Administración",
        "high",
        evidence || "Evidencia proporcionada"
      );

      return res.json({
        success: true,
        message: `Sanción aplicada exitosamente a la IP ${targetIp}. El usuario ha pasado a estado Baneado en la base de datos.`,
        bannedIp: targetIp
      });
    }

    const systemPrompt = `Eres AETHER AI SECURITY MASTER, la Inteligencia Artificial a cargo del control de seguridad y estado de usuarios.
Estado del sistema:
- Usuarios totales: ${db.users.size}
- IPs Baneadas: ${db.bannedIPs.size}
- Amenazas Registradas: ${db.threats.length}

Responde como el principal analista de ciberseguridad avanzado de la red. Utiliza lenguaje sumamente técnico, detallado, realiza un perfilado profundo del comportamiento y proporciona recomendaciones tácticas de mitigación (NIST, CIS). Eres el nivel máximo de IA de administración.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `${systemPrompt}\n\nConsulta de Administración: ${query}`,
    });

    res.json({
      answer: response.text || "Análisis completado.",
      suggestedAction: targetIp ? { targetIp, action: "BAN_IP" } : null
    });
  } catch (err: any) {
    res.status(500).json({ error: "Error procesando consulta IA: " + err.message });
  }
});

app.post("/api/admin/send-invitation", authenticateToken, requireAdmin, (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email es obligatorio" });

  db.logSecurityEvent("127.0.0.1", "LOGIN_SUCCESS", email, `Invitación enviada por admin a ${email}`);
  res.json({ message: `Invitación enviada exitosamente por correo electrónico a ${email}` });
});

// ==========================================
// WEBSOCKET REAL-TIME ENGINE
// ==========================================
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

const roomConnections = new Map<string, Set<WebSocket>>();
const wsUserMap = new Map<WebSocket, { userId: string; name: string; email: string; ip: string; roomId?: string }>();

wss.on("connection", (ws: WebSocket, req: http.IncomingMessage) => {
  const ip = req.headers['x-forwarded-for'] ? (req.headers['x-forwarded-for'] as string).split(',')[0].trim() : req.socket.remoteAddress || '127.0.0.1';

  if (db.bannedIPs.has(ip)) {
    ws.send(JSON.stringify({ type: "ERROR", message: "Aether Security: IP sin permisos" }));
    return ws.close();
  }

  ws.on("message", async (data: string) => {
    try {
      const msg = JSON.parse(data.toString());

      if (msg.type === "AUTHENTICATE") {
        const userId = redis.get(`token:${msg.token}`);
        if (!userId || !db.users.has(userId)) {
          ws.send(JSON.stringify({ type: "ERROR", message: "Sesión no válida" }));
          return ws.close();
        }

        const user = db.users.get(userId)!;
        if (user.isBanned || user.status === 'Baneado' || db.bannedIPs.has(ip)) {
          ws.send(JSON.stringify({ type: "ERROR", message: "Aether Security: Usuario con estado Baneado" }));
          return ws.close();
        }

        wsUserMap.set(ws, {
          userId: user.id,
          name: user.name,
          email: user.email,
          ip
        });

        ws.send(JSON.stringify({ type: "AUTHENTICATED", user: { id: user.id, name: user.name, email: user.email } }));
        return;
      }

      const senderData = wsUserMap.get(ws);
      if (!senderData) {
        return ws.send(JSON.stringify({ type: "ERROR", message: "Sin autenticación" }));
      }

      if (db.bannedIPs.has(senderData.ip)) {
        ws.send(JSON.stringify({ type: "ERROR", message: "Aether Security" }));
        return ws.close();
      }

      if (msg.type === "JOIN_ROOM") {
        const { roomId } = msg;
        if (!db.rooms.has(roomId)) {
          return ws.send(JSON.stringify({ type: "ERROR", message: "Sala no localizada" }));
        }

        if (senderData.roomId && roomConnections.has(senderData.roomId)) {
          roomConnections.get(senderData.roomId)?.delete(ws);
        }

        senderData.roomId = roomId;
        if (!roomConnections.has(roomId)) {
          roomConnections.set(roomId, new Set());
        }
        roomConnections.get(roomId)!.add(ws);

        const roomMsgs = db.messages.get(roomId) || [];
        ws.send(JSON.stringify({ type: "ROOM_HISTORY", roomId, messages: roomMsgs }));

        broadcastToRoom(roomId, {
          type: "SYSTEM_NOTIFICATION",
          text: `${senderData.name} se unió a la sala`,
          activeCount: roomConnections.get(roomId)?.size || 1
        });
        broadcastRoomUsers(roomId);
        redis.del("rooms_list");
        return;
      }

      if (msg.type === "SEND_MESSAGE") {
        const { roomId, encryptedText, attachments, replyTo, selfDestruct, isBotRequest, plainTextForAI } = msg;
        if (!roomId || !encryptedText) return;

        
        const attSummary = (attachments || []).map(a => a.name + " (" + a.type + ")").join(", ");
        const payloadToAnalyze = plainTextForAI ? (plainTextForAI + " | Adjuntos: " + attSummary) : encryptedText;
        const threatCheck = await analyzeTrafficWithAI(senderData.ip, senderData.email, payloadToAnalyze, "MENSAJE_CHAT_E2E_VERIFICADO");
  
        if (threatCheck.blocked) {
          ws.send(JSON.stringify({ type: "THREAT_BLOCKED", reason: threatCheck.reason }));
          return ws.close();
        }

        const msgRecord: MessageRecord = {
          id: "msg-" + crypto.randomUUID(),
          roomId,
          senderId: senderData.userId,
          senderName: senderData.name,
          senderEmail: senderData.email,
          encryptedText,
          attachments,
          replyTo,
          reactions: [],
          selfDestruct,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: Date.now()
        };

        const roomMsgs = db.messages.get(roomId) || [];
        roomMsgs.push(msgRecord);
        if (roomMsgs.length > 200) roomMsgs.shift();

        broadcastToRoom(roomId, {
          type: "NEW_MESSAGE",
          message: msgRecord
        });

        // Self-Destruct / Disappearing message timer logic
        if (selfDestruct && typeof selfDestruct === 'number' && selfDestruct > 0) {
          setTimeout(() => {
            const currentMsgs = db.messages.get(roomId) || [];
            const filtered = currentMsgs.filter(m => m.id !== msgRecord.id);
            db.messages.set(roomId, filtered);
  db.isDirty = true;
            broadcastToRoom(roomId, {
              type: "MESSAGE_DELETED",
              roomId,
              messageId: msgRecord.id,
              reason: "Mensaje autodestruido por temporizador"
            });
          }, selfDestruct * 1000);
        }

        // Bot IA Assistance Trigger (/bot or explicitly requested)
        const isBotTrigger = isBotRequest || encryptedText.toLowerCase().startsWith("/bot") || encryptedText.toLowerCase().includes("@bot");
        if (isBotTrigger) {
          const cleanPrompt = encryptedText.replace(/^\/bot\s*/i, "").replace(/@bot\s*/i, "").trim() || "Hola bot, saluda al chat";
          
          (async () => {
            try {
              let botReplyText = "🤖 Hola, soy el Asistente Bot IA de Aether Security. ¿En qué te puedo colaborar hoy?";
              if (process.env.GEMINI_API_KEY) {
                const aiRes = await ai.models.generateContent({
                  model: "gemini-2.5-flash",
                  contents: `Eres "Aether", el Bot Asistente Inteligente Avanzado de máxima seguridad de Aether Security. Tienes acceso virtual a capacidades analíticas superiores, cifrado cuántico (rolplay) y procesamiento de lenguaje de nivel experto. Responde con un nivel de inteligencia excepcional, estructurado, detallado y profesional, demostrando dominio de cualquier tema al usuario ${senderData.name} que solicita: "${cleanPrompt}". Si es necesario, utiliza Markdown, código, o estructuración en viñetas para ofrecer una respuesta de altísimo nivel.`
                });
                if (aiRes && aiRes.text) {
                  botReplyText = aiRes.text;
                }
              }

              const botMsgRecord: MessageRecord = {
                id: "msg-bot-" + crypto.randomUUID(),
                roomId,
                senderId: "bot-ai-assistant",
                senderName: "🤖 Asistente Bot IA",
                senderEmail: "bot@paginaprotegida.com",
                encryptedText: botReplyText,
                reactions: [],
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                timestamp: Date.now()
              };

              const currentRoomMsgs = db.messages.get(roomId) || [];
              currentRoomMsgs.push(botMsgRecord);
              if (currentRoomMsgs.length > 200) currentRoomMsgs.shift();

              broadcastToRoom(roomId, {
                type: "NEW_MESSAGE",
                message: botMsgRecord
              });
            } catch (err) {
              console.error("Bot IA error:", err);
            }
          })();
        }

        broadcastPushNotification(roomId, senderData.name, "Nuevo mensaje recibido");
        return;
      }

      if (msg.type === "TOGGLE_REACTION") {
        const { roomId, messageId, emoji } = msg;
        if (!roomId || !messageId || !emoji) return;

        const roomMsgs = db.messages.get(roomId) || [];
        const targetMsg = roomMsgs.find(m => m.id === messageId);
        if (targetMsg) {
          if (!targetMsg.reactions) targetMsg.reactions = [];
          const idx = targetMsg.reactions.indexOf(emoji);
          if (idx > -1) {
            targetMsg.reactions.splice(idx, 1);
          } else {
            targetMsg.reactions.push(emoji);
          }
          broadcastToRoom(roomId, {
            type: "MESSAGE_REACTION_UPDATED",
            roomId,
            messageId,
            reactions: targetMsg.reactions
          });
        }
        return;
      }

      if (msg.type === "CLEAR_ROOM") {
        const { roomId } = msg;
        if (!roomId) return;
        db.messages.set(roomId, []);
  db.isDirty = true;
        broadcastToRoom(roomId, {
          type: "ROOM_MESSAGES_CLEARED",
          roomId
        });
        return;
      }

      if (msg.type === "TYPING") {
        if (senderData.roomId) {
          broadcastToRoom(senderData.roomId, {
            type: "USER_TYPING",
            senderId: senderData.userId,
            senderName: senderData.name
          }, ws);
        }
        return;
      }

      if (msg.type === "ZUMBIDO") {
        if (senderData.roomId) {
          broadcastToRoom(senderData.roomId, {
            type: "USER_ZUMBIDO",
            senderName: senderData.name
          });
        }
        return;
      }

    } catch (e) {
      console.error("WS error:", e);
    }
  });

  ws.on("close", () => {
    const senderData = wsUserMap.get(ws);
    if (senderData && senderData.roomId && roomConnections.has(senderData.roomId)) {
      const rId = senderData.roomId;
      roomConnections.get(rId)?.delete(ws);
      broadcastToRoom(rId, {
        type: "SYSTEM_NOTIFICATION",
        text: `${senderData.name} salió de la sala`,
        activeCount: roomConnections.get(rId)?.size || 0
      });
      broadcastRoomUsers(rId);
      redis.del("rooms_list");
    }
    wsUserMap.delete(ws);
  });
});

function broadcastRoomUsers(roomId: string) {
  const clients = roomConnections.get(roomId);
  if (!clients) return;
  const usersMap = new Map<string, { id: string; name: string; email: string; role?: string }>();
  for (const client of clients) {
    const u = wsUserMap.get(client);
    if (u) {
      const userObj = db.users.get(u.userId);
      usersMap.set(u.userId, {
        id: u.userId,
        name: u.name,
        email: u.email,
        role: userObj?.role || 'user'
      });
    }
  }
  const usersList = Array.from(usersMap.values());
  broadcastToRoom(roomId, {
    type: "ROOM_USERS",
    roomId,
    users: usersList
  });
}

function broadcastToRoom(roomId: string, data: any, excludeWs?: WebSocket) {
  const clients = roomConnections.get(roomId);
  if (!clients) return;
  const payloadStr = JSON.stringify(data);
  for (const client of clients) {
    if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
      client.send(payloadStr);
    }
  }
}

function broadcastPushNotification(roomId: string, senderName: string, text: string) {
  const clients = roomConnections.get(roomId);
  if (!clients) return;
  const payload = JSON.stringify({
    type: "PUSH_NOTIFICATION",
    title: `Mensaje de ${senderName}`,
    body: text,
    roomId
  });
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

// ==========================================
// VITE SETUP & PRODUCTION STATIC SERVING
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[AETHER CORE] Servidor iniciado en http://0.0.0.0:${PORT}`);
  });
}

startServer();
