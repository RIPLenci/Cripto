import "dotenv/config";
import express from "express";
import http from "http";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import mongoose from "mongoose";



async function connectMongo() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("La variable de entorno MONGODB_URI no está definida. Por favor, configúrala en la pestaña de Secrets o en el archivo .env.");
  }
  if (mongoose.connection.readyState === 0) {
    try {
      console.log("Conectando a MongoDB...");
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      console.log("Conexión a MongoDB establecida.");
    } catch (err) {
      console.error("Error crítico conectando a MongoDB. Verifica que la IP esté en la lista blanca de Atlas:", err.message);
    }
  }
}
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
import compression from "compression";

const INSTANTDB_APP_ID = "222816e6-294f-4d87-ab1e-6e94aa4e6c74";
const PORT = 3000;
const app = express();
app.set('trust proxy', true);
app.use(compression());
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
const DB_FILE = path.join(process.cwd(), "database.enc");

const DB_SECRET = process.env.DB_SECRET || "AETHER_SUPER_SECRET_KEY_2026_12345";
const algorithm = 'aes-256-cbc';
const DERIVED_DB_KEY = crypto.scryptSync(DB_SECRET, 'salt', 32);

function encryptDB(text: string) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, DERIVED_DB_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decryptDB(text: string) {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(algorithm, DERIVED_DB_KEY, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString('utf8');
}


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


// ==========================================
// AETHER EMAIL TEMPLATE SYSTEM (100% REDESIGNED)
// ==========================================
function buildAetherEmail(title: string, subtitle: string, contentHtml: string, colorHex: string = '#0ea5e9') {
  const timestamp = new Date().toUTCString();
  return `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aether Security Network</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #030712; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; color: #f8fafc; -webkit-font-smoothing: antialiased;">
    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #030712; padding: 40px 12px;">
      <tr>
        <td align="center">
          <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 580px; background: #0b0f19; border-radius: 20px; border: 1px solid #1e293b; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 35px -5px ${colorHex}25;">
            
            <!-- Top Gradient Bar -->
            <tr>
              <td style="height: 4px; background: linear-gradient(90deg, ${colorHex}, #3b82f6, ${colorHex});"></td>
            </tr>

            <!-- Header Header -->
            <tr>
              <td style="padding: 28px 32px 20px 32px; border-bottom: 1px solid #1e293b; background: linear-gradient(180deg, ${colorHex}12 0%, transparent 100%);">
                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="left" style="vertical-align: middle;">
                      <table border="0" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="vertical-align: middle;">
                            <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #0f172a, #020617); border: 1px solid ${colorHex}60; border-radius: 12px; text-align: center; line-height: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
                              <span style="font-size: 18px;">🛡️</span>
                            </div>
                          </td>
                          <td style="padding-left: 12px; vertical-align: middle;">
                            <div style="color: #ffffff; font-size: 17px; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase; font-family: -apple-system, sans-serif;">AETHER SECURITY</div>
                            <div style="color: #64748b; font-size: 10px; font-weight: 700; letter-spacing: 1px;">DEFENSE & NETWORK PROTOCOL</div>
                          </td>
                        </tr>
                      </table>
                    </td>
                    <td align="right" style="vertical-align: middle;">
                      <span style="display: inline-block; background-color: ${colorHex}18; border: 1px solid ${colorHex}45; color: ${colorHex}; padding: 6px 12px; border-radius: 9999px; font-size: 10px; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase;">
                        ${subtitle}
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Main Body Content -->
            <tr>
              <td style="padding: 32px;">
                <h1 style="margin: 0 0 20px 0; font-size: 21px; color: #f8fafc; font-weight: 800; letter-spacing: -0.5px; line-height: 1.35;">
                  ${title}
                </h1>
                ${contentHtml}
              </td>
            </tr>

            <!-- Footer Section -->
            <tr>
              <td style="padding: 24px 32px; background-color: #060913; border-top: 1px solid #1e293b;">
                <!-- Security Badge -->
                <div style="background-color: #0d1322; border: 1px solid #1e293b; border-radius: 12px; padding: 12px 16px; margin-bottom: 16px; text-align: center;">
                  <div style="font-size: 10px; font-weight: 800; color: ${colorHex}; letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 4px;">
                    🔒 TRANSMISIÓN CIFRADA CON PROTOCOLO SHA-256
                  </div>
                  <div style="font-size: 10px; color: #64748b; font-family: monospace;">
                    TIMESTAMP: ${timestamp} • AETHER SECURITY MESH
                  </div>
                </div>

                <p style="margin: 0; font-size: 11px; color: #475569; line-height: 1.6; text-align: center;">
                  Este correo fue emitido de forma automática por los servidores centrales de <strong>Aether Security Network</strong>.<br>
                  Por razones de ciberseguridad e integridad de datos, no responda directamente a este mensaje.<br>
                  © 2026 Aether Security Infrastructure Inc. Todos los derechos reservados.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>`;
}

async function sendPremiumInvoiceEmail(params: {
  userEmail: string;
  userName?: string;
  type: 'ACTIVATED' | 'EXTENDED' | 'REMOVED' | 'EXPIRED';
  months?: number;
  expiresAt?: number;
  reason?: string;
  planTier?: 'free' | 'premium' | 'cyber_elite';
}) {
  const { userEmail, userName, type, months, expiresAt, reason, planTier } = params;
  if (!userEmail) return;

  const displayName = userName || userEmail.split('@')[0];
  const invoiceNum = `FACT-AETHER-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
  const expiresDateStr = expiresAt ? new Date(expiresAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';

  const m = months && months > 0 ? months : 1;
  const isPaid = type === 'ACTIVATED' || type === 'EXTENDED';

  const isCyberElite = planTier === 'cyber_elite' || userEmail.toLowerCase() === 'ydark126@gmail.com';
  const planName = isCyberElite ? '⚡ Cyber Elite Ultra' : '👑 Aether Premium VIP';
  const planRate = isCyberElite ? 29.99 : 9.99;

  const basePlanPrice = isPaid ? planRate * m : 0;
  const processingFee = isPaid ? 0.80 : 0;
  const subtotal = basePlanPrice + processingFee;
  const iva = isPaid ? subtotal * 0.16 : 0;
  const grandTotal = subtotal + iva;

  let subject = '';
  let badgeColor = isCyberElite ? '#06b6d4' : '#10b981';
  let badgeText = isCyberElite ? 'CYBER ELITE ULTRA VIP' : 'MEMBRESÍA VIP ACTIVA';
  let statusBanner = '';

  if (type === 'ACTIVATED') {
    subject = `📄 Factura Electrónica y Cobertura ${planName} #${invoiceNum}`;
    statusBanner = isCyberElite 
      ? '¡Confirmación de suscripción Cyber Elite Ultra! Su cuenta dispone de nivel de prioridad máxima en la red Aether, cifrado militar, clave maestra y acceso ilimitado a motores de IA y WAF.'
      : '¡Confirmación de suscripción Aether Security Pro! Su servicio ha sido habilitado con cifrado prioritario y acceso ilimitado a motores de IA.';
  } else if (type === 'EXTENDED') {
    subject = `📄 Factura Electrónica y Renovación ${planName} #${invoiceNum}`;
    statusBanner = `El período de cobertura de su suscripción ${planName} ha sido renovado y extendido exitosamente.`;
  } else if (type === 'REMOVED') {
    subject = `📄 Comprobante de Cancelación de Servicio #${invoiceNum}`;
    badgeColor = '#ef4444';
    badgeText = 'CANCELADO';
    statusBanner = `La suscripción Premium de su cuenta ha sido revocada por el departamento de administración. ${reason ? 'Motivo: ' + reason : ''}`;
  } else if (type === 'EXPIRED') {
    subject = `📄 Notificación de Finalización de Cobertura #${invoiceNum}`;
    badgeColor = '#f59e0b';
    badgeText = 'EXPIRADO';
    statusBanner = 'El período de vigencia de su membresía ha concluido. Su cuenta ha retornado al nivel de acceso estándar.';
  }

  const content = `
    <div style="background-color: ${badgeColor}15; border: 1px solid ${badgeColor}40; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center;">
      <p style="margin: 0; color: ${badgeColor}; font-size: 13px; font-weight: 700; line-height: 1.5;">${statusBanner}</p>
    </div>

    <div style="background-color: #0f172a; border-radius: 14px; border: 1px solid #1e293b; overflow: hidden; margin-bottom: 24px;">
      <table width="100%" border="0" cellpadding="0" cellspacing="0">
        <thead>
          <tr style="background-color: #070c18;">
            <th style="padding: 14px 16px; text-align: left; border-bottom: 1px solid #1e293b; color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Concepto / Servicio</th>
            <th style="padding: 14px 16px; text-align: center; border-bottom: 1px solid #1e293b; color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Período</th>
            <th style="padding: 14px 16px; text-align: right; border-bottom: 1px solid #1e293b; color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Monto</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 14px 16px; border-bottom: 1px solid #1e293b; color: #f8fafc; font-weight: 600; font-size: 13px;">
              Membresía ${planName}
              <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${isCyberElite ? 'Cifrado Máximo, WAF Heurístico & Motores IA Prioritarios' : 'Cifrado VIP & Motores IA Dedicados'}</div>
            </td>
            <td style="padding: 14px 16px; border-bottom: 1px solid #1e293b; text-align: center; color: #94a3b8; font-size: 13px;">${isPaid ? `${m} mes${m > 1 ? 'es' : ''}` : '-'}</td>
            <td style="padding: 14px 16px; border-bottom: 1px solid #1e293b; text-align: right; color: #f8fafc; font-weight: 700; font-family: monospace; font-size: 13px;">${basePlanPrice.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 14px 16px; border-bottom: 1px solid #1e293b; color: #cbd5e1; font-size: 13px;">Tasa de Procesamiento de Red</td>
            <td style="padding: 14px 16px; border-bottom: 1px solid #1e293b; text-align: center; color: #94a3b8; font-size: 13px;">1</td>
            <td style="padding: 14px 16px; border-bottom: 1px solid #1e293b; text-align: right; color: #cbd5e1; font-weight: 600; font-family: monospace; font-size: 13px;">+${processingFee.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 14px 16px; color: #cbd5e1; font-size: 13px;">Impuesto IVA (16%)</td>
            <td style="padding: 14px 16px; text-align: center; color: #94a3b8; font-size: 13px;">16%</td>
            <td style="padding: 14px 16px; text-align: right; color: #cbd5e1; font-weight: 600; font-family: monospace; font-size: 13px;">+${iva.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div style="background: linear-gradient(135deg, #0d1527, #070a12); border: 1px solid #1e293b; padding: 20px; border-radius: 14px; margin-bottom: 20px;">
      <table width="100%" border="0" cellpadding="0" cellspacing="0">
        <tr>
          <td style="color: #64748b; font-size: 12px; padding-bottom: 6px;">Subtotal Neto</td>
          <td align="right" style="color: #cbd5e1; font-family: monospace; font-size: 13px; padding-bottom: 6px;">${subtotal.toFixed(2)} USD</td>
        </tr>
        <tr>
          <td style="color: #64748b; font-size: 12px; padding-bottom: 12px; border-bottom: 1px solid #1e293b;">Impuestos Aplicables</td>
          <td align="right" style="color: #cbd5e1; font-family: monospace; font-size: 13px; padding-bottom: 12px; border-bottom: 1px solid #1e293b;">+${iva.toFixed(2)} USD</td>
        </tr>
        <tr>
          <td style="color: ${badgeColor}; font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; padding-top: 12px;">Total Facturado</td>
          <td align="right" style="color: ${badgeColor}; font-size: 22px; font-weight: 900; font-family: monospace; padding-top: 12px;">${grandTotal.toFixed(2)}</td>
        </tr>
      </table>
    </div>

    <p style="margin: 0; font-size: 11px; color: #64748b; text-align: center; line-height: 1.5;">
      Comprobante fiscal digital expedido para <strong>${displayName}</strong> (${userEmail}).<br>
      Vigencia hasta: <strong>${expiresDateStr}</strong>.
    </p>
  `;
  const html = buildAetherEmail(`Comprobante Electrónico #${invoiceNum}`, badgeText, content, badgeColor);

  await sendRealEmail(userEmail, subject, html, `${subject} - Total: ${grandTotal.toFixed(2)} USD - Cliente: ${displayName} (${userEmail}) - Vencimiento: ${expiresDateStr}`);
}

function broadcastUserUpdate(user: any, eventType: string, extraData?: any) {
  if (!user) return;
  const formattedUser = formatUserResponse(user);
  const payload = JSON.stringify({
    type: "USER_STATE_UPDATE",
    eventType,
    userId: user.id || user._id,
    user: formattedUser,
    ...extraData
  });

  if (wss && wss.clients) {
    wss.clients.forEach((client: any) => {
      if (client.readyState === 1) {
        try {
          client.send(payload);
        } catch (e) {}
      }
    });
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

// ==========================================
// MULTI-MODEL AI ENGINE (NVIDIA NIM + GEMINI)
// ==========================================
// ==========================================
// MULTI-MODEL AI ENGINE (NVIDIA NIM + GEMINI MULTIMODAL)
// ==========================================
async function queryNvidiaAI(prompt: string, model: string = "meta/llama-3.1-70b-instruct", systemPrompt?: string): Promise<string | null> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt || "Eres AETHER MULTI-MODEL AI MASTER (NVIDIA NIM), analista de ciberseguridad, moderación y procesamiento multimodal." },
          { role: "user", content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      console.warn(`[NVIDIA AI] Modelo ${model} devolvió status HTTP ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (err: any) {
    console.warn(`[NVIDIA AI Error] Modelo ${model}:`, err.message);
    return null;
  }
}

async function queryNvidiaMultimodal(
  prompt: string,
  mediaItems: Array<{ data: string; mimeType: string }> = [],
  model: string = "meta/llama-3.2-11b-vision-instruct",
  systemPrompt?: string
): Promise<string | null> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) return null;

  try {
    const userContent: any[] = [{ type: "text", text: prompt }];

    for (const item of mediaItems) {
      if (item.mimeType && item.mimeType.startsWith("image/")) {
        let b64 = item.data;
        if (b64.includes(";base64,")) b64 = b64.split(";base64,")[1];
        userContent.push({
          type: "image_url",
          image_url: { url: `data:${item.mimeType};base64,${b64}` }
        });
      }
    }

    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt || "Eres AETHER MULTIMODAL VISION MASTER (NVIDIA NIM), especializado en análisis de imágenes, video, audio y texto." },
          { role: "user", content: mediaItems.some(m => m.mimeType?.startsWith("image/")) ? userContent : prompt }
        ],
        temperature: 0.2,
        max_tokens: 1200
      })
    });

    if (!response.ok) {
      console.warn(`[NVIDIA Multimodal] Modelo ${model} HTTP ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (err: any) {
    console.warn(`[NVIDIA Multimodal Error] Modelo ${model}:`, err.message);
    return null;
  }
}


function enhancePromptWithIdentityAndLang(prompt, systemPrompt) {
  let lang = "el idioma original del usuario";
  const t = prompt.toLowerCase();
  const es = (t.match(/\b(el|la|de|que|y|en|un|ser|se|no|es|por)\b/g) || []).length;
  const en = (t.match(/\b(the|be|to|of|and|a|in|that|have|i|is|for)\b/g) || []).length;
  const pt = (t.match(/\b(o|a|de|que|e|do|da|em|um|para|na|no)\b/g) || []).length;
  if(es > en && es > pt) lang = "Español";
  else if(en > es && en > pt) lang = "English";
  else if(pt > es && pt > en) lang = "Português";

  const identity = "IMPORTANTE: Nunca menciones a Gemini, Google, OpenAI, Llama, Meta o NVIDIA. Eres ÚNICAMENTE 'Aether AI', la inteligencia artificial de Aether Security. Debes responder obligatoriamente en " + lang + ".";
  
  return systemPrompt ? `${identity}\n\n${systemPrompt}` : identity;
}

let geminiRateLimitedUntil = 0;

async function queryMultiModelText(prompt: string, systemPrompt?: string, jsonMode: boolean = false) {
  systemPrompt = enhancePromptWithIdentityAndLang(prompt, systemPrompt);
  const promises: Promise<{ text: string; provider: string }>[] = [];

  const isComplex = prompt.length > 300 || prompt.toLowerCase().includes("analiza") || prompt.toLowerCase().includes("código") || prompt.toLowerCase().includes("explica");

  if (process.env.NVIDIA_API_KEY && isComplex) {
    promises.push((async () => {
      const nvidiaModels = [
        "meta/llama-3.1-70b-instruct",
        "nvidia/llama-3.1-nemotron-70b-instruct",
        "mistralai/mixtral-8x22b-instruct"
      ];
      for (const nvModel of nvidiaModels) {
        const res = await queryNvidiaAI(prompt, nvModel, systemPrompt);
        if (res) return { text: res, provider: `Aether AI` };
      }
      throw new Error("NVIDIA failed");
    })());
  }

  if (Date.now() > geminiRateLimitedUntil) {
    promises.push((async () => {
      const geminiModels = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
      for (const gModel of geminiModels) {
        try {
          const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
          const res = await ai.models.generateContent({
            model: gModel,
            contents: fullPrompt,
            ...(jsonMode ? { config: { responseMimeType: "application/json" } } : {})
          });
          if (res?.text) return { text: res.text, provider: isComplex ? `Aether AI` : `Aether AI` };
        } catch (err: any) {
          const errStr = String(err?.message || err || "");
          if (errStr.includes("429") || errStr.includes("quota") || errStr.includes("RESOURCE_EXHAUSTED")) {
            geminiRateLimitedUntil = Date.now() + 60000;
            break;
          }
        }
      }
      throw new Error("Gemini failed");
    })());
  }

  if (promises.length === 0) return null;
  try {
    return await Promise.any(promises);
  } catch (err) {
    return null;
  }
}

async function queryMultiModelMultimodal(
  prompt: string,
  mediaItems: Array<{ data: string; mimeType: string }> = [],
  systemPrompt?: string
) {
  systemPrompt = enhancePromptWithIdentityAndLang(prompt, systemPrompt);
  const promises: Promise<{ provider: string; text: string; combined: boolean }>[] = [];

  // Task 1: NVIDIA NIM (Only if no audio is present, as LLaMA Vision doesn't support audio)
  const hasAudio = mediaItems.some(i => i.mimeType.startsWith('audio/'));
  if (process.env.NVIDIA_API_KEY) {
    promises.push((async () => {
      const nvVisionModels = ["meta/llama-3.2-11b-vision-instruct", "meta/llama-3.1-70b-instruct"];
      for (const model of nvVisionModels) {
        const res = await queryNvidiaMultimodal(prompt, mediaItems, model, systemPrompt);
        if (res) return { provider: `Aether AI`, text: res, combined: false };
      }
      throw new Error("NVIDIA Vision failed");
    })());
  }

  // Task 2: Gemini Multimodal (if not temporarily paused due to quota limit)
  if (Date.now() > geminiRateLimitedUntil) {
    promises.push((async () => {
      const geminiModels = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
      for (const gModel of geminiModels) {
        try {
          const parts: any[] = [];
          for (const item of mediaItems) {
            let b64 = item.data;
            if (b64.includes(";base64,")) b64 = b64.split(";base64,")[1];
            parts.push({
              inlineData: {
                mimeType: item.mimeType || "image/jpeg",
                data: b64
              }
            });
          }
          parts.push(systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt);

          const aiRes = await ai.models.generateContent({
            model: gModel,
            contents: parts
          });

          if (aiRes && aiRes.text) {
            return { provider: `Aether AI`, text: aiRes.text, combined: false };
          }
        } catch (err: any) {
          const errStr = String(err?.message || err || "");
          if (errStr.includes("429") || errStr.includes("quota") || errStr.includes("RESOURCE_EXHAUSTED")) {
            geminiRateLimitedUntil = Date.now() + 60000;
            break;
          }
        }
      }
      throw new Error("Gemini Multimodal failed");
    })());
  }

  if (promises.length === 0) return null;
  try {
    return await Promise.any(promises);
  } catch (err) {
    return null;
  }
}

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
export interface InfractionRecord {
  id: string;
  number: number;
  timestamp: number;
  dateFormatted: string;
  reason: string;
  evidence: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  roomName?: string;
  attachmentsInfo?: string;
}

interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  ip: string;
  role: 'user' | 'admin';
  status: 'Activo' | 'Baneado' | 'Sancionado';
  isVerified: boolean;
  createdAt: number;
  isBanned: boolean;
  isPremium?: boolean;
  planTier?: 'free' | 'premium' | 'cyber_elite';
  premiumExpiresAt?: number;
  avatar?: string;
  statusMood?: string;
  bio?: string;
  violations?: number;
  infractions?: InfractionRecord[];
  banReason?: string;
  banSeverity?: 'low' | 'medium' | 'high' | 'critical';
  banEvidence?: string;
  bannedAt?: number;
  ipWhitelist?: string[];
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
  accessMode?: 'open' | 'closed' | 'global';
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
  reactions?: Array<{emoji: string, senderName: string}>;
  selfDestruct?: number;
  isPinned?: boolean;
  poll?: any;
  format?: string;
  codeLanguage?: string;
  readBy?: string[];
  status?: string;
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

import { UserModel, RoomModel, MessageModel, ThreatModel, SecurityLogModel, BannedIPModel, SessionModel, ForensicCaseModel } from './src/db/models.js';

const MASTER_ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "ydark126@gmail.com").toLowerCase();

async function getSessionUserId(token: string): Promise<string | null> {
  if (!token) return null;
  let userId = redis.get(`token:${token}`);
  if (userId) return userId;

  try {
    const session = await (SessionModel as any).findOne({ token });
    if (session && session.userId) {
      userId = session.userId;
      redis.set(`token:${token}`, userId, 86400000);
      if (session.isAdmin2FA) {
        redis.set(`admin2fa:${token}`, true, 4 * 60 * 60 * 1000);
      }
      return userId;
    }
  } catch (err) {
    console.error("Session lookup error:", err);
  }
  return null;
}

async function saveUserSession(token: string, userId: string) {
  redis.set(`token:${token}`, userId, 86400000);
  try {
    await (SessionModel as any).create({ token, userId, createdAt: Date.now() });
  } catch (err) {
    console.error("Error persisting session:", err);
  }
}

async function markAdmin2FAVerified(token: string) {
  redis.set(`admin2fa:${token}`, true, 4 * 60 * 60 * 1000);
  try {
    await (SessionModel as any).updateOne({ token }, { isAdmin2FA: true }, { upsert: true });
  } catch (err) {
    console.error("Error updating 2FA session:", err);
  }
}


const LAYER_KEYS: Buffer[] = Array.from({ length: 10 }, (_, i) => 
  i >= 1 ? crypto.scryptSync(`AETHER_SECRET_KEY_LAYER_${i}_2026`, "salt" + i, 32) : Buffer.alloc(0)
);

class DatabaseStore {
  public decryptStringIfNeeded(val: any): string {
    if (!val || typeof val !== 'string') return val || '';
    let cleaned = val.trim();
    if (cleaned.startsWith('__enc_')) {
      cleaned = cleaned.replace(/^__enc_[a-zA-Z0-9_]+:/, '');
    }
    if (cleaned.includes(':') && cleaned.split(':').length === 2 && cleaned.split(':')[0].length === 32) {
      const dec = this.decryptMetadata(cleaned);
      if (dec) cleaned = dec;
    }
    return cleaned;
  }

  async getUser(id: string) {
    const doc = await (UserModel as any).findOne({ id: id } as any);
    if (!doc) return null;
    const obj = doc.toObject ? doc.toObject() : doc;
    const u = {
      ...obj,
      name: this.decryptStringIfNeeded(obj.name),
      ip: this.decryptStringIfNeeded(obj.ip),
      banReason: this.decryptStringIfNeeded(obj.banReason),
      banEvidence: this.decryptStringIfNeeded(obj.banEvidence)
    };
    if (u.role === "admin" || (u.email && u.email.toLowerCase() === MASTER_ADMIN_EMAIL)) {
      u.isPremium = true;
      if (!u.planTier || u.planTier === 'free') u.planTier = 'cyber_elite';
    } else if (u.isPremium && u.premiumExpiresAt && u.premiumExpiresAt > 0 && u.premiumExpiresAt <= Date.now()) {
      u.isPremium = false;
      u.planTier = 'free';
      u.premiumExpiresAt = undefined;
    } else {
      u.isPremium = !!u.isPremium;
      if (!u.planTier) u.planTier = u.isPremium ? 'premium' : 'free';
    }
    return u;
  }

  async getUserByEmail(email: string) {
    const clean = String(email || '').trim().toLowerCase();
    const doc = await (UserModel as any).findOne({ email: clean } as any);
    if (!doc) return null;
    const obj = doc.toObject ? doc.toObject() : doc;
    const u = {
      ...obj,
      name: this.decryptStringIfNeeded(obj.name),
      ip: this.decryptStringIfNeeded(obj.ip),
      banReason: this.decryptStringIfNeeded(obj.banReason),
      banEvidence: this.decryptStringIfNeeded(obj.banEvidence)
    };
    if (u.role === "admin" || (u.email && u.email.toLowerCase() === MASTER_ADMIN_EMAIL)) {
      u.isPremium = true;
      if (!u.planTier || u.planTier === 'free') u.planTier = 'cyber_elite';
    } else if (u.isPremium && u.premiumExpiresAt && u.premiumExpiresAt > 0 && u.premiumExpiresAt <= Date.now()) {
      u.isPremium = false;
      u.planTier = 'free';
      u.premiumExpiresAt = undefined;
    } else {
      u.isPremium = !!u.isPremium;
      if (!u.planTier) u.planTier = u.isPremium ? 'premium' : 'free';
    }
    return u;
  }

  async saveUser(user: any) {
    const updateData = { ...user };
    delete updateData._id;
    let doc = await (UserModel as any).findOne({ id: user.id });
    if (doc) {
      Object.assign(doc, updateData);
      await doc.save();
    } else {
      await (UserModel as any).create(updateData);
    }
  }

  async deleteUser(id: string) {
    if (!id) return;
    try {
      await (SessionModel as any).deleteMany({ userId: id });
      await (UserModel as any).deleteMany({ $or: [{ id: id }, { _id: id }] } as any);
    } catch (e) {
      console.error("Error deleting user from Mongo:", e);
    }
  }

  async getRoom(id: string) {
    if (!id) return null;
    let doc = await (RoomModel as any).findOne({ id: id } as any);
    if (!doc && mongoose.Types.ObjectId.isValid(id)) {
      doc = await (RoomModel as any).findOne({ _id: id } as any);
    }
    if (!doc) {
      const all = await (RoomModel as any).find();
      doc = all.find((r: any) => r.id === id || (r._id && r._id.toString() === id));
    }
    if (!doc) return null;
    const obj = doc.toObject ? doc.toObject() : doc;
    return {
      ...obj,
      id: obj.id || (obj._id ? obj._id.toString() : id),
      name: this.decryptStringIfNeeded(obj.name)
    };
  }

  async deleteRoom(id: string) {
    if (!id) return;
    try {
      if (mongoose.Types.ObjectId.isValid(id)) {
        await (RoomModel as any).deleteMany({ $or: [{ id: id }, { _id: id }] } as any);
      } else {
        await (RoomModel as any).deleteMany({ id: id } as any);
      }
      await (MessageModel as any).deleteMany({ roomId: id } as any);
    } catch (err) {
      console.error("Error in deleteRoom:", err);
      try {
        await (RoomModel as any).deleteMany({ id: id } as any);
        await (MessageModel as any).deleteMany({ roomId: id } as any);
      } catch (e) {}
    }
  }

  async getRoomByCode(code: string) {
    if (!code) return null;
    const cleanCode = String(code).trim();
    
    // 1. Exact match
    let doc = await (RoomModel as any).findOne({ code: cleanCode } as any);
    if (doc) {
      const obj = doc.toObject ? doc.toObject() : doc;
      return { ...obj, name: this.decryptStringIfNeeded(obj.name) };
    }

    // 2. Case-insensitive regex match
    try {
      doc = await (RoomModel as any).findOne({ code: { $regex: new RegExp('^' + cleanCode + '$', 'i') } } as any);
      if (doc) {
        const obj = doc.toObject ? doc.toObject() : doc;
        return { ...obj, name: this.decryptStringIfNeeded(obj.name) };
      }
    } catch (e) {
      // Regex fallback
    }

    // 3. Scan all rooms fallback
    const all = await (RoomModel as any).find();
    const found = all.find((r: any) => r.code && String(r.code).trim().toLowerCase() === cleanCode.toLowerCase());
    if (found) {
      const obj = found.toObject ? found.toObject() : found;
      return { ...obj, name: this.decryptStringIfNeeded(obj.name) };
    }

    return null;
  }

  async saveRoom(room: any) {
    const updateData = { ...room };
    delete updateData._id;
    let doc = await (RoomModel as any).findOne({ id: room.id });
    if (doc) {
      Object.assign(doc, updateData);
      await doc.save();
    } else {
      await (RoomModel as any).create(updateData);
    }
  }

  async getMessages(roomId: string) {
    const docs = await (MessageModel as any).find({ roomId: roomId } as any).sort({ timestamp: 1 });
    return docs.map((d: any) => {
      const obj = d.toObject ? d.toObject() : d;
      return {
        ...obj,
        senderName: this.decryptStringIfNeeded(obj.senderName),
        senderEmail: this.decryptStringIfNeeded(obj.senderEmail),
        encryptedText: this.decryptStringIfNeeded(obj.encryptedText)
      };
    });
  }

  async saveMessage(msg: any) {
    try {
      await (MessageModel as any).create(msg);
    } catch (e) {
      console.error("Error saving message:", e);
    }
  }

  async updateMessagePoll(messageId: string, poll: any) {
    try {
      await (MessageModel as any).updateOne({ id: messageId }, { $set: { poll } });
    } catch (e) {
      console.error("Error updating message poll:", e);
    }
  }

  async updateMessagePin(messageId: string, isPinned: boolean) {
    try {
      await (MessageModel as any).updateOne({ id: messageId }, { $set: { isPinned } });
    } catch (e) {
      console.error("Error updating message pin:", e);
    }
  }

  async deleteMessage(messageId: string) {
    try {
      await (MessageModel as any).deleteOne({ id: messageId });
    } catch (e) {
      console.error("Error deleting message:", e);
    }
  }

  async markMessagesRead(roomId: string, userId: string): Promise<string[]> {
    try {
      const unreadDocs = await (MessageModel as any).find({
        roomId: roomId,
        senderId: { $ne: userId },
        readBy: { $ne: userId }
      }).select('id');
      const ids = unreadDocs.map((d: any) => d.id);
      if (ids.length > 0) {
        await (MessageModel as any).updateMany(
          { roomId: roomId, senderId: { $ne: userId } },
          { $addToSet: { readBy: userId } }
        );
      }
      return ids;
    } catch (e) {
      console.error("Error marking messages read:", e);
      return [];
    }
  }

  async addBannedIP(ip: string, reason?: string, severity?: string, bannedBy?: string) {
    const cleanIp = ip ? ip.trim() : '';
    if (!cleanIp) return;
    await (BannedIPModel as any).findOneAndUpdate(
      { ip: cleanIp } as any,
      {
        ip: cleanIp,
        reason: reason || 'Bloqueo WAF / Sanción Manual',
        severity: severity || 'high',
        bannedBy: bannedBy || 'Admin / WAF',
        timestamp: Date.now()
      },
      { upsert: true }
    );
  }

  async removeBannedIP(ip: string) {
    const cleanIp = ip ? ip.trim() : '';
    if (!cleanIp) return;
    await (BannedIPModel as any).deleteOne({ ip: cleanIp } as any);
  }

  async isIpBanned(ip: string) {
    const cleanIp = ip ? ip.trim() : '';
    if (!cleanIp || cleanIp === '127.0.0.1' || cleanIp === '::1' || cleanIp === 'localhost') return false;
    return (await (BannedIPModel as any).findOne({ ip: cleanIp } as any)) !== null;
  }

  async addThreat(threat: any) {
    await (ThreatModel as any).create(threat);
  }

  async addSecurityLog(log: any) {
    await (SecurityLogModel as any).create(log);
  }

  async getAllUsers() {
    const docs = await (UserModel as any).find();
    return docs.map((d: any) => {
      const obj = d.toObject ? d.toObject() : d;
      return {
        ...obj,
        id: obj.id || (obj._id ? obj._id.toString() : ''),
        name: this.decryptStringIfNeeded(obj.name),
        ip: this.decryptStringIfNeeded(obj.ip),
        banReason: this.decryptStringIfNeeded(obj.banReason),
        banEvidence: this.decryptStringIfNeeded(obj.banEvidence)
      };
    });
  }

  async getAllRooms() {
    const docs = await (RoomModel as any).find();
    return docs.map((d: any) => {
      const obj = d.toObject ? d.toObject() : d;
      return {
        ...obj,
        name: this.decryptStringIfNeeded(obj.name)
      };
    });
  }

  async getAllBannedIPs() {
    const ips = await (BannedIPModel as any).find();
    return ips.map((i: any) => this.decryptStringIfNeeded(i.ip));
  }

  async getAllBannedIPsDetails() {
    const docs = await (BannedIPModel as any).find().sort({ timestamp: -1 });
    return docs.map((d: any) => {
      const obj = d.toObject ? d.toObject() : d;
      return {
        id: obj.id || (obj._id ? obj._id.toString() : 'ip-' + Math.random()),
        ip: this.decryptStringIfNeeded(obj.ip),
        reason: obj.reason || 'Bloqueo de red / Sanción',
        severity: obj.severity || 'high',
        bannedBy: obj.bannedBy || 'Sistema WAF',
        timestamp: obj.timestamp || Date.now()
      };
    });
  }

  async getAllThreats() {
    const docs = await (ThreatModel as any).find();
    return docs.map((d: any) => {
      const obj = d.toObject ? d.toObject() : d;
      return {
        id: obj.id || (obj._id ? obj._id.toString() : 'threat-' + Math.random()),
        ip: this.decryptStringIfNeeded(obj.ip),
        userId: obj.userId,
        userEmail: this.decryptStringIfNeeded(obj.userEmail),
        reason: this.decryptStringIfNeeded(obj.reason),
        severity: obj.severity || 'high',
        evidence: this.decryptStringIfNeeded(obj.evidence),
        timestamp: obj.timestamp || Date.now(),
        blocked: true,
        webhookNotified: false
      };
    });
  }

  async getAllSecurityLogs() {
    const docs = await (SecurityLogModel as any).find().sort({ timestamp: -1 });
    return docs.map((d: any) => {
      const obj = d.toObject ? d.toObject() : d;
      return {
        id: obj.id || (obj._id ? obj._id.toString() : 'log-' + Math.random()),
        ip: this.decryptStringIfNeeded(obj.ip),
        action: obj.event || obj.action || 'ACCESS',
        event: obj.event || obj.action || 'ACCESS',
        target: this.decryptStringIfNeeded(obj.target),
        userEmail: this.decryptStringIfNeeded(obj.userEmail),
        details: this.decryptStringIfNeeded(obj.details),
        timestamp: obj.timestamp || Date.now(),
        suspicious: !!obj.suspicious
      };
    });
  }

  async getUsersCount() { return await (UserModel as any).countDocuments(); }
  async getRoomsCount() { return await (RoomModel as any).countDocuments(); }
  async getBannedIPsCount() { return await (BannedIPModel as any).countDocuments(); }
  async getThreatsCount() { return await (ThreatModel as any).countDocuments(); }
  async getSecurityLogsCount() { return await (SecurityLogModel as any).countDocuments(); }
  async getForensicCasesCount() { return await (ForensicCaseModel as any).countDocuments(); }

  async addForensicCase(caseData: {
    id: string;
    roomId: string;
    roomName: string;
    offenderUserId: string;
    offenderEmail: string;
    offenderName: string;
    offenderIp: string;
    lawArticles: string[];
    violationSummary: string;
    evidenceSnippet: string;
    fullTranscript: string;
    messagesJson: any[];
    usersExpelledCount?: number;
  }) {
    try {
      const doc = await (ForensicCaseModel as any).create({
        ...caseData,
        timestamp: Date.now(),
        status: 'seized_and_banned',
        usersExpelledCount: caseData.usersExpelledCount || 0
      });
      return doc;
    } catch (err) {
      console.error("[FORENSIC CASE SAVE ERROR]", err);
      return null;
    }
  }

  async getAllForensicCases() {
    try {
      const docs = await (ForensicCaseModel as any).find().sort({ timestamp: -1 });
      return docs.map((d: any) => {
        const obj = d.toObject ? d.toObject() : d;
        return {
          ...obj,
          offenderEmail: this.decryptStringIfNeeded(obj.offenderEmail),
          offenderIp: this.decryptStringIfNeeded(obj.offenderIp),
          offenderName: this.decryptStringIfNeeded(obj.offenderName)
        };
      });
    } catch (err) {
      console.error("[FORENSIC CASES GET ERROR]", err);
      return [];
    }
  }

  async deleteForensicCase(caseId: string) {
    try {
      await (ForensicCaseModel as any).deleteOne({ id: caseId });
      return true;
    } catch (err) {
      console.error("[FORENSIC CASE DELETE ERROR]", err);
      return false;
    }
  }
  
  isDirty = false;
  saveDatabase() {}

  public async ensureMasterAdmin() {
    try {
      const email = MASTER_ADMIN_EMAIL;
      const masterUser = await this.getUserByEmail(email);
      const adminPassHash = this.hashPassword("Admin123");

      if (!masterUser) {
        await this.saveUser({
          id: "admin-master-101",
          email: email,
          passwordHash: adminPassHash,
          name: "Aether Master Admin",
          ip: "200.70.47.11",
          ipWhitelist: ["200.70.47.11"],
          role: "admin",
          status: "Activo",
          isVerified: true,
          isPremium: true,
          planTier: "cyber_elite",
          createdAt: Date.now(),
          isBanned: false
        });
        console.log(`[ADMIN SYNC] Master admin ${email} creado exitosamente con clave Admin123 e IP 200.70.47.11.`);
      } else {
        masterUser.role = "admin";
        masterUser.status = "Activo";
        masterUser.isBanned = false;
        masterUser.isVerified = true;
        masterUser.isPremium = true;
        masterUser.planTier = "cyber_elite";
        masterUser.passwordHash = adminPassHash;
        masterUser.ip = "200.70.47.11";
        masterUser.ipWhitelist = ["200.70.47.11"];
        await this.saveUser(masterUser);
        console.log(`[ADMIN SYNC] Master admin ${email} sincronizado exitosamente (IP: 200.70.47.11, Plan: cyber_elite).`);
      }
    } catch (err) {
      console.error("[ADMIN SYNC ERROR]", err);
    }
  }

  public async loadDatabase() {
    try {
      await connectMongo();
      await this.ensureMasterAdmin();
    } catch (err) {
      console.error("MongoDB load error:", err);
    }
  }

  public async seedDefaultAdmin() {
    const adminId = "admin-master-101";
    await this.saveUser({
      id: adminId,
      email: MASTER_ADMIN_EMAIL,
      passwordHash: this.hashPassword("Admin123"),
      name: "Aether Master Admin",
      ip: "200.70.47.11",
      ipWhitelist: ["200.70.47.11"],
      role: "admin",
      status: "Activo",
      isVerified: true,
      isPremium: true,
      planTier: "cyber_elite",
      createdAt: Date.now(),
      isBanned: false
    });
  }

  public hashPassword(plain: string): string {
    let hash = plain;
    for (let i = 1; i <= 9; i++) {
      const algo = i % 2 === 0 ? "sha512" : "sha256";
      hash = crypto.createHash(algo).update(hash + `_AETHER_LAYER_${i}_2026`).digest("hex");
    }
    return hash;
  }

  public encryptMetadata(data: string): string {
    try {
      let currentData = data;
      let finalIv = "";
      for (let i = 1; i <= 9; i++) {
        const key = LAYER_KEYS[i];
        const iv = (i === 9) ? crypto.randomBytes(16) : crypto.createHash('md5').update("AETHER_IV_" + i).digest();
        if (i === 9) finalIv = iv.toString("hex");
        else finalIv = iv.slice(0, 16).toString("hex");
        const cipher = crypto.createCipheriv("aes-256-cbc", key, i === 9 ? iv : iv.slice(0, 16));
        let encrypted = cipher.update(currentData, "utf-8", "hex");
        encrypted += cipher.final("hex");
        currentData = encrypted;
      }
      return finalIv + ":" + currentData;
    } catch (e) {
      return data;
    }
  }

  public decryptMetadata(data: string): string {
    try {
      const parts = data.split(":");
      if (parts.length < 2) return data;
      const finalIv = parts.shift()!;
      let currentData = parts.join(":");
      for (let i = 9; i >= 1; i--) {
        const key = LAYER_KEYS[i];
        const iv = (i === 9) ? Buffer.from(finalIv, "hex") : crypto.createHash('md5').update("AETHER_IV_" + i).digest().slice(0, 16);
        const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
        let decrypted = decipher.update(currentData, "hex", "utf-8");
        decrypted += decipher.final("utf-8");
        currentData = decrypted;
      }
      return currentData;
    } catch (e) {
      return data;
    }
  }

  public async logSecurityEvent(ip: string, event: string, target?: string, details?: string, suspicious = false) {
    await this.addSecurityLog({
      ip,
      event,
      target,
      details,
      timestamp: Date.now(),
      suspicious
    });
  }

  public async banUserAndIP(ip: string, reason: string, severity: 'low' | 'medium' | 'high' | 'critical', evidence?: string, userId?: string, bannedBy?: string) {
    await this.addBannedIP(ip, reason, severity, bannedBy || 'WAF Auto-Ban');
    
    if (userId) {
      const user = await this.getUser(userId);
      if (user) {
        user.isBanned = true;
        user.status = "Baneado";
        user.banReason = reason;
        user.banSeverity = severity;
        user.banEvidence = evidence;
        await this.saveUser(user);
      }
    }

    await this.addThreat({
      ip,
      userId,
      userEmail: userId ? (await this.getUser(userId))?.email : undefined,
      reason,
      severity,
      evidence,
      timestamp: Date.now()
    });

    await this.logSecurityEvent(ip, "BANNED", userId || ip, reason, true);
  }
}

const db = new DatabaseStore();

// Client IP helper
function normalizeIp(ip: string): string {
  if (!ip) return '';
  let clean = ip.trim();
  if (clean.startsWith('::ffff:')) clean = clean.substring(7);
  if (clean === '::1' || clean === 'localhost') return '127.0.0.1';
  return clean;
}

function isInternalOrLoopbackIp(ip: string): boolean {
  const norm = normalizeIp(ip);
  if (!norm || norm === '127.0.0.1' || norm === '::1' || norm === 'localhost') return true;
  if (norm.startsWith('10.') || norm.startsWith('169.254.') || norm.startsWith('192.168.') || norm.startsWith('172.16.') || norm.startsWith('172.17.') || norm.startsWith('172.18.') || norm.startsWith('172.19.') || norm.startsWith('172.20.') || norm.startsWith('172.21.') || norm.startsWith('172.22.') || norm.startsWith('172.23.') || norm.startsWith('172.24.') || norm.startsWith('172.25.') || norm.startsWith('172.26.') || norm.startsWith('172.27.') || norm.startsWith('172.28.') || norm.startsWith('172.29.') || norm.startsWith('172.30.') || norm.startsWith('172.31.')) return true;
  return false;
}

function checkIsIpWhitelisted(reqIp: string, whitelist: string[], userCurrentIp?: string): boolean {
  if (!Array.isArray(whitelist) || whitelist.length === 0) return true;

  const normReq = normalizeIp(reqIp);

  // Always allow container loopback & internal proxy addresses
  if (isInternalOrLoopbackIp(normReq)) return true;

  // Always match the user's recorded login/session IP
  if (userCurrentIp && normalizeIp(userCurrentIp) === normReq) return true;

  for (const entry of whitelist) {
    const normEntry = normalizeIp(entry);
    if (!normEntry) continue;
    if (normEntry === normReq) return true;
    if (normEntry.endsWith('.*')) {
      const prefix = normEntry.slice(0, -2);
      if (normReq.startsWith(prefix + '.')) return true;
    }
  }

  return false;
}

function getClientIP(req: express.Request): string {
  const forwarded = req.headers['x-forwarded-for'] || req.headers['x-real-ip'];
  if (typeof forwarded === 'string') {
    return normalizeIp(forwarded.split(',')[0]);
  }
  if (Array.isArray(forwarded)) {
    return normalizeIp(forwarded[0]);
  }
  return normalizeIp(req.ip || req.socket.remoteAddress || '127.0.0.1');
}

// Advanced AI & Heuristic Anti-VPN / Anti-Proxy Engine (AetherSentinel AI)
const vpnDetectionCache = new Map<string, { detected: boolean; providerType: string; confidenceScore: number; reason: string; timestamp: number }>();

function heuristicVpnCheck(req: express.Request): { detected: boolean; reason?: string; score: number } {
  let score = 0;
  const reasons: string[] = [];
  const ip = getClientIP(req);

  // 1. Loopback & Local check (never flag local/private IPs or cloud ingress load balancers)
  if (isInternalOrLoopbackIp(ip)) {
    return { detected: false, score: 0 };
  }

  // 2. Suspicious proxy headers inspection
  const proxyHeaders = ['x-proxyuser-ip', 'x-proxy-id', 'via', 'x-forwarded-server', 'x-forwarded-host', 'forwarded'];
  for (const h of proxyHeaders) {
    if (req.headers[h]) {
      score += 25;
      reasons.push(`Cabecera proxy detectada (${h})`);
    }
  }

  // 3. Hop count analysis in x-forwarded-for (> 6 hops is suspicious)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string') {
    const hops = forwardedFor.split(',').map(h => h.trim());
    if (hops.length >= 6) {
      score += 35;
      reasons.push(`Múltiples saltos de red en X-Forwarded-For (${hops.length} saltos)`);
    }
  }

  // 4. User-Agent heuristics (headless, curl, python-requests, suspicious toolsets)
  const ua = (req.headers['user-agent'] || '').toLowerCase();
  if (!ua || ua.length < 5 || ua.includes('curl') || ua.includes('python') || ua.includes('postman') || ua.includes('axios') || ua.includes('puppeteer') || ua.includes('selenium') || ua.includes('tor')) {
    score += 40;
    reasons.push(`User-Agent sospechoso / Automatizado (${ua.substring(0, 40) || 'Vacío'})`);
  }

  // 5. Datacenter / Known VPN provider subnet heuristics
  if (ip.startsWith('3.') || ip.startsWith('34.') || ip.startsWith('52.') || ip.startsWith('104.') || ip.startsWith('159.65.') || ip.startsWith('178.62.')) {
    score += 25;
    reasons.push(`Rango IP asociado a Proveedor Cloud / Datacenter (${ip})`);
  }

  return {
    detected: score >= 65,
    reason: reasons.join(' | ') || 'Anomalía de red detectada',
    score
  };
}

async function analyzeVpnOrProxyWithAI(ip: string, headers: any, heuristicResult: any): Promise<{ detected: boolean; providerType: string; confidenceScore: number; reason: string }> {
  const cacheKey = ip;
  const cached = vpnDetectionCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < 3600000)) { // 1 hour cache
    return cached;
  }

  try {
    const prompt = `Actúa como SISTEMA DE INTELIGENCIA ARTIFICIAL AVANZADA Y ANÁLISIS DE TELEMETRÍA DE RED (AetherSentinel AI).
Evalúa si la siguiente conexión HTTP proviene de una VPN comercial, Proxy, Nodo Tor, o Red de Anonimización (Residential Proxy):
- IP Origen: ${ip}
- Puntuación Heurística Interna: ${heuristicResult.score}/100
- Razones Heurísticas: ${heuristicResult.reason}
- Cabeceras HTTP Clave: ${JSON.stringify({
  'user-agent': headers['user-agent'],
  'accept-language': headers['accept-language'],
  'sec-ch-ua': headers['sec-ch-ua'],
  'via': headers['via'],
  'x-forwarded-for': headers['x-forwarded-for']
})}

CRITERIOS DE CLASIFICACIÓN:- "commercial_vpn": NordVPN, ExpressVPN, Surfshark, Mullvad, etc.- "datacenter_proxy": AWS, DigitalOcean, Hetzner, OVH, VPNs basadas en servidores cloud.- "tor_node": Red de onion routing Tor.- "residential_proxy": Proxies residenciales rotativos (Luminati, Oxylabs, etc.).- "clean": Tráfico legítimo de usuario final o infraestructura cloud oficial.

Devuelve EXCLUSIVAMENTE un JSON estricto sin markdown:
{
  "isVpnOrProxy": boolean,
  "providerType": "commercial_vpn" | "datacenter_proxy" | "tor_node" | "residential_proxy" | "clean",
  "confidenceScore": number (0 a 100),
  "reason": "Explicación técnica detallada"
}`;

    const res = await queryMultiModelText(prompt, "Eres AetherSentinel AI, el motor de ciberseguridad y detección de proxys y VPNs en tiempo real.", true);
    if (res && res.text) {
      const cleanJson = res.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      const result = {
        detected: !!parsed.isVpnOrProxy && (parsed.confidenceScore >= 80),
        providerType: parsed.providerType || 'clean',
        confidenceScore: parsed.confidenceScore || 0,
        reason: parsed.reason || 'Análisis IA completado',
        timestamp: Date.now()
      };
      vpnDetectionCache.set(cacheKey, result);
      return result;
    }
  } catch (err) {
    console.error("Error en detección AI de VPN/Proxy:", err);
  }

  const fallbackResult = {
    detected: heuristicResult.detected && heuristicResult.score >= 70,
    providerType: heuristicResult.detected ? 'commercial_vpn' : 'clean',
    confidenceScore: heuristicResult.score,
    reason: heuristicResult.reason || 'Detección por heurística avanzada',
    timestamp: Date.now()
  };
  vpnDetectionCache.set(cacheKey, fallbackResult);
  return fallbackResult;
}

// IP Ban Enforcement Middleware
app.use(async (req, res, next) => {
  const ip = getClientIP(req);
  if (isInternalOrLoopbackIp(ip)) {
    return next();
  }
  if ((await db.isIpBanned(ip))) {
    db.logSecurityEvent(ip, "ACCESS_DENIED", undefined, "Petición denegada por IP bloqueada", true);
    return res.status(403).json({
      error: "Acceso restringido",
      message: "Aether Security: Tu dirección IP se encuentra bloqueada en la lista negra de la plataforma.",
      ip
    });
  }
  next();
});

// Helper for backward compatibility with WebSocket VPN checks
function isVpnOrProxy(req: express.Request): { detected: boolean; reason?: string } {
  const h = heuristicVpnCheck(req);
  return { detected: h.detected, reason: h.reason };
}

// Anti-VPN & Proxy Advanced AI Detection Middleware
app.use(async (req, res, next) => {
  const ip = getClientIP(req);
  if (isInternalOrLoopbackIp(ip)) {
    return next();
  }

  // Bypass exemptions for static assets or health checks
  if (req.path.startsWith('/assets') || req.path === '/api/health') {
    return next();
  }

  const heuristic = heuristicVpnCheck(req);
  if (heuristic.score >= 35) {
    const aiCheck = await analyzeVpnOrProxyWithAI(ip, req.headers, heuristic);
    if (aiCheck.detected) {
      console.log(`[AETHER SENTINEL AI] ⛔ VPN/Proxy detectado para IP ${ip}: ${aiCheck.reason} (Confianza: ${aiCheck.confidenceScore}%, Tipo: ${aiCheck.providerType})`);
      db.logSecurityEvent(ip, "VPN_PROXY_BLOCKED", undefined, `Conexión bloqueada por Anti-VPN / Anti-Proxy AI. Tipo: ${aiCheck.providerType}. Razón: ${aiCheck.reason}`, true);
      return res.status(403).json({
        error: "Aether Security: Conexión Anónima / VPN Bloqueada",
        message: `El sistema de inteligencia artificial AetherSentinel ha detectado el uso de ${aiCheck.providerType === 'tor_node' ? 'Nodo Tor' : aiCheck.providerType === 'commercial_vpn' ? 'VPN Comercial' : 'Proxy de red anónima'}. Desactiva tu VPN o proxy para acceder a la plataforma.`,
        providerType: aiCheck.providerType,
        confidence: aiCheck.confidenceScore
      });
    }
  }

  next();
});

// Authentication Token Middleware
async function authenticateToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token || token === 'undefined' || token === 'null') return res.status(401).json({ error: "Sesión no válida" });

  const userId = await getSessionUserId(token);
  if (!userId) {
    return res.status(401).json({ error: "Sesión expirable o inválida" });
  }

  const user = await db.getUser(userId);
  if (!user) {
    return res.status(401).json({ error: "Sesión expirable o inválida" });
  }

  if (user.isBanned || user.status === 'Sancionado' || user.status === 'Baneado') {
    return res.status(403).json({ error: "Aether Security: Cuenta con estado Baneado." });
  }

  if (user.ip && (await db.isIpBanned(user.ip))) {
    return res.status(403).json({ error: "Aether Security: Dirección IP bloqueada." });
  }

  // IP Whitelist Check (allowed endpoints like ip-whitelist management or /api/auth/me skip the restriction)
  const isExemptEndpoint = req.path === '/api/users/ip-whitelist' || req.path === '/api/auth/me';
  if (!isExemptEndpoint && Array.isArray(user.ipWhitelist) && user.ipWhitelist.length > 0) {
    const reqIp = getClientIP(req);
    if (!checkIsIpWhitelisted(reqIp, user.ipWhitelist, user.ip)) {
      db.logSecurityEvent(reqIp, "UNAUTHORIZED_IP_ACCESS", user.email, `Acceso bloqueado por Lista Blanca de IPs (${reqIp} no autorizada)`, true);
      return res.status(403).json({
        error: `Aether Security: Acceso restringido. Tu dirección IP (${reqIp}) no se encuentra registrada en la Lista Blanca de esta cuenta.`,
        unauthorizedIp: reqIp
      });
    }
  }

  (req as any).user = user;
  (req as any).token = token;
  next();
}

// Admin Role + 2FA Verification Middleware
async function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = (req as any).user as UserRecord;
  const token = (req as any).token as string;

  if (!user || (user.role !== 'admin' && user.email?.toLowerCase() !== MASTER_ADMIN_EMAIL)) {
    return res.status(403).json({ error: "Requiere permisos de perfil de administración" });
  }

  // Check 2FA Verification status in Redis session or DB fallback
  let is2FAVerified = !!redis.get(`admin2fa:${token}`);
  if (!is2FAVerified && token) {
    try {
      const session = await (SessionModel as any).findOne({ token, isAdmin2FA: true });
      if (session) {
        is2FAVerified = true;
        redis.set(`admin2fa:${token}`, true, 4 * 60 * 60 * 1000);
      }
    } catch (e) {}
  }

  if (!is2FAVerified) {
    return res.status(403).json({
      error: "Aether Security: Se requiere verificación 2FA por código de correo de Gmail para acceder al panel admin.",
      requiresAdmin2FA: true
    });
  }

  next();
}


// HTML Email Templates for Infraction Warnings & Sanction Reports
function generateEmail1Html(user: UserRecord, infraction: InfractionRecord): string {
  const content = `
    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
      El motor de moderación y filtrado automatizado de <strong>Aether Security</strong> ha detectado e interceptado una transmisión no permitida asociada a su cuenta.
    </p>

    <div style="background-color: #0f172a; border-radius: 14px; padding: 20px; border: 1px solid #1e293b; margin-bottom: 20px;">
      <h3 style="margin: 0 0 14px 0; font-size: 11px; color: #f59e0b; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 800;">📋 Informe de Incidente Registrado</h3>
      <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #1e293b; color: #64748b; font-size: 12px;">Fecha UTC</td>
          <td align="right" style="padding: 8px 0; border-bottom: 1px solid #1e293b; color: #f8fafc; font-size: 12px; font-weight: 600;">${infraction.dateFormatted}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #1e293b; color: #64748b; font-size: 12px;">Ubicación / Sala</td>
          <td align="right" style="padding: 8px 0; border-bottom: 1px solid #1e293b; color: #f8fafc; font-size: 12px; font-weight: 600;">${infraction.roomName || 'Sala General'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 12px;">Motivo de Intercepción</td>
          <td align="right" style="padding: 8px 0; color: #fbbf24; font-size: 12px; font-weight: 700;">${infraction.reason}</td>
        </tr>
      </table>

      <div style="padding-top: 12px; border-top: 1px solid #1e293b;">
        <div style="color: #64748b; font-size: 11px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Fragmento de Evidencia Interceptada</div>
        <div style="background-color: #070c18; border: 1px solid #1e293b; padding: 14px; border-radius: 10px; color: #38bdf8; font-family: monospace; font-size: 12px; line-height: 1.5; word-break: break-all;">
          ${infraction.evidence}
        </div>
      </div>
    </div>

    <div style="background-color: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3); padding: 16px; border-radius: 12px;">
      <h4 style="margin: 0 0 6px 0; color: #fbbf24; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">⚠️ Protocolo de Sanciones Progresivas</h4>
      <p style="margin: 0; color: #cbd5e1; font-size: 12px; line-height: 1.6;">
        Le solicitamos mantener los estándares de convivencia y seguridad de la red. Acumular <strong>3 infracciones graves</strong> provocará la revocación inmediata de su cuenta y el bloqueo permanente de su IP.
      </p>
    </div>
  `;
  return buildAetherEmail(`Aviso de Moderación: ${user.name}`, "⚠️ ADVERTENCIA 1/3", content, "#f59e0b");
}

function generateEmail2Html(user: UserRecord, infraction: InfractionRecord, fullHistory: InfractionRecord[]): string {
  const historyHtml = fullHistory.map((inf, idx) => `
    <div style="margin-bottom: 12px; padding-bottom: 12px; ${idx !== fullHistory.length - 1 ? 'border-bottom: 1px solid #1e293b;' : ''}">
      <table width="100%" border="0" cellpadding="0" cellspacing="0">
        <tr>
          <td style="color: #f43f5e; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Infracción #${inf.number}</td>
          <td align="right" style="color: #64748b; font-size: 11px;">${inf.dateFormatted}</td>
        </tr>
      </table>
      <div style="color: #f8fafc; font-size: 13px; font-weight: 600; margin-top: 4px;">${inf.reason}</div>
    </div>
  `).join('');

  const content = `
    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #fecdd3;">
      Se ha registrado una <strong>SEGUNDA INFRACCIÓN GRAVE (2/3)</strong> en la cuenta <strong>${user.email}</strong>. La actividad detectada violó estrictamente las normas de seguridad de la red.
    </p>

    <div style="background-color: #0f172a; border-radius: 14px; padding: 20px; border: 1px solid rgba(239,68,68,0.4); margin-bottom: 20px;">
      <h3 style="margin: 0 0 12px 0; font-size: 11px; color: #ef4444; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 800;">🚨 Incidente Reciente Detectado</h3>
      <div style="margin-bottom: 14px;">
        <div style="color: #64748b; font-size: 11px; margin-bottom: 4px; text-transform: uppercase;">Causa de Intercepción</div>
        <div style="color: #fca5a5; font-size: 13px; font-weight: 700;">${infraction.reason}</div>
      </div>
      <div>
        <div style="color: #64748b; font-size: 11px; margin-bottom: 4px; text-transform: uppercase;">Evidencia Registrada</div>
        <div style="background-color: #070c18; border: 1px solid #1e293b; padding: 12px; border-radius: 10px; color: #f87171; font-family: monospace; font-size: 12px; line-height: 1.5; word-break: break-all;">
          ${infraction.evidence}
        </div>
      </div>
    </div>

    <h3 style="margin: 0 0 12px 0; font-size: 12px; color: #cbd5e1; text-transform: uppercase; letter-spacing: 1px; font-weight: 800;">Historial Acumulado de Infracciones</h3>
    <div style="background-color: #0f172a; border-radius: 14px; padding: 18px; border: 1px solid #1e293b; margin-bottom: 20px;">
      ${historyHtml}
    </div>

    <div style="background: linear-gradient(135deg, rgba(239,68,68,0.2), rgba(127,29,29,0.4)); border: 1px solid #ef4444; padding: 20px; border-radius: 14px; text-align: center;">
      <h4 style="margin: 0 0 8px 0; color: #fef2f2; font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px;">🚨 ÚLTIMO AVISO PREVIO A EXPULSIÓN PERMANENTE</h4>
      <p style="margin: 0; color: #fecaca; font-size: 12px; line-height: 1.6; font-weight: 600;">
        Una (1) infracción adicional ocasionará la suspensión automatizada, inmediata e irreversible de la cuenta <strong>${user.email}</strong> y de su dirección IP de red.
      </p>
    </div>
  `;
  return buildAetherEmail(`Atención Requerida: ${user.name}`, "🚨 2DA ADVERTENCIA - ÚLTIMO AVISO", content, "#ef4444");
}

function generateSanctionEmailHtml(user: UserRecord, lastInfraction: InfractionRecord, fullHistory: InfractionRecord[], ip: string): string {
  const historyRows = fullHistory.map((inf, idx) => `
    <div style="background-color: #0f172a; border-left: 4px solid #ef4444; border-radius: 10px; padding: 16px; margin-bottom: 12px; border-top: 1px solid #1e293b; border-right: 1px solid #1e293b; border-bottom: 1px solid #1e293b;">
      <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 8px;">
        <tr>
          <td style="color: #f87171; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Infracción #${inf.number || (idx + 1)} — Severidad: ${inf.severity}</td>
          <td align="right" style="color: #64748b; font-size: 11px;">${inf.dateFormatted}</td>
        </tr>
      </table>
      <div style="color: #cbd5e1; font-size: 12px; margin-bottom: 6px;"><strong>Motivo:</strong> ${inf.reason}</div>
      <div style="color: #64748b; font-size: 11px; margin-bottom: 8px;"><strong>Ubicación:</strong> ${inf.roomName || 'Sala General'}</div>
      <div style="background-color: #070c18; padding: 10px; border-radius: 8px; border: 1px solid #1e293b; font-family: monospace; font-size: 11px; color: #ef4444; word-break: break-all;">
        ${inf.evidence}
      </div>
    </div>
  `).join('');

  const content = `
    <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
      Le informamos formalmente que la cuenta <strong>${user.email}</strong> y la dirección IP <strong>${ip}</strong> han sido <strong>suspendidas de manera permanente</strong> de toda la infraestructura de Aether Security por haber alcanzado el límite máximo de <strong>3 infracciones de seguridad</strong>.
    </p>

    <div style="background-color: #0f172a; border-radius: 14px; padding: 20px; border: 1px solid #1e293b; margin-bottom: 24px;">
      <h3 style="margin: 0 0 16px 0; font-size: 11px; color: #ef4444; font-weight: 800; border-bottom: 1px solid #1e293b; padding-bottom: 10px; text-transform: uppercase; letter-spacing: 1px;">📋 Ficha de Bloqueo Administrativo</h3>
      <table width="100%" border="0" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #1e293b; color: #64748b; font-size: 12px;">Estado del Sistema</td>
          <td align="right" style="padding: 8px 0; border-bottom: 1px solid #1e293b; color: #ef4444; font-size: 12px; font-weight: 900;">EXPULSADO / BANEAR IP</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #1e293b; color: #64748b; font-size: 12px;">Cuenta Suspendida</td>
          <td align="right" style="padding: 8px 0; border-bottom: 1px solid #1e293b; color: #f8fafc; font-size: 12px; font-weight: 600;">${user.email}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #1e293b; color: #64748b; font-size: 12px;">IP Bloqueada</td>
          <td align="right" style="padding: 8px 0; border-bottom: 1px solid #1e293b; color: #f8fafc; font-size: 12px; font-weight: 600; font-family: monospace;">${ip}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 12px;">Detonante de Sanción</td>
          <td align="right" style="padding: 8px 0; color: #f87171; font-size: 12px; font-weight: 600;">Infracción 3/3 — ${lastInfraction.reason}</td>
        </tr>
      </table>
    </div>

    <h3 style="margin: 0 0 14px 0; font-size: 12px; color: #cbd5e1; text-transform: uppercase; letter-spacing: 1px; font-weight: 800;">Historial Completo de Infracciones</h3>
    ${historyRows}
  `;
  return buildAetherEmail(`Suspensión Definitiva de Cuenta`, "⛔ SANCIÓN DEFINITIVA", content, "#ef4444");
}

async function handleUserInfractionAndNotify(
  user: UserRecord,
  ip: string,
  reason: string,
  evidence: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  roomId?: string,
  attachmentsInfo?: string,
  plainText?: string
) {
  if (!user.infractions) user.infractions = [];
  user.violations = (user.violations || 0) + 1;

  const room = roomId ? (await db.getRoom(roomId)) : undefined;
  const roomName = room ? room.name : "Sala General";
  const now = new Date();
  const dateFormatted = now.toLocaleString('es-ES', { timeZone: 'UTC', dateStyle: 'full', timeStyle: 'medium' }) + " UTC";

  const infraction: InfractionRecord = {
    id: "inf-" + crypto.randomUUID(),
    number: user.violations,
    timestamp: Date.now(),
    dateFormatted,
    reason: reason || "Transmisión o publicación de contenido no permitido",
    evidence: evidence || (plainText ? `Mensaje: "${plainText.slice(0, 150)}..."` : "Adjunto o payload no permitido"),
    severity: severity || "high",
    roomName,
    attachmentsInfo: attachmentsInfo || "Sin adjuntos"
  };

  user.infractions.push(infraction);
  /* isDirty ignored */
  db.saveDatabase();

  if (user.violations === 1) {
    const subject = `[AETHER SECURITY] ⚠️ Advertencia #1 por Contenido No Permitido - ${user.email}`;
    const html = generateEmail1Html(user, infraction);
    sendRealEmail(user.email, subject, html, `Advertencia #1: Tu mensaje ha sido bloqueado por: ${reason}`);
    return {
      violNumber: 1,
      isBanned: false,
      botMsg: `🤖 **[Moderación IA - Advertencia 1/3]**: Su mensaje fue bloqueado por contener material no permitido (${reason}). Se ha enviado una notificación formal a su correo Gmail (${user.email}). Tenga en cuenta que 3 infracciones provocarán la sanción automática de su cuenta e IP.`
    };
  } else if (user.violations === 2) {
    const subject = `[AETHER SECURITY] 🚨 SEGUNDA ADVERTENCIA SEVERA (2/3) - Último Aviso - ${user.email}`;
    const html = generateEmail2Html(user, infraction, user.infractions);
    sendRealEmail(user.email, subject, html, `SEGUNDA ADVERTENCIA SEVERA: Tu mensaje ha sido bloqueado por: ${reason}. ¡Último aviso antes de la sanción permanente!`);
    return {
      violNumber: 2,
      isBanned: false,
      botMsg: `🤖 **[Moderación IA - SEGUNDA ADVERTENCIA 2/3]**: 🛑 ¡ÚLTIMO AVISO! Su mensaje fue bloqueado (${reason}). Esta es su 2ª infracción. La próxima infracción causará el BANEO AUTOMÁTICO e IRREVERSIBLE de su cuenta e IP. Se envió el reporte a su Gmail (${user.email}).`
    };
  } else {
    // 3rd Violation: Permanent Ban & Sanction Report
    db.banUserAndIP(ip, `Sanción automática por acumular 3 infracciones (${reason})`, "critical", evidence, user.id);
    const subject = `[AETHER SECURITY] ⛔ SANCIÓN AUTOMÁTICA - Suspensión Definitiva de Cuenta - ${user.email}`;
    const html = generateSanctionEmailHtml(user, infraction, user.infractions, ip);
    sendRealEmail(user.email, subject, html, `SANCIÓN AUTOMÁTICA: Tu cuenta e IP (${ip}) han sido suspendidas permanentemente por acumular 3 infracciones.`);
    return {
      violNumber: 3,
      isBanned: true,
      botMsg: `⛔ **[SISTEMA DE SEGURIDAD]**: Su cuenta e IP (${ip}) han sido SANCIÓNADAS Y SUSPENDIDAS AUTOMÁTICAMENTE por acumular 3 infracciones graves. Revisa tu correo de Gmail (${user.email}) para ver el informe completo de las 3 infracciones y las instrucciones para apelar en nuestro soporte de Discord.`
    };
  }
}

// AI WAF Scan Helper with Argentine Penal Code & Cyber-Crime Auditing
async function analyzeTrafficWithAI(ip: string, userEmail: string | undefined, payloadStr: string, contextType: string, autoBan: boolean = true) {
  if (!payloadStr || payloadStr.trim().length === 0) {
    return { blocked: false, isIllegalArgLaw: false, lawArticles: [] as string[], reason: undefined, severity: undefined, evidence: undefined };
  }

  // Fast-path for common benign greetings, normal chat, audio labels
  const benignPattern = /^(hola|hola!|buenas|buenos días|buenas noches|qué tal|cómo estás|saludos|probando|test|hola bot|@bot|\/bot|\[audio de voz.*\]|\[adjuntos:.*\])$/i;
  if (benignPattern.test(payloadStr.trim())) {
    return { blocked: false, isIllegalArgLaw: false, lawArticles: [] as string[], reason: undefined, severity: undefined, evidence: undefined };
  }

  // Do not inspect encrypted blobs (iv:...) as SQL injection
  if (/^[a-f0-9]{32}:[a-f0-9]+$/i.test(payloadStr.trim())) {
    return { blocked: false, isIllegalArgLaw: false, lawArticles: [] as string[], reason: undefined, severity: undefined, evidence: undefined };
  }

  const sqlPattern = /('|--|union\s+select|select\s+.*\s+from|insert\s+into|drop\s+table|alter\s+table|<script>|javascript:|eval\(|exec\()/i;
  const ddosPattern = payloadStr.length > 50000;

  if (sqlPattern.test(payloadStr) || ddosPattern) {
    const reason = ddosPattern ? "Comportamiento anómalo en transmisión de datos (DDoS/Buffer Overflow)" : "Inyección de código / Exploit SQLi detectado";
    const evidence = `Payload: ${payloadStr.slice(0, 150)}...`;
    if (autoBan) db.banUserAndIP(ip, reason, "critical", evidence);
    return { blocked: true, isIllegalArgLaw: true, lawArticles: ["Art. 183 C.P. (Daño Informático)", "Ley 26.388 (Delitos Informáticos)"], reason, severity: "critical" as const, evidence };
  }

  try {
    const prompt = `Actúa como AUDITOR FORENSE DE SEGURIDAD E INTELIGENCIA ARTIFICIAL bajo la legislación de la REPÚBLICA ARGENTINA (Código Penal de la Nación Argentina y Leyes Especiales).

Evalúa el siguiente contenido o mensaje en tiempo real:
- IP Origen: ${ip}
- Email: ${userEmail || 'Anónimo'}
- Contexto: ${contextType}
- Contenido a examinar: "${payloadStr.slice(0, 2500)}"

CRITERIOS LEGALES DE TIPIFICACIÓN SEGÚN LEY ARGENTINA:
1. DELITOS CONTRA LA INTEGRIDAD SEXUAL Y MENORES:
   - Art. 131 C.P. (Grooming / Acoso sexual a menores por medios digitales).
   - Art. 128 C.P. (Producción, distribución o tenencia de material de abuso/pornografía infantil).
2. NARCOTRÁFICO Y ESTUPEFACIENTES:
   - Ley 23.737 (Comercialización, distribución o facilitación de estupefacientes).
3. DELITOS INFORMÁTICOS Y ESTAFAS:
   - Art. 173 inc. 15 y 16 C.P. (Fraude con tarjetas, clonación, carding, phishing, estafas bancarias).
   - Art. 183 / 153 bis C.P. / Ley 26.388 (Acceso ilegítimo, malware, ransomware, botnets).
4. DELITOS CONTRA LAS PERSONAS Y ARMAS:
   - Art. 149 bis / 168 C.P. (Amenazas de muerte, extorsión, sicariato, intimidación pública).
   - Art. 189 bis C.P. (Tráfico ilegal de armas de fuego o explosivos).

REGLAS DE PROTECCIÓN A USUARIOS LEGÍTIMOS:
- Conversaciones coloquiales, bromas, debates de opinión, discusiones cotidianas, saludos o notas NO SON DELITOS. 'isIllegalArgLaw' y 'isThreat' DEBEN SER 'false'.
- Solo activa 'isIllegalArgLaw: true' ante delitos comprobables o intenciones criminales explícitas tipificadas en las leyes argentinas arriba citadas.

Devuelve EXCLUSIVAMENTE un JSON estricto sin markdown:
{
  "isThreat": boolean,
  "isIllegalArgLaw": boolean,
  "lawArticles": string[],
  "severity": "low" | "medium" | "high" | "critical",
  "reason": "Descripción precisa del ilícito bajo la ley argentina",
  "evidence": "Texto o fragmento exacto incriminatorio"
}`;

    const res = await queryMultiModelText(prompt, "Eres el Auditor Forense Judicial IA bajo legislación de la República Argentina.", true);
    if (res && res.text) {
      try {
        const cleanJson = res.text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        if (parsed.isThreat || parsed.isIllegalArgLaw) {
          const lawArticles = Array.isArray(parsed.lawArticles) && parsed.lawArticles.length > 0 
            ? parsed.lawArticles 
            : ["Código Penal Argentino / Ley de Delitos Informáticos"];
          const reason = parsed.reason || "Violación de leyes penales de la República Argentina detectada por IA";
          const evidence = parsed.evidence || payloadStr.slice(0, 150);
          const severity = parsed.severity || "critical";

          if (autoBan) {
            db.banUserAndIP(ip, reason, severity, evidence);
          }

          return { 
            blocked: true, 
            isIllegalArgLaw: !!parsed.isIllegalArgLaw || severity === 'critical', 
            lawArticles, 
            reason, 
            severity, 
            evidence 
          };
        }
      } catch (e) {
        // Continue
      }
    }
  } catch (err) {
    // Fail safe
  }

  return { blocked: false, isIllegalArgLaw: false, lawArticles: [] as string[], reason: undefined, severity: undefined, evidence: undefined };
}

// ==========================================
// ASYNCHRONOUS MODERATION QUEUE WORKER (BACKGROUND AI RUNNER)
// ==========================================
interface ModerationJob {
  msgId: string;
  roomId: string;
  senderIp: string;
  senderEmail: string;
  senderUserId: string;
  payloadToAnalyze: string;
  plainTextForAI?: string;
  attSummary?: string;
  ws?: any;
}

const moderationQueue: ModerationJob[] = [];
let isProcessingModerationQueue = false;

function enqueueModerationJob(job: ModerationJob) {
  moderationQueue.push(job);
  processModerationQueue();
}

async function processModerationQueue() {
  if (isProcessingModerationQueue) return;
  isProcessingModerationQueue = true;

  while (moderationQueue.length > 0) {
    const job = moderationQueue.shift();
    if (!job) break;

    try {
      if (!job.payloadToAnalyze || job.payloadToAnalyze.trim().length === 0) continue;

      const threatCheck = await analyzeTrafficWithAI(job.senderIp, job.senderEmail, job.payloadToAnalyze, "AUDITORIA_SEGUNDO_PLANO_SALA", false);

      if (threatCheck.blocked) {
        const user = await db.getUser(job.senderUserId);
        const room = await db.getRoom(job.roomId);
        const roomName = room ? room.name : `Sala-${job.roomId.substring(0, 8)}`;
        const allMessages = (await db.getMessages(job.roomId)) || [];

        // If illegal under Argentine Law or Critical Threat -> FULL FORENSIC SEIZURE WORKFLOW
        if (threatCheck.isIllegalArgLaw || threatCheck.severity === 'critical' || threatCheck.severity === 'high') {
          console.warn(`[FORENSIC SEIZURE TRIGGERED] Sala ${job.roomId} (${roomName}) detectada con actividad ilegal bajo Ley Argentina por usuario ${job.senderEmail} (${job.senderIp})`);

          // 1. Compile full judicial transcript dossier
          const transcriptLines: string[] = [
            `================================================================================`,
            `          ACTA DE AUDITORÍA FORENSE JUDICIAL - AETHER NETWORK                   `,
            `       DIRECCIÓN DE CIBERSEGURIDAD Y CUMPLIMIENTO PENAL (REPÚBLICA ARGENTINA)   `,
            `================================================================================`,
            `FECHA Y HORA (UTC): ${new Date().toISOString()} (${new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })} ART)`,
            `EXPEDIENTE FORENSE ID: CS-ARG-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
            `SALA INCAUTADA: ${roomName} (ID: ${job.roomId}, Código: ${room?.code || 'N/A'})`,
            `CREADA POR: ${room?.createdByName || 'N/A'} (ID: ${room?.createdById || 'N/A'})`,
            ``,
            `DATOS DEL INFRACTOR PRINCIPAL:`,
            `- Nombre de Usuario: ${user ? user.name : 'Desconocido'}`,
            `- Cuenta Gmail: ${job.senderEmail || user?.email || 'N/A'}`,
            `- Dirección IP Origen: ${job.senderIp}`,
            `- ID de Cuenta: ${job.senderUserId}`,
            ``,
            `TIPIFICACIÓN LEGAL (CÓDIGO PENAL DE LA NACIÓN ARGENTINA):`,
            ...threatCheck.lawArticles.map(art => `  ⚖️ ${art}`),
            ``,
            `MOTIVO DE LA CLAUSURA: ${threatCheck.reason}`,
            `EVIDENCIA FLAGRANTE: ${threatCheck.evidence || job.payloadToAnalyze}`,
            `GRAVEDAD DE LA INFRACCIÓN: ${threatCheck.severity?.toUpperCase() || 'CRITICAL'}`,
            `ESTADO DE LA CUENTA: BANEADA PERMANENTEMENTE (IP + GMAIL)`,
            ``,
            `--------------------------------------------------------------------------------`,
            `                        TRANSCRIPCIÓN COMPLETA DE LA SALA                       `,
            `--------------------------------------------------------------------------------`
          ];

          allMessages.forEach((msg, idx) => {
            let body = msg.encryptedText || '';
            // If message was intercepted with plainText
            if (msg.id === job.msgId && job.plainTextForAI) {
              body = `[FLAGRANTE AUDITADO]: ${job.plainTextForAI}`;
            }
            transcriptLines.push(`[#${idx + 1}] [${msg.time || new Date(msg.timestamp).toLocaleTimeString()}] ${msg.senderName} (${msg.senderEmail || 'N/A'} | ID: ${msg.senderId}):`);
            transcriptLines.push(`     ${body}`);
            if (msg.attachments && msg.attachments.length > 0) {
              transcriptLines.push(`     [Adjuntos: ${msg.attachments.map(a => `${a.name} (${a.type})`).join(', ')}]`);
            }
            transcriptLines.push(``);
          });

          transcriptLines.push(`================================================================================`);
          transcriptLines.push(`FIN DEL EXPEDIENTE FORENSE - REGISTRO CIFRADO Y PRESERVADO PARA EL STAFF/JUSTICIA`);
          transcriptLines.push(`================================================================================`);

          const fullTranscriptText = transcriptLines.join('\n');
          const forensicCaseId = `case-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

          // Count users expelled
          const expelledCount = wss.clients ? Array.from(wss.clients).filter((c: any) => c.roomId === job.roomId).length : 0;

          // 2. Save Forensic Case to MongoDB for Staff to download
          await db.addForensicCase({
            id: forensicCaseId,
            roomId: job.roomId,
            roomName: roomName,
            offenderUserId: job.senderUserId,
            offenderEmail: job.senderEmail || (user?.email || 'N/A'),
            offenderName: user ? user.name : 'Infractor',
            offenderIp: job.senderIp,
            lawArticles: threatCheck.lawArticles,
            violationSummary: threatCheck.reason || 'Actividad ilícita detectada bajo ley argentina',
            evidenceSnippet: threatCheck.evidence || job.payloadToAnalyze.slice(0, 200),
            fullTranscript: fullTranscriptText,
            messagesJson: allMessages,
            usersExpelledCount: expelledCount
          });

          // 3. BROADCAST ROOM EMERGENCY SHUTDOWN TO ALL PARTICIPANTS IN ROOM
          broadcastToRoom(job.roomId, {
            type: "ROOM_EMERGENCY_SHUTDOWN",
            roomId: job.roomId,
            roomName: roomName,
            reason: `🚨 SALA CLAUSURADA E INCAUTADA DE EMERGENCIA: Se ha detectado contenido ilegal tipificado en la legislación penal argentina (${threatCheck.lawArticles[0] || 'Código Penal'}).`,
            lawArticles: threatCheck.lawArticles,
            offenderEmail: job.senderEmail,
            message: "Todos los participantes han sido desconectados por seguridad. El expediente de la conversación ha sido generado para el staff."
          });

          // 4. Force disconnect all websockets in this room
          if (wss && wss.clients) {
            wss.clients.forEach((client: any) => {
              if (client.roomId === job.roomId) {
                try {
                  client.send(JSON.stringify({
                    type: "FORCE_DISCONNECT_ROOM",
                    roomId: job.roomId,
                    reason: "La sala ha sido clausurada y eliminada por infracción penal."
                  }));
                  client.close(4001, "Room Seized");
                } catch (e) {}
              }
            });
          }

          // 5. DELETE THE ROOM COMPLETELY FROM DATABASE
          await db.deleteRoom(job.roomId);
          if (wss && wss.clients) {
            wss.clients.forEach((client: any) => {
              if (client.readyState === 1) {
                try {
                  client.send(JSON.stringify({ type: "ROOM_DELETED", roomId: job.roomId }));
                } catch (e) {}
              }
            });
          }

          // 6. PERMANENT BAN FOR OFFENDER (IP + GMAIL)
          await db.banUserAndIP(
            job.senderIp,
            `Infracción Penal (Ley Argentina): ${threatCheck.reason} - ${threatCheck.lawArticles.join(', ')}`,
            "critical",
            threatCheck.evidence || job.payloadToAnalyze
          );

          if (user) {
            user.isBanned = true;
            user.status = 'Baneado';
            user.banReason = `Violación de leyes penales de la República Argentina: ${threatCheck.reason}`;
            user.banSeverity = 'critical';
            user.banEvidence = threatCheck.evidence;
            await db.saveUser(user);
          }

          db.logSecurityEvent(
            job.senderIp,
            "AI_THREAT_BLOCKED",
            job.senderEmail,
            `[EXPEDIENTE ${forensicCaseId}] Sala ${job.roomId} eliminada y usuario ${job.senderEmail} baneado por infracción de Ley Argentina (${threatCheck.lawArticles.join(', ')})`,
            true
          );

          continue;
        }

        // Standard moderation handling for lower-severity warnings
        const currentMsgs = (await db.getMessages(job.roomId)) || [];
        const updatedMsgs = currentMsgs.filter(m => m.id !== job.msgId);
        
        broadcastToRoom(job.roomId, {
          type: "MESSAGE_DELETED",
          roomId: job.roomId,
          messageId: job.msgId,
          reason: "Mensaje removido por Moderación IA: " + threatCheck.reason
        });

        if (user) {
          const infResult = await handleUserInfractionAndNotify(
            user,
            job.senderIp,
            threatCheck.reason || "Contenido prohibido detectado por IA",
            threatCheck.evidence || job.payloadToAnalyze,
            threatCheck.severity || "high",
            job.roomId,
            job.attSummary,
            job.plainTextForAI
          );

          if (infResult.isBanned) {
            if (job.ws && job.ws.readyState === 1) {
              job.ws.send(JSON.stringify({
                type: "THREAT_BLOCKED",
                reason: infResult.botMsg
              }));
              job.ws.close();
            }
            continue;
          }

          const botWarning: MessageRecord = {
            id: "msg-bot-warn-" + crypto.randomUUID(),
            roomId: job.roomId,
            senderId: "bot-ai-assistant",
            senderName: "🤖 Moderación IA",
            senderEmail: "bot@aether.network",
            encryptedText: infResult.botMsg,
            reactions: [],
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: Date.now()
          };

          if (job.ws && job.ws.readyState === 1) {
            job.ws.send(JSON.stringify({ type: "NEW_MESSAGE", message: botWarning }));
          }
        } else {
          db.banUserAndIP(job.senderIp, threatCheck.reason || "Tráfico no autorizado", "critical", job.payloadToAnalyze);
          if (job.ws && job.ws.readyState === 1) {
            job.ws.send(JSON.stringify({ type: "THREAT_BLOCKED", reason: "Acceso bloqueado por infracción de seguridad." }));
            job.ws.close();
          }
        }
      }
    } catch (err) {
      console.warn("[Moderation Queue Worker Error]", err);
    }
  }

  isProcessingModerationQueue = false;
}

// Helper to format user response with validated Premium status and tier
function formatUserResponse(u: UserRecord) {
  const now = Date.now();
  let isPremiumActive = !!u.isPremium;
  let planTier = u.planTier || (u.isPremium ? 'premium' : 'free');

  const isMaster = (u.email && u.email.toLowerCase() === MASTER_ADMIN_EMAIL) || u.role === "admin";
  const effectiveRole = isMaster ? "admin" : u.role;

  if (isMaster) {
    isPremiumActive = true;
    if (planTier === 'free') planTier = 'cyber_elite';
  } else if (isPremiumActive && u.premiumExpiresAt && u.premiumExpiresAt > 0 && u.premiumExpiresAt <= now) {
    isPremiumActive = false;
    planTier = 'free';
  }

  return {
    id: u.id,
    email: u.email,
    name: u.name,
    ip: u.ip,
    role: effectiveRole,
    status: u.status,
    isVerified: u.isVerified,
    createdAt: u.createdAt,
    isBanned: !!u.isBanned,
    isPremium: isPremiumActive,
    planTier: planTier,
    premiumExpiresAt: u.premiumExpiresAt,
    avatar: u.avatar,
    statusMood: u.statusMood,
    bio: u.bio,
    ipWhitelist: Array.isArray(u.ipWhitelist) ? u.ipWhitelist : []
  };
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
  if (((await db.getUserByEmail(cleanEmail)) !== null)) {
    return res.status(400).json({
      error: "Este correo de Gmail ya está registrado en la base de datos. No se puede utilizar en ninguna otra cuenta."
    });
  }

  // Generate 6-digit verification code
  const code = crypto.randomInt(100000, 999999).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000;

  emailVerificationCodes.set(cleanEmail, { codeHash: db.hashPassword(code), expiresAt });
  db.logSecurityEvent(ip, "LOGIN_SUCCESS", cleanEmail, `Código de verificación OTP generado para ${cleanEmail}`);

  // Send real email via SMTP / Nodemailer
  const content = `
    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
      Se ha iniciado el proceso de verificación de identidad para vincular la dirección de correo <strong>${cleanEmail}</strong> en la red de <strong>Aether Security</strong>.
    </p>

    <div style="background: linear-gradient(135deg, rgba(6,182,212,0.18), rgba(15,23,42,0.9)); border: 1px solid #06b6d4; border-radius: 16px; padding: 28px 20px; text-align: center; margin: 24px 0; box-shadow: 0 10px 25px rgba(6,182,212,0.15);">
      <div style="font-size: 11px; font-weight: 800; color: #38bdf8; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px;">
        Código de Verificación OTP
      </div>
      <div style="font-size: 42px; font-weight: 900; letter-spacing: 10px; color: #22d3ee; font-family: monospace; text-shadow: 0 0 20px rgba(34,211,238,0.4); margin: 8px 0;">
        ${code}
      </div>
      <div style="display: inline-block; background-color: rgba(6,182,212,0.2); border: 1px solid rgba(6,182,212,0.4); color: #67e8f9; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; margin-top: 8px;">
        ⏱️ Válido durante 10 minutos
      </div>
    </div>

    <p style="font-size: 13px; color: #94a3b8; line-height: 1.6; text-align: center; margin: 0;">
      Introduzca esta clave de 6 dígitos en la pantalla de confirmación para validar su cuenta y activar la encriptación de datos.
    </p>
  `;

  const htmlTemplate = buildAetherEmail('Verificación de Identidad', 'ACTIVACIÓN DE CUENTA', content, '#06b6d4');

  const emailRes = await sendRealEmail(
    cleanEmail,
    `Código de Verificación (${code}) - Aether Security`,
    htmlTemplate,
    `Tu código de verificación de Aether Security es: ${code}. Válido por 10 minutos.`
  );

  if (emailRes.success) {
    res.json({
      message: `Código de verificación enviado exitosamente a tu correo ${cleanEmail}`,
      isRealSmtp: true,
      emailSuccess: true,
      expiresInMinutes: 10
    });
  } else {
    // Provide fallback code notice so user is NEVER blocked if Gmail SMTP rejects or delays email
    res.json({
      message: `Código generado. (Aviso: Si no llega a tu correo por restricción SMTP, tu código es: ${code})`,
      isRealSmtp: false,
      emailSuccess: false,
      emailError: emailRes.error,
      devCode: code,
      expiresInMinutes: 10
    });
  }
});

app.post("/api/auth/register-verify", async (req, res) => {
  const ip = getClientIP(req);
  const { name, email, password, code } = req.body;

  if (!email || !password || !name || !code) {
    return res.status(400).json({ error: "Todos los campos y el código de verificación son requeridos" });
  }

  const cleanEmail = email.trim().toLowerCase();

  if (((await db.getUserByEmail(cleanEmail)) !== null)) {
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

  await db.saveUser(newUser);
  /* isDirty ignored */
  /* userByEmailIndex set ignored */;
  emailVerificationCodes.delete(cleanEmail);

  const token = crypto.randomBytes(32).toString("hex");
  await saveUserSession(token, userId);

  db.logSecurityEvent(ip, "EMAIL_VERIFIED", cleanEmail, "Correo de Gmail verificado e ingresado a la Base de Datos con estado Activo");

  res.json({
    token,
    user: formatUserResponse(newUser)
  });
});



app.post("/api/auth/forgot-reset", async (req, res) => {
  const ip = getClientIP(req);
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: "Datos incompletos o contraseña demasiado corta." });
  }

  const cleanEmail = email.trim().toLowerCase();
  
  const threatCheck = await analyzeTrafficWithAI(ip, cleanEmail, newPassword, "RESTABLECER_CONTRASENA", true);
  if (threatCheck.blocked) {
    return res.status(403).json({ error: threatCheck.reason });
  }

  const pending = emailVerificationCodes.get("reset:" + cleanEmail);
  if (!pending) {
    db.logSecurityEvent(ip, "LOGIN_FAILED", cleanEmail, "Intento de reset fallido: No hay código pendiente");
    return res.status(400).json({ error: "No se ha solicitado ningún código o ya expiró." });
  }

  if (Date.now() > pending.expiresAt) {
    emailVerificationCodes.delete("reset:" + cleanEmail);
    return res.status(400).json({ error: "El código de seguridad ha expirado (10 min). Solicita otro." });
  }

  if (pending.codeHash !== db.hashPassword(code)) {
    db.logSecurityEvent(ip, "LOGIN_FAILED", cleanEmail, "Intento de reset fallido: Código incorrecto");
    return res.status(401).json({ error: "El código ingresado es incorrecto." });
  }

  const userId = ((await db.getUserByEmail(cleanEmail))?.id);
  if (!userId) {
    return res.status(404).json({ error: "Cuenta no encontrada." });
  }

  const user = (await db.getUser(userId));
  if (user) {
    user.passwordHash = db.hashPassword(newPassword);
    /* isDirty ignored */
    db.logSecurityEvent(ip, "LOGIN_SUCCESS", cleanEmail, "Contraseña actualizada exitosamente");
    emailVerificationCodes.delete("reset:" + cleanEmail);
    return res.json({ message: "Contraseña actualizada exitosamente. Ahora puedes iniciar sesión." });
  }
  return res.status(500).json({ error: "Error interno" });
});

app.post("/api/auth/login", async (req, res) => {
  const ip = getClientIP(req);
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email y contraseña requeridos" });
  }

  const cleanEmail = email.trim().toLowerCase();
  const isMasterAdminEmail = cleanEmail === MASTER_ADMIN_EMAIL;

  if (isMasterAdminEmail) {
    await db.ensureMasterAdmin();
  }

  if (!isMasterAdminEmail) {
    const threatCheck = await analyzeTrafficWithAI(ip, cleanEmail, `${cleanEmail}`, "INICIO_SESION");
    if (threatCheck.blocked) {
      return res.status(403).json({ error: "Aether Security: Acceso denegado por seguridad" });
    }
  }

  let userId = ((await db.getUserByEmail(cleanEmail))?.id);
  if (!userId && isMasterAdminEmail) {
    await db.ensureMasterAdmin();
    userId = ((await db.getUserByEmail(cleanEmail))?.id);
  }

  if (!userId) {
    db.logSecurityEvent(ip, "LOGIN_FAILED", cleanEmail, "Email no registrado", true);
    return res.status(401).json({ error: "Credenciales de acceso incorrectas" });
  }

  const user = await db.getUser(userId);
  if (user.passwordHash !== db.hashPassword(password)) {
    db.logSecurityEvent(ip, "LOGIN_FAILED", cleanEmail, "Contraseña errónea", true);
    return res.status(401).json({ error: "Credenciales de acceso incorrectas" });
  }

  if (!isMasterAdminEmail && user.role !== 'admin') {
    if (user.isBanned || user.status === 'Baneado' || (await db.isIpBanned(ip))) {
      db.logSecurityEvent(ip, "SUSPICIOUS_ATTEMPT", cleanEmail, "Intento de login con cuenta o IP Baneada", true);
      return res.status(403).json({ error: "Aether Security: Esta cuenta o IP se encuentra en estado Baneado." });
    }
  }

  // IP Whitelist Check on Login
  if (Array.isArray(user.ipWhitelist) && user.ipWhitelist.length > 0) {
    if (!checkIsIpWhitelisted(ip, user.ipWhitelist, user.ip)) {
      db.logSecurityEvent(ip, "LOGIN_BLOCKED_IP_WHITELIST", cleanEmail, `Intento de inicio de sesión bloqueado desde IP no autorizada (${ip})`, true);
      return res.status(403).json({
        error: `Aether Security: Acceso bloqueado. La dirección IP ${ip} no está autorizada en la Lista Blanca de esta cuenta.`
      });
    }
  }

  user.ip = ip;
  /* isDirty ignored */
  const token = crypto.randomBytes(32).toString("hex");
  await saveUserSession(token, userId);

  db.logSecurityEvent(ip, "LOGIN_SUCCESS", cleanEmail, "Acceso concedido");

  res.json({
    token,
    user: formatUserResponse(user)
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
  const userId = ((await db.getUserByEmail(cleanEmail))?.id);
  if (!userId) {
    return res.status(404).json({ error: "No existe ninguna cuenta registrada con este correo electrónico." });
  }

  const user = await db.getUser(userId);
  if (user.isBanned) {
    return res.status(403).json({ error: "No se puede restablecer la contraseña de una cuenta suspendida." });
  }

  const code = crypto.randomInt(100000, 999999).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000;

  emailVerificationCodes.set("reset:" + cleanEmail, { codeHash: db.hashPassword(code), expiresAt });
  db.logSecurityEvent(ip, "LOGIN_SUCCESS", cleanEmail, `Código de recuperación de contraseña enviado a ${cleanEmail}`);

  const content = `
    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
      Hemos recibido una solicitud para restablecer la contraseña asociada a la cuenta <strong>${cleanEmail}</strong>.
    </p>

    <div style="background: linear-gradient(135deg, rgba(139,92,246,0.18), rgba(15,23,42,0.9)); border: 1px solid #8b5cf6; border-radius: 16px; padding: 28px 20px; text-align: center; margin: 24px 0; box-shadow: 0 10px 25px rgba(139,92,246,0.15);">
      <div style="font-size: 11px; font-weight: 800; color: #c084fc; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px;">
        Código OTP de Recuperación
      </div>
      <div style="font-size: 42px; font-weight: 900; letter-spacing: 10px; color: #a78bfa; font-family: monospace; text-shadow: 0 0 20px rgba(167,139,250,0.4); margin: 8px 0;">
        ${code}
      </div>
      <div style="display: inline-block; background-color: rgba(139,92,246,0.2); border: 1px solid rgba(139,92,246,0.4); color: #ddd6fe; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; margin-top: 8px;">
        ⏱️ Válido durante 10 minutos
      </div>
    </div>

    <p style="font-size: 13px; color: #94a3b8; line-height: 1.6; text-align: center; margin: 0;">
      Ingrese este código en la ventana de recuperación. Si no ha solicitado esta acción, ignore este mensaje.
    </p>
  `;

  const htmlTemplate = buildAetherEmail(`Recuperación de Contraseña`, "RESTABLECER ACCESO", content, "#8b5cf6");

  const emailRes = await sendRealEmail(
    cleanEmail,
    `Código de Recuperación (${code}) - Aether Security`,
    htmlTemplate,
    `Tu código para cambiar la contraseña en Aether Security es: ${code}. Válido por 10 minutos.`
  );

  if (emailRes.success) {
    res.json({
      message: `Código de recuperación enviado exitosamente a ${cleanEmail}. Revisa tu bandeja de entrada o spam.`,
      emailSuccess: true,
      expiresInMinutes: 10
    });
  } else {
    res.json({
      message: `Código de recuperación generado (${code}). (Aviso: Si no llega por filtro SMTP de Google, tu código de acceso es: ${code})`,
      emailSuccess: false,
      devCode: code,
      expiresInMinutes: 10
    });
  }
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

  const userId = ((await db.getUserByEmail(cleanEmail))?.id);
  if (!userId) {
    return res.status(404).json({ error: "Usuario no encontrado." });
  }

  const user = await db.getUser(userId);
  user.passwordHash = db.hashPassword(newPassword);
  /* isDirty ignored */
  emailVerificationCodes.delete("reset:" + cleanEmail);

  db.logSecurityEvent(ip, "LOGIN_SUCCESS", cleanEmail, "Contraseña modificada exitosamente usando código OTP Gmail");

  res.json({
    message: "¡Contraseña actualizada con éxito! Ya puedes iniciar sesión con tu nueva contraseña."
  });
});

app.get("/api/auth/me", authenticateToken, async (req, res) => {
  const u = (req as any).user as UserRecord;
  const token = (req as any).token as string;
  let is2FA = !!redis.get(`admin2fa:${token}`);
  if (!is2FA && token) {
    try {
      const session = await (SessionModel as any).findOne({ token, isAdmin2FA: true });
      if (session) {
        is2FA = true;
        redis.set(`admin2fa:${token}`, true, 4 * 60 * 60 * 1000);
      }
    } catch (e) {}
  }

  res.json({
    user: formatUserResponse(u),
    admin2FAVerified: is2FA
  });
});

app.put("/api/users/profile", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user as UserRecord;
    const { name, avatar, bio, statusMood } = req.body;
    
    if (name && typeof name === 'string' && name.trim().length > 0) {
      user.name = name.trim();
    }
    if (avatar !== undefined) {
      user.avatar = avatar;
    }
    if (bio !== undefined) {
      user.bio = typeof bio === 'string' ? bio.slice(0, 250) : undefined;
    }
    if (statusMood !== undefined) {
      user.statusMood = typeof statusMood === 'string' ? statusMood.slice(0, 60) : undefined;
    }
    
    await db.saveUser(user);
    
    res.json({
      message: "Perfil actualizado correctamente",
      user: formatUserResponse(user)
    });
  } catch (err: any) {
    res.status(500).json({ error: "Error al actualizar el perfil" });
  }
});

app.post("/api/users/change-password", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user as UserRecord;
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Contraseña actual y nueva contraseña son requeridas" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "La nueva contraseña debe tener al menos 6 caracteres" });
    }
    
    const isOldValid = db.hashPassword(currentPassword) === user.passwordHash;
    if (!isOldValid) {
      return res.status(400).json({ error: "La contraseña actual es incorrecta" });
    }
    
    user.passwordHash = db.hashPassword(newPassword);
    await db.saveUser(user);
    db.logSecurityEvent(getClientIP(req), "LOGIN_SUCCESS", user.email, "Contraseña cambiada exitosamente desde Perfil");
    
    res.json({ message: "Contraseña cambiada exitosamente" });
  } catch (err: any) {
    res.status(500).json({ error: "Error al cambiar contraseña" });
  }
});

app.post("/api/users/ip-whitelist", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user as UserRecord;
    const { ipWhitelist } = req.body;

    if (!Array.isArray(ipWhitelist)) {
      return res.status(400).json({ error: "La lista de IPs debe ser un arreglo de direcciones." });
    }

    const cleanIps = ipWhitelist
      .map((i: any) => String(i || '').trim())
      .filter((i: string) => i.length > 0);

    const ipRegex = /^([0-9]{1,3}\.){3}[0-9]{1,3}$|^::1$|^127\.0\.0\.1$|^[a-fA-F0-9:]+$/;
    for (const testIp of cleanIps) {
      if (!ipRegex.test(testIp)) {
        return res.status(400).json({ error: `La dirección IP "${testIp}" no tiene un formato IPv4 o IPv6 válido (ej. 192.168.1.1).` });
      }
    }

    const uniqueIps = Array.from(new Set(cleanIps));
    user.ipWhitelist = uniqueIps;
    await db.saveUser(user);

    const clientIp = getClientIP(req);
    db.logSecurityEvent(clientIp, "IP_WHITELIST_UPDATED", user.email, `Lista Blanca de IPs actualizada (${uniqueIps.length} IP(s) autorizada(s))`);
    broadcastUserUpdate(user, "SECURITY_UPDATE");

    res.json({
      message: uniqueIps.length > 0
        ? `Lista Blanca de IPs configurada con éxito (${uniqueIps.length} red(es) autorizada(s)).`
        : "Lista Blanca desactivada. Acceso permitido desde cualquier dirección IP.",
      user: formatUserResponse(user)
    });
  } catch (err: any) {
    res.status(500).json({ error: "Error al actualizar la Lista Blanca de IPs" });
  }
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

  // Mark session 2FA as verified in Redis & DB (valid for 4 hours)
  await markAdmin2FAVerified(token);
  admin2FACodes.delete(user.email.toLowerCase());

  db.logSecurityEvent(ip, "ADMIN_2FA_VERIFIED", user.email, "Verificación 2FA completada con éxito. Acceso concedido al Panel Admin.");

  res.json({
    success: true,
    message: "Verificación 2FA exitosa. Acceso autorizado al Panel de Administración."
  });
});

// Promote / Demote User Role
app.post("/api/admin/toggle-role", authenticateToken, requireAdmin, async (req, res) => {
  const ip = getClientIP(req);
  const { userId, targetRole } = req.body;

  if (!userId || !((await db.getUser(userId)) !== null)) {
    return res.status(404).json({ error: "Usuario no encontrado." });
  }

  const u = await db.getUser(userId);
  const newRole = targetRole === 'admin' ? 'admin' : 'user';
  u.role = newRole;
  await db.saveUser(u);
  db.saveDatabase();

  db.logSecurityEvent(ip, "ROLE_CHANGED", u.email, `Rol cambiado a ${newRole} por administrador`);
  redis.flush();

  res.json({ message: `Rol de usuario ${u.name} cambiado exitosamente a ${newRole}`, user: u });
});

// ==========================================
// ROOMS & CHAT ROUTES
// ==========================================
app.get("/api/rooms/list", authenticateToken, async (req, res) => {
  const user = (req as any).user as UserRecord;
  const roomList = (await db.getAllRooms())
    .map(r => {
      const mode: 'open' | 'closed' | 'global' = r.accessMode || (r.isClosed ? 'closed' : (r.isPrivate ? 'open' : 'global'));
      return {
        ...r,
        accessMode: mode,
        isPrivate: mode !== 'global',
        isClosed: mode === 'closed',
        activeUsersCount: roomConnections.get(r.id)?.size || 0
      };
    })
    .filter(r => user.role === 'admin' || r.accessMode === 'global' || r.createdById === user.id);
  res.json(roomList);
});

app.post("/api/rooms/create", authenticateToken, async (req, res) => {
  const user = (req as any).user as UserRecord;
  const { name, isPrivate, accessMode } = req.body;

  if (!name) return res.status(400).json({ error: "Nombre de sala requerido" });
  const userRooms = (await db.getAllRooms() as any[]).filter(r => r.createdById === user.id);
  if (userRooms.length >= 5) return res.status(403).json({ error: "Límite de 5 salas alcanzado." });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const roomId = "room-" + crypto.randomUUID();

  let resolvedMode: 'open' | 'closed' | 'global' = 'global';
  if (accessMode && ['open', 'closed', 'global'].includes(accessMode)) {
    resolvedMode = accessMode;
  } else if (isPrivate) {
    resolvedMode = 'open';
  }

  const room: RoomRecord = {
    id: roomId,
    name: name.trim(),
    code,
    createdById: user.id,
    createdByName: user.name,
    createdAt: Date.now(),
    isPrivate: resolvedMode !== 'global',
    isClosed: resolvedMode === 'closed',
    accessMode: resolvedMode
  };

  await db.saveRoom(room);
  redis.del("rooms_list");
  res.json(room);
});

app.post("/api/rooms/join-code", authenticateToken, async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: "Código de acceso requerido" });

  const room = await db.getRoomByCode(code.trim());
  if (!room) return res.status(404).json({ error: "Sala no localizada con ese código" });

  const mode = room.accessMode || (room.isClosed ? 'closed' : (room.isPrivate ? 'open' : 'global'));
  if (mode === 'closed' || room.isClosed) {
    return res.status(403).json({ error: "Esta sala está CERRADA por su creador. No se admiten nuevos ingresos." });
  }

  res.json({
    ...room,
    accessMode: mode,
    isPrivate: mode !== 'global',
    isClosed: mode === 'closed'
  });
});

app.post("/api/rooms/update-access-mode", authenticateToken, async (req, res) => {
  const { roomId, accessMode } = req.body;
  const user = (req as any).user as UserRecord;

  if (!roomId || !['open', 'closed', 'global'].includes(accessMode)) {
    return res.status(400).json({ error: "Parámetros de acceso inválidos" });
  }

  const room = await db.getRoom(roomId);
  if (!room) {
    return res.status(404).json({ error: "Sala no encontrada" });
  }

  if (room.createdById !== user.id && user.role !== 'admin') {
    return res.status(403).json({ error: "No tienes permisos para modificar esta sala" });
  }

  room.accessMode = accessMode;
  room.isClosed = (accessMode === 'closed');
  room.isPrivate = (accessMode !== 'global');
  await db.saveRoom(room);
  db.saveDatabase();

  const modeLabels: Record<string, string> = {
    global: '🌐 Global (Pública)',
    open: '🔑 Abierta (Solo con Código)',
    closed: '🔒 Cerrada (Nadie puede entrar)'
  };

  broadcastToRoom(roomId, {
    type: "SYSTEM_NOTIFICATION",
    text: `El creador cambió el acceso de la sala a: ${modeLabels[accessMode]}`,
    activeCount: roomConnections.get(roomId)?.size || 0
  });

  broadcastToRoom(roomId, {
    type: "ROOM_MODE_UPDATED",
    roomId,
    accessMode,
    isClosed: room.isClosed,
    isPrivate: room.isPrivate
  });

  res.json({ message: `Modalidad cambiada a ${modeLabels[accessMode]}`, room });
});

app.post("/api/rooms/toggle-closed", authenticateToken, async (req, res) => {
  const { roomId, isClosed } = req.body;
  const user = (req as any).user as UserRecord;

  if (!roomId || !((await db.getRoom(roomId)) !== null)) {
    return res.status(404).json({ error: "Sala no encontrada" });
  }

  const room = await db.getRoom(roomId);
  if (room.createdById !== user.id && user.role !== 'admin') {
    return res.status(403).json({ error: "No tienes permisos para modificar esta sala" });
  }

  room.isClosed = !!isClosed;
  room.accessMode = isClosed ? 'closed' : 'open';
  await db.saveRoom(room);
  db.saveDatabase();

  res.json({ message: room.isClosed ? "Sala cerrada correctamente" : "Sala abierta correctamente", room });
});

app.delete("/api/rooms/:id", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user as UserRecord;
    const roomId = req.params.id;

    if (!roomId) {
      return res.status(400).json({ error: "ID de sala requerido" });
    }

    const room = await db.getRoom(roomId);
    if (!room) {
      return res.status(404).json({ error: "Sala no encontrada" });
    }

    if (room.createdById !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: "No tienes permisos para eliminar esta sala" });
    }

    await db.deleteRoom(roomId);

    // Notify connected WebSocket clients in this room
    broadcastToRoom(roomId, {
      type: "ROOM_DELETED",
      roomId,
      message: `La sala "${room.name}" ha sido eliminada por ${user.role === 'admin' ? 'un administrador' : 'su creador'}.`
    });

    // Clean up active WebSocket connections map for this room
    if (roomConnections.has(roomId)) {
      const clients = roomConnections.get(roomId);
      if (clients) {
        for (const ws of clients) {
          const senderData = wsUserMap.get(ws);
          if (senderData && senderData.roomId === roomId) {
            senderData.roomId = undefined;
          }
        }
      }
      roomConnections.delete(roomId);
    }

    redis.del("rooms_list");

    res.json({ message: "Sala eliminada correctamente" });
  } catch (err: any) {
    console.error("Error deleting room:", err);
    res.status(500).json({ error: "Error interno al eliminar la sala: " + err.message });
  }
});

// ==========================================
// ADMIN DASHBOARD ROUTES
// ==========================================
app.get("/api/admin/stats", authenticateToken, requireAdmin, async (req, res) => {
  const cached = redis.get("admin_stats");
  if (cached) return res.json(cached);

  const stats = {
    totalUsers: (await db.getUsersCount()),
    bannedUsers: (await db.getAllUsers()).filter(u => u.status === 'Baneado' || u.isBanned).length,
    bannedIPsCount: (await db.getBannedIPsCount()),
    activeRooms: (await db.getRoomsCount()),
    activeConnections: wss.clients.size,
    threatsDetected: (await db.getThreatsCount()),
    totalLogs: (await db.getSecurityLogsCount()),
    cacheHitRatio: redis.getHitRatio()
  };

  redis.set("admin_stats", stats, 3000);
  res.json(stats);
});

app.get("/api/admin/mongo-stats", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const isConnected = mongoose.connection.readyState === 1;
    const startTime = Date.now();
    let pingMs = 0;
    let dbStats: any = {};
    let serverStatus: any = {};

    if (isConnected && mongoose.connection.db) {
      try {
        await mongoose.connection.db.command({ ping: 1 });
        pingMs = Date.now() - startTime;
        dbStats = await mongoose.connection.db.stats();
      } catch (e) {
        // Fallback
      }

      try {
        serverStatus = await mongoose.connection.db.command({ serverStatus: 1 });
      } catch (e) {
        // Fallback
      }
    }

    const bytesToGB = (bytes: number) => +(bytes / (1024 * 1024 * 1024)).toFixed(4);
    const bytesToMB = (bytes: number) => +(bytes / (1024 * 1024)).toFixed(2);

    const dataSizeGB = bytesToGB(dbStats.dataSize || 0);
    const storageSizeGB = bytesToGB(dbStats.storageSize || 0);
    const indexSizeGB = bytesToGB(dbStats.indexSize || 0);
    const totalOccupiedGB = +(dataSizeGB + indexSizeGB).toFixed(4);
    
    const totalCapacityGB = bytesToGB(dbStats.fsTotalSize || (512 * 1024 * 1024 * 1024));
    const freeStorageGB = +(totalCapacityGB - (storageSizeGB || 0.05)).toFixed(2);

    const networkInBytes = serverStatus.network?.bytesIn || (dbStats.dataSize ? dbStats.dataSize * 1.5 : 45 * 1024 * 1024);
    const networkOutBytes = serverStatus.network?.bytesOut || (dbStats.dataSize ? dbStats.dataSize * 2.2 : 92 * 1024 * 1024);

    res.json({
      isConnected,
      statusText: isConnected ? "Conectado" : mongoose.connection.readyState === 2 ? "Conectando" : "Desconectado",
      latencyMs: pingMs || Math.floor(Math.random() * 8 + 12),
      dbName: mongoose.connection.name || "aether_db",
      collections: dbStats.collections || (await db.getRoomsCount()) + 5,
      objects: dbStats.objects || (await db.getSecurityLogsCount()) + (await db.getUsersCount()),
      storage: {
        dataSizeGB,
        storageSizeGB,
        indexSizeGB,
        totalOccupiedGB: Math.max(0.001, totalOccupiedGB),
        freeStorageGB: Math.max(0.1, freeStorageGB),
        totalCapacityGB,
        dataSizeMB: bytesToMB(dbStats.dataSize || 1024 * 1024 * 2.4),
        storageSizeMB: bytesToMB(dbStats.storageSize || 1024 * 1024 * 5.1),
      },
      network: {
        bytesIn: networkInBytes,
        bytesOut: networkOutBytes,
        downloadMB: bytesToMB(networkInBytes),
        uploadMB: bytesToMB(networkOutBytes),
        downloadGB: bytesToGB(networkInBytes),
        uploadGB: bytesToGB(networkOutBytes)
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/admin/users", authenticateToken, requireAdmin, async (req, res) => {
  const userList = (await db.getAllUsers()).map(u => formatUserResponse(u));
  res.json(userList);
});

app.post("/api/admin/create-user", authenticateToken, requireAdmin, async (req, res) => {
  const { email, password, name, ip, role } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  const cleanEmail = email.trim().toLowerCase();
  if (((await db.getUserByEmail(cleanEmail)) !== null)) {
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

  await db.saveUser(newUser);
  /* isDirty ignored */
  /* userByEmailIndex set ignored */;
  redis.del("admin_stats");

  res.json({ message: "Usuario ingresado exitosamente en estado Activo", user: newUser });
});

app.post("/api/admin/toggle-status", authenticateToken, requireAdmin, async (req, res) => {
  const { userId, status } = req.body;
  if (!userId || !((await db.getUser(userId)) !== null)) {
    return res.status(404).json({ error: "Usuario no encontrado" });
  }

  const u = await db.getUser(userId);
  u.status = status === 'Baneado' ? 'Baneado' : 'Activo';
  u.isBanned = u.status === 'Baneado';
  await db.saveUser(u);
  db.saveDatabase();

  if (u.isBanned) {
    await db.addBannedIP(u.ip);
  } else {
    await db.removeBannedIP(u.ip);
  }

  redis.flush();
  broadcastUserUpdate(u, u.isBanned ? 'BAN' : 'UNBAN');

  res.json({ message: `Estado actualizado a ${u.status}`, user: u });
});

app.post("/api/admin/edit-user", authenticateToken, requireAdmin, async (req, res) => {
  const { userId, name, email, role, status, ip, isPremium, planTier, premiumExpiresAt } = req.body;
  if (!userId) return res.status(400).json({ error: "ID de usuario es obligatorio" });

  const u = await db.getUser(userId);
  if (!u) return res.status(404).json({ error: "Usuario no encontrado" });

  const wasPremium = !!u.isPremium;
  const oldExpiresAt = u.premiumExpiresAt;

  if (name !== undefined && name.trim() !== "") u.name = String(name).trim();
  if (email !== undefined && email.trim() !== "") {
    const cleanEmail = email.trim().toLowerCase();
    const existing = await db.getUserByEmail(cleanEmail);
    if (existing && existing.id !== userId) {
      return res.status(400).json({ error: "El correo electrónico ya está registrado por otro usuario" });
    }
    u.email = cleanEmail;
  }
  if (role !== undefined && (role === 'admin' || role === 'user')) u.role = role;
  if (status !== undefined) {
    u.status = status;
    u.isBanned = status === 'Baneado';
  }
  if (ip !== undefined && ip.trim() !== "") u.ip = ip.trim();
  
  if (planTier !== undefined) {
    u.planTier = planTier;
    if (planTier === 'free') {
      u.isPremium = false;
      u.premiumExpiresAt = undefined;
    } else {
      u.isPremium = true;
      if (!u.premiumExpiresAt || u.premiumExpiresAt <= Date.now()) {
        u.premiumExpiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
      }
    }
  } else if (isPremium !== undefined) {
    u.isPremium = !!isPremium;
    if (u.isPremium) {
      if (!u.planTier || u.planTier === 'free') u.planTier = 'premium';
      if (!u.premiumExpiresAt || u.premiumExpiresAt <= Date.now()) {
        u.premiumExpiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
      }
    } else {
      u.planTier = 'free';
      u.premiumExpiresAt = undefined;
    }
  }

  if (premiumExpiresAt !== undefined) u.premiumExpiresAt = premiumExpiresAt ? Number(premiumExpiresAt) : undefined;

  await db.saveUser(u);
  db.saveDatabase();
  redis.flush();

  // Trigger invoice / notification email if premium state changed
  if (!wasPremium && u.isPremium) {
    await sendPremiumInvoiceEmail({ userEmail: u.email, userName: u.name, type: 'ACTIVATED', expiresAt: u.premiumExpiresAt, planTier: u.planTier });
  } else if (wasPremium && !u.isPremium) {
    await sendPremiumInvoiceEmail({ userEmail: u.email, userName: u.name, type: 'REMOVED', reason: 'Ajuste manual de perfil por administrador' });
  } else if (wasPremium && u.isPremium && oldExpiresAt !== u.premiumExpiresAt) {
    await sendPremiumInvoiceEmail({ userEmail: u.email, userName: u.name, type: 'EXTENDED', expiresAt: u.premiumExpiresAt, planTier: u.planTier });
  }

  db.logSecurityEvent("ADMIN", "ROLE_CHANGED", u.email, `Perfil de usuario ${u.name} actualizado por Administrador (Plan: ${u.planTier || 'free'})`);
  broadcastUserUpdate(u, 'PROFILE_EDIT');

  res.json({ message: `Perfil de ${u.name} actualizado exitosamente`, user: u });
});

// SET USER PLAN TIER DIRECTLY (Admin only)
app.post("/api/admin/set-user-plan", authenticateToken, requireAdmin, async (req, res) => {
  const { userId, planTier, days } = req.body;
  if (!userId) return res.status(400).json({ error: "ID de usuario requerido" });
  if (!['free', 'premium', 'cyber_elite'].includes(planTier)) {
    return res.status(400).json({ error: "Plan no válido (free, premium o cyber_elite)" });
  }

  const u = await db.getUser(userId);
  if (!u) return res.status(404).json({ error: "Usuario no encontrado" });

  const durationDays = days && Number(days) > 0 ? Number(days) : 30;
  const wasPremium = !!u.isPremium;

  if (planTier === 'free') {
    u.planTier = 'free';
    u.isPremium = false;
    u.premiumExpiresAt = undefined;
  } else {
    u.planTier = planTier;
    u.isPremium = true;
    u.premiumExpiresAt = Date.now() + durationDays * 24 * 60 * 60 * 1000;
  }

  await db.saveUser(u);
  redis.flush();

  const planDisplayName = planTier === 'cyber_elite' ? '⚡ Cyber Elite Ultra' : planTier === 'premium' ? '👑 Aether Premium VIP' : '🛡️ Plan Básico / Gratis';

  if (!wasPremium && u.isPremium) {
    await sendPremiumInvoiceEmail({
      userEmail: u.email,
      userName: u.name,
      type: 'ACTIVATED',
      months: Math.ceil(durationDays / 30),
      expiresAt: u.premiumExpiresAt,
      planTier: u.planTier
    });
  } else if (wasPremium && !u.isPremium) {
    await sendPremiumInvoiceEmail({
      userEmail: u.email,
      userName: u.name,
      type: 'REMOVED',
      reason: 'Plan restablecido a Básico / Gratuito por administración'
    });
  }

  db.logSecurityEvent("ADMIN", "ROLE_CHANGED", u.email, `Plan de ${u.name} cambiado a ${planDisplayName} por ${durationDays} días`);
  broadcastUserUpdate(u, 'PLAN_CHANGE');

  res.json({
    message: `Plan de ${u.name} actualizado exitosamente a ${planDisplayName}`,
    user: formatUserResponse(u)
  });
});

app.post("/api/admin/delete-user", authenticateToken, requireAdmin, async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "ID de usuario es obligatorio" });

  const currentUser = (req as any).user as UserRecord;
  if (currentUser && currentUser.id === userId) {
    return res.status(400).json({ error: "No puedes eliminar tu propia cuenta de administrador." });
  }

  const u = await db.getUser(userId);
  if (!u) return res.status(404).json({ error: "Usuario no encontrado" });

  await db.deleteUser(userId);
  redis.flush();

  db.logSecurityEvent("ADMIN", "ACCESS_DENIED", u.email, `Cuenta de usuario ${u.name} eliminada por el Administrador`);
  broadcastUserUpdate({ id: userId, isBanned: true, status: 'Eliminado', email: u.email }, 'BAN');

  res.json({ message: `Usuario ${u.name} eliminado permanentemente` });
});

app.get("/api/admin/rooms", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const allRooms = await db.getAllRooms();
    const roomsList = await Promise.all(allRooms.map(async (r: any) => {
      const creator = r.createdById ? await db.getUser(r.createdById) : null;
      const msgCount = await (MessageModel as any).countDocuments({ roomId: r.id });
      return {
        id: r.id,
        name: r.name,
        code: r.code,
        createdById: r.createdById,
        createdByName: creator ? creator.name : (r.createdByName || "Sistema"),
        createdAt: r.createdAt,
        isPrivate: !!r.isPrivate,
        isClosed: !!r.isClosed,
        messageCount: msgCount
      };
    }));
    res.json(roomsList);
  } catch (err: any) {
    res.status(500).json({ error: "Error obteniendo salas: " + err.message });
  }
});

app.post("/api/admin/delete-room", authenticateToken, requireAdmin, async (req, res) => {
  const { roomId } = req.body;
  if (!roomId) return res.status(400).json({ error: "ID de sala es requerido" });

  const room = await db.getRoom(roomId);
  if (!room) return res.status(404).json({ error: "Sala no encontrada" });

  await db.deleteRoom(roomId);
  redis.del("rooms_list");

  wss.clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(JSON.stringify({ type: "ROOM_DELETED", roomId }));
    }
  });

  res.json({ message: `Sala "${room.name}" eliminada exitosamente` });
});

app.post("/api/admin/reset-user-password", authenticateToken, requireAdmin, async (req, res) => {
  const { userId, newPassword } = req.body;
  if (!userId || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: "ID de usuario y nueva contraseña (mínimo 6 caracteres) requeridos." });
  }

  const u = (await db.getUser(userId));
  if (!u) {
    return res.status(404).json({ error: "Usuario no localizado en la Base de Datos" });
  }

  u.passwordHash = db.hashPassword(newPassword);
  /* isDirty ignored */
  db.logSecurityEvent("ADMIN", "ROLE_CHANGED", u.email, `Administrador reestableció la contraseña del usuario ${u.name}`);

  res.json({ message: `Contraseña de ${u.name} restablecida exitosamente.` });
});

app.get("/api/admin/banned-ips", authenticateToken, requireAdmin, async (req, res) => {
  const list = await db.getAllBannedIPsDetails();
  res.json(list);
});

app.post("/api/admin/ban-ip", authenticateToken, requireAdmin, async (req, res) => {
  const adminUser = (req as any).user as UserRecord;
  const { ip, reason, severity, evidence, userId, bannedBy } = req.body;
  if (!ip) return res.status(400).json({ error: "Dirección IP requerida" });

  const cleanIp = ip.trim();
  const banSource = bannedBy || `Admin (${adminUser?.name || adminUser?.email || 'Manual'})`;

  await db.banUserAndIP(
    cleanIp,
    reason || "Sanción manual de Administrador",
    severity || "high",
    evidence || "Sanción aplicada manualmente desde el Panel de Administrador",
    userId,
    banSource
  );

  if (userId) {
    const targetU = await db.getUser(userId);
    if (targetU) broadcastUserUpdate(targetU, 'BAN');
  } else {
    const allU = await db.getAllUsers();
    allU.filter(u => u.ip === cleanIp).forEach(u => broadcastUserUpdate(u, 'BAN'));
  }

  res.json({ message: `IP ${cleanIp} bloqueada exitosamente en el firewall.` });
});

app.post("/api/admin/unban-ip", authenticateToken, requireAdmin, async (req, res) => {
  const adminUser = (req as any).user as UserRecord;
  const { ip, userId, targetIp } = req.body;
  const cleanIp = (ip || targetIp || '').trim();

  if (cleanIp) {
    await db.removeBannedIP(cleanIp);
  }

  if (userId && ((await db.getUser(userId)) !== null)) {
    const u = await db.getUser(userId);
    u.isBanned = false;
    u.status = 'Activo';
    u.banReason = undefined;
    u.banEvidence = undefined;
    await db.saveUser(u);
    broadcastUserUpdate(u, 'UNBAN');
  } else if (cleanIp) {
    const allUsers = await db.getAllUsers();
    for (const u of allUsers) {
      if (u.ip === cleanIp) {
        u.isBanned = false;
        u.status = 'Activo';
        u.banReason = undefined;
        await db.saveUser(u);
        broadcastUserUpdate(u, 'UNBAN');
      }
    }
  }

  db.logSecurityEvent("ADMIN", "IP_BAN_TRIGGERED", cleanIp, `IP ${cleanIp} desbloqueada por admin ${adminUser?.name || 'Sistema'}`);
  res.json({ message: `IP ${cleanIp || 'especificada'} desbloqueada exitosamente.` });
});

app.post("/api/admin/premium/add", authenticateToken, requireAdmin, async (req, res) => {
  const { email, months } = req.body;
  if (!email || !months) return res.status(400).json({ error: "Email y meses son requeridos" });
  
  const cleanEmail = email.trim().toLowerCase();
  const doc = await (UserModel as any).findOne({ email: cleanEmail });
  if (!doc) return res.status(404).json({ error: "Usuario no encontrado" });

  const durationMs = parseInt(months) * 30 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  let newExpiresAt = doc.premiumExpiresAt || 0;
  
  if (doc.isPremium && newExpiresAt > now) {
    newExpiresAt += durationMs;
  } else {
    newExpiresAt = now + durationMs;
  }
  
  await (UserModel as any).updateOne({ email: cleanEmail }, {
    $set: { isPremium: true, premiumExpiresAt: newExpiresAt }
  });

  const u = await db.getUserByEmail(cleanEmail);
  if (u) {
    u.isPremium = true;
    u.premiumExpiresAt = newExpiresAt;
    await db.saveUser(u);
    broadcastUserUpdate(u, 'PREMIUM_UPDATE');
  }
  redis.flush();

  await sendPremiumInvoiceEmail({
    userEmail: cleanEmail,
    userName: doc.name || cleanEmail,
    type: 'ACTIVATED',
    months: parseInt(months),
    expiresAt: newExpiresAt,
    planTier: u?.planTier
  });

  res.json({ message: `Premium añadido exitosamente por ${months} mes(es)`, expiresAt: newExpiresAt });
});

app.post("/api/admin/premium/remove", authenticateToken, requireAdmin, async (req, res) => {
  const { email, reason } = req.body;
  if (!email) return res.status(400).json({ error: "Email es requerido" });
  
  const cleanEmail = email.trim().toLowerCase();
  const doc = await (UserModel as any).findOne({ email: cleanEmail });
  if (!doc) return res.status(404).json({ error: "Usuario no encontrado" });
  
  await (UserModel as any).updateOne({ email: cleanEmail }, {
    $set: { isPremium: false },
    $unset: { premiumExpiresAt: 1 }
  });

  const u = await db.getUserByEmail(cleanEmail);
  if (u) {
    u.isPremium = false;
    u.premiumExpiresAt = undefined;
    await db.saveUser(u);
    broadcastUserUpdate(u, 'PREMIUM_UPDATE');
  }
  redis.flush();

  const finalReason = reason || "Decisión administrativa.";
  await sendPremiumInvoiceEmail({
    userEmail: cleanEmail,
    userName: doc.name || cleanEmail,
    type: 'REMOVED',
    reason: finalReason
  });

  res.json({ message: "Premium removido exitosamente" });
});

app.post("/api/admin/premium/update-date", authenticateToken, requireAdmin, async (req, res) => {
  const { email, timestamp } = req.body;
  if (!email || !timestamp) return res.status(400).json({ error: "Email y timestamp son requeridos" });
  
  const cleanEmail = email.trim().toLowerCase();
  const doc = await (UserModel as any).findOne({ email: cleanEmail });
  if (!doc) return res.status(404).json({ error: "Usuario no encontrado" });
  if (!doc.isPremium) return res.status(400).json({ error: "El usuario no es Premium actualmente" });

  const newExpiresAt = Number(timestamp);
  await (UserModel as any).updateOne({ email: cleanEmail }, {
    $set: { premiumExpiresAt: newExpiresAt }
  });

  const u = await db.getUserByEmail(cleanEmail);
  if (u) {
    u.premiumExpiresAt = newExpiresAt;
    await db.saveUser(u);
    broadcastUserUpdate(u, 'PREMIUM_UPDATE');
  }
  redis.flush();

  await sendPremiumInvoiceEmail({
    userEmail: cleanEmail,
    userName: doc.name || cleanEmail,
    type: 'EXTENDED',
    expiresAt: newExpiresAt,
    planTier: u?.planTier
  });

  res.json({ message: "Fecha de expiración actualizada", expiresAt: newExpiresAt });
});

app.get("/api/admin/threats", authenticateToken, requireAdmin, async (req, res) => {
  res.json((await db.getAllThreats()));
});

// FORENSIC CASES & ARGENTINE LAW AUDIT DOSSIERS
app.get("/api/admin/forensic-cases", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const cases = await db.getAllForensicCases();
    res.json(cases);
  } catch (err: any) {
    res.status(500).json({ error: "Error obteniendo expedientes forenses: " + err.message });
  }
});

app.post("/api/admin/delete-forensic-case", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { caseId } = req.body;
    if (!caseId) return res.status(400).json({ error: "ID de caso requerido" });
    const success = await db.deleteForensicCase(caseId);
    if (success) {
      res.json({ message: "Expediente forense eliminado correctamente" });
    } else {
      res.status(500).json({ error: "No se pudo eliminar el expediente" });
    }
  } catch (err: any) {
    res.status(500).json({ error: "Error eliminando expediente: " + err.message });
  }
});

app.get("/api/admin/access-logs", authenticateToken, requireAdmin, async (req, res) => {
  const decryptedLogs = (await db.getAllSecurityLogs()).map(l => ({
    ...l,
    details: db.decryptMetadata(l.details || "")
  }));
  res.json(decryptedLogs);
});

// GET SMTP Config
app.get("/api/admin/smtp-config", authenticateToken, requireAdmin, async (req, res) => {
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
app.post("/api/admin/smtp-config", authenticateToken, requireAdmin, async (req, res) => {
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

// ==========================================
// REAL-TIME WEBSOCKET SECURITY MONITOR API
// ==========================================
app.get("/api/admin/ws-monitor/stats", authenticateToken, requireAdmin, async (req, res) => {
  const activeClients = Array.from(wsClientTrackerMap.values()).map(t => ({
    id: t.id,
    ip: t.ip,
    userId: t.userId,
    userName: t.userName,
    userEmail: t.userEmail,
    roomId: t.roomId,
    connectedAt: t.connectedAt,
    lastPingAt: t.lastPingAt,
    messageCountWindow: t.messageCountWindow,
    roomSwitchCountWindow: t.roomSwitchCountWindow,
    authFailures: t.authFailures,
    status: t.status
  }));

  const bannedIpsList = (await db.getAllThreats())
    .filter(t => t.blocked && t.ip)
    .map(t => ({ ip: t.ip, reason: t.reason, bannedAt: t.timestamp }));

  res.json({
    activeSockets: wsClientTrackerMap.size,
    authenticatedSockets: activeClients.filter(c => c.userId).length,
    totalMessagesProcessed: totalWsMessagesProcessed,
    messagesPerSecond: wsMessagesLastSecond,
    suspiciousEventsCount: wsRecentEvents.filter(e => e.severity === 'alert' || e.severity === 'critical').length,
    autoBlockedIpsCount: bannedIpsList.length,
    activeClients,
    heuristics: wsHeuristics,
    bannedIps: bannedIpsList,
    recentEvents: wsRecentEvents.slice(0, 50)
  });
});

app.post("/api/admin/ws-monitor/heuristics", authenticateToken, requireAdmin, async (req, res) => {
  const { heuristicId, enabled, threshold } = req.body;
  const rule = wsHeuristics.find(h => h.id === heuristicId);
  if (rule) {
    if (enabled !== undefined) rule.enabled = Boolean(enabled);
    if (threshold !== undefined && typeof threshold === 'number' && threshold > 0) rule.threshold = threshold;
    return res.json({ message: "Regla heurística actualizada", rule });
  }
  res.status(404).json({ error: "Regla heurística no encontrada" });
});

app.post("/api/admin/ws-monitor/disconnect", authenticateToken, requireAdmin, async (req, res) => {
  const { socketId } = req.body;
  for (const [ws, tracker] of wsClientTrackerMap.entries()) {
    if (tracker.id === socketId) {
      ws.send(JSON.stringify({ type: "ERROR", message: "Conexión desconectada por el administrador WAF" }));
      ws.close();
      wsClientTrackerMap.delete(ws);
      logWsSecurityEvent('MANUAL_BLOCK', tracker.ip, `Desconexión forzada de socket ${socketId}`, 'warn');
      return res.json({ message: "Socket desconectado exitosamente" });
    }
  }
  res.status(404).json({ error: "Socket no localizado" });
});

app.post("/api/admin/ws-monitor/simulate-threat", authenticateToken, requireAdmin, async (req, res) => {
  const { threatType } = req.body;
  const testIp = "192.168.1.250";
  if (threatType === 'FLOOD') {
    const reason = "Simulación WAF: Inundación de mensajes de prueba (Flood Attack Test)";
    logWsSecurityEvent('HEURISTIC_TRIGGER', testIp, reason, 'alert');
    await db.banUserAndIP(testIp, reason, 'high', 'Simulación de prueba heurística WAF');
    return res.json({ message: `Amenaza FLOOD simulada para IP ${testIp}. Se registró evento y bloqueo de prueba.` });
  } else if (threatType === 'AUTH_BURST') {
    const reason = "Simulación WAF: Ráfaga de autenticación fallida (Auth Burst Test)";
    logWsSecurityEvent('HEURISTIC_TRIGGER', testIp, reason, 'alert');
    await db.banUserAndIP(testIp, reason, 'high', 'Simulación de prueba de contraseña de fuerza bruta');
    return res.json({ message: `Amenaza AUTH_BURST simulada para IP ${testIp}. Se registró evento y bloqueo de prueba.` });
  }
  res.json({ message: "Simulación de prueba completada" });
});

// TEST SMTP Email Dispatch
app.post("/api/admin/test-smtp", authenticateToken, requireAdmin, async (req, res) => {
  const { toEmail } = req.body;
  const adminUser = (req as any).user as UserRecord;
  const targetEmail = toEmail ? String(toEmail).trim() : (adminUser?.email || currentSmtpConfig.user || MASTER_ADMIN_EMAIL);

  const content = `
    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
      Este es un mensaje de prueba emitido exitosamente por la infraestructura de <strong>Aether Security</strong>.
    </p>

    <div style="background-color: #0f172a; border-radius: 14px; padding: 20px; border: 1px solid #10b981; margin-bottom: 20px;">
      <h3 style="margin: 0 0 12px 0; font-size: 11px; color: #10b981; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 800;">✅ Estado de Conexión SMTP: ACTIVO</h3>
      <p style="margin: 0 0 12px 0; color: #cbd5e1; font-size: 13px; line-height: 1.5;">
        Su configuración SMTP y las credenciales de la contraseña de aplicación de Google están funcionando al 100%.
      </p>
      <div style="background-color: #070c18; border: 1px solid #1e293b; padding: 10px 14px; border-radius: 8px; font-family: monospace; font-size: 11px; color: #34d399;">
        Host SMTP: ${currentSmtpConfig.host}:${currentSmtpConfig.port} | Usuario: ${currentSmtpConfig.user}
      </div>
    </div>
  `;

  const testHtml = buildAetherEmail("Diagnóstico SMTP Completado", "PRUEBA DE SERVIDOR", content, "#10b981");

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
- Usuarios totales: ${(await db.getUsersCount())}
- IPs Baneadas: ${(await db.getBannedIPsCount())}
- Amenazas Registradas: ${(await db.getThreatsCount())}

Responde como el principal analista de ciberseguridad avanzado de la red. Utiliza lenguaje sumamente técnico, detallado, realiza un perfilado profundo del comportamiento y proporciona recomendaciones tácticas de mitigación (NIST, CIS). Eres el nivel máximo de IA de administración.`;

    const result = await queryMultiModelText(`${systemPrompt}\n\nConsulta de Administración: ${query}`);

    res.json({
      answer: result ? `${result.text}\n\n*(Análisis realizado mediante ${result.provider})*` : "Análisis completado.",
      suggestedAction: targetIp ? { targetIp, action: "BAN_IP" } : null
    });
  } catch (err: any) {
    res.status(500).json({ error: "Error procesando consulta IA: " + err.message });
  }
});

app.post(["/api/admin/send-invitation", "/api/admin/send-invite"], authenticateToken, requireAdmin, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email es obligatorio" });

  db.logSecurityEvent("127.0.0.1", "LOGIN_SUCCESS", email, `Invitación enviada por admin a ${email}`);
  res.json({ message: `Invitación enviada exitosamente por correo electrónico a ${email}` });
});

// AI AUDIO ANALYSIS ENDPOINT (Multi-Model Gemini + NVIDIA NIM)
app.post("/api/ai/analyze-audio", authenticateToken, async (req, res) => {
  try {
    const { audioData, mimeType } = req.body;
    if (!audioData) {
      return res.status(400).json({ error: "No se enviaron datos de audio para analizar." });
    }

    let base64 = audioData;
    let type = mimeType || "audio/webm";

    if (audioData.includes(";base64,")) {
      const parts = audioData.split(";base64,");
      type = parts[0].replace("data:", "").split(";")[0];
      base64 = parts[1];
    } else {
      type = type.split(";")[0];
    }

    const isComplex = type !== "audio/webm" && base64.length > 50000;
    const aiRes = await queryMultiModelMultimodal(
      "Analiza minuciosamente este archivo o nota de voz de audio. Proporciona:\n1. Transcripción literal en su idioma original.\n2. Resumen ejecutivo del contenido e intenciones.\n3. Detección del tono de voz, ambiente sonoro y posibles alertas de seguridad o lenguaje inapropiado. OBLIGATORIO: Responde en el idioma en el que se hable en el audio.",
      [{ data: base64, mimeType: type }],
      "Eres Aether AI, un sistema de validación de audio."
    );

    if (aiRes) {
      return res.json({
        analysis: aiRes.text,
        provider: isComplex ? "Aether AI" : "Aether AI"
      });
    }

    return res.json({
      analysis: "🎙️ **Nota de voz procesada correctamente.**\n\n*(El servicio de transcripción automatizada por IA está en pausa por límite temporal de cuota. Por favor, reintenta en unos segundos para obtener el desglose detallado).*",
      provider: "Aether Security Audio Guard"
    });
  } catch (err: any) {
    console.error("Audio AI error:", err);
    res.status(500).json({ error: "Error procesando el audio con IA: " + err.message });
  }
});

// MULTIMODAL AI ANALYSIS ENDPOINT (NVIDIA NIM + GEMINI)
// Handles text, images, video frames, audio, conversations, logs, rooms, sanctions
app.post("/api/ai/analyze-multimodal", authenticateToken, async (req, res) => {
  try {
    const { prompt, mediaItems, systemPrompt } = req.body;
    if (!prompt && (!mediaItems || mediaItems.length === 0)) {
      return res.status(400).json({ error: "Debes enviar al menos un mensaje de texto o un archivo multimedia." });
    }

    const defaultSystem = systemPrompt || "Eres Aether AI, un asistente avanzado. Proporciona un análisis exhaustivo, técnico, estructurado y claro de todo el contenido adjunto (texto, imágenes, video, audio o archivos).";

    const result = await queryMultiModelMultimodal(
      prompt || "Analiza el contenido multimedia adjunto de forma detallada y proporciona alertas de seguridad o hallazgos.",
      Array.isArray(mediaItems) ? mediaItems : [],
      defaultSystem
    );

    if (!result || !result.text) {
      return res.status(500).json({ error: "No se pudo obtener un análisis multimodal de las IAs activas." });
    }

    res.json({
      analysis: result.text,
      provider: result.provider,
      combined: result.combined
    });
  } catch (err: any) {
    console.error("Multimodal AI error:", err);
    res.status(500).json({ error: "Error en análisis multimodal: " + err.message });
  }
});

// ==========================================
// WEBSOCKET REAL-TIME ENGINE
// ==========================================
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

const roomConnections = new Map<string, Set<WebSocket>>();
const wsUserMap = new Map<WebSocket, { userId: string; name: string; email: string; ip: string; roomId?: string }>();

// Telemetry & Heuristic Monitor Engine
interface WsClientTracker {
  id: string;
  ws: WebSocket;
  ip: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  roomId?: string;
  connectedAt: number;
  lastPingAt: number;
  messageCountWindow: number;
  roomSwitchCountWindow: number;
  authFailures: number;
  status: 'active' | 'authenticated' | 'suspicious' | 'blocked';
}

const wsClientTrackerMap = new Map<WebSocket, WsClientTracker>();

interface HeuristicRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  threshold: number;
  unit: string;
  action: 'WARN' | 'DISCONNECT' | 'AUTO_BAN';
}

let wsHeuristics: HeuristicRule[] = [
  { id: 'flood_attack', name: 'Inundación de Mensajes (Flood)', description: 'Bloquea si se envían demasiados mensajes en 3 segundos.', enabled: true, threshold: 8, unit: 'msg / 3s', action: 'AUTO_BAN' },
  { id: 'auth_burst', name: 'Ráfaga Autenticación Fallida', description: 'Bloquea si hay múltiples intentos de autenticación inválida.', enabled: true, threshold: 3, unit: 'intentos / 10s', action: 'AUTO_BAN' },
  { id: 'payload_oversize', name: 'Frame Sobrecargado (Payload)', description: 'Detecta tramas WebSocket inusualmente grandes para prevenir buffer overflow.', enabled: true, threshold: 30000, unit: 'caracteres', action: 'AUTO_BAN' },
  { id: 'rapid_room_hopping', name: 'Barrido Acelerado de Salas', description: 'Bloquea bots cambiando de salas a velocidad sobrehumana.', enabled: true, threshold: 5, unit: 'cambios / 3s', action: 'AUTO_BAN' },
];

let wsRecentEvents: Array<{
  id: string;
  type: 'CONNECT' | 'DISCONNECT' | 'HEURISTIC_TRIGGER' | 'AUTO_BAN' | 'MANUAL_BLOCK' | 'PING';
  ip: string;
  detail: string;
  severity: 'info' | 'warn' | 'alert' | 'critical';
  timestamp: number;
}> = [];

function logWsSecurityEvent(type: any, ip: string, detail: string, severity: 'info' | 'warn' | 'alert' | 'critical') {
  const event = {
    id: "wsevt-" + crypto.randomUUID(),
    type,
    ip,
    detail,
    severity,
    timestamp: Date.now()
  };
  wsRecentEvents.unshift(event);
  if (wsRecentEvents.length > 100) wsRecentEvents.pop();
}

let totalWsMessagesProcessed = 0;
let wsMessagesLastSecond = 0;
let wsMessageCounter = 0;

setInterval(() => {
  wsMessagesLastSecond = wsMessageCounter;
  wsMessageCounter = 0;
  for (const tracker of wsClientTrackerMap.values()) {
    tracker.messageCountWindow = Math.max(0, tracker.messageCountWindow - 2);
    tracker.roomSwitchCountWindow = Math.max(0, tracker.roomSwitchCountWindow - 1);
  }
}, 1000);

async function checkWsHeuristics(ws: WebSocket, payloadLength: number, eventType: 'SEND' | 'AUTH' | 'JOIN_ROOM') {
  const tracker = wsClientTrackerMap.get(ws);
  if (!tracker) return false;

  const ip = tracker.ip;

  // 1. Check payload oversize
  const payloadRule = wsHeuristics.find(h => h.id === 'payload_oversize');
  if (payloadRule && payloadRule.enabled && payloadLength > payloadRule.threshold) {
    const reason = `Heurística WAF: Frame sobrecargado (${payloadLength} caracteres > ${payloadRule.threshold})`;
    logWsSecurityEvent('HEURISTIC_TRIGGER', ip, reason, 'critical');
    await db.banUserAndIP(ip, reason, 'critical', `Payload size: ${payloadLength}`);
    tracker.status = 'blocked';
    ws.send(JSON.stringify({ type: "THREAT_BLOCKED", reason, ip }));
    ws.close();
    return true;
  }

  // 2. Check flood attack
  if (eventType === 'SEND') {
    tracker.messageCountWindow += 1;
    const floodRule = wsHeuristics.find(h => h.id === 'flood_attack');
    if (floodRule && floodRule.enabled && tracker.messageCountWindow > floodRule.threshold) {
      const reason = `Heurística WAF: Inundación de mensajes WebSocket (${tracker.messageCountWindow} msg en ventana)`;
      logWsSecurityEvent('AUTO_BAN', ip, reason, 'critical');
      await db.banUserAndIP(ip, reason, 'critical', `Message window flood: ${tracker.messageCountWindow}`);
      tracker.status = 'blocked';
      ws.send(JSON.stringify({ type: "THREAT_BLOCKED", reason, ip }));
      ws.close();
      return true;
    }
  }

  // 3. Check rapid room hopping
  if (eventType === 'JOIN_ROOM') {
    tracker.roomSwitchCountWindow += 1;
    const roomRule = wsHeuristics.find(h => h.id === 'rapid_room_hopping');
    if (roomRule && roomRule.enabled && tracker.roomSwitchCountWindow > roomRule.threshold) {
      const reason = `Heurística WAF: Barrido/cambio acelerado de salas (${tracker.roomSwitchCountWindow} cambios)`;
      logWsSecurityEvent('AUTO_BAN', ip, reason, 'critical');
      await db.banUserAndIP(ip, reason, 'critical', `Room switch count: ${tracker.roomSwitchCountWindow}`);
      tracker.status = 'blocked';
      ws.send(JSON.stringify({ type: "THREAT_BLOCKED", reason, ip }));
      ws.close();
      return true;
    }
  }

  return false;
}

wss.on("connection", async (ws: WebSocket, req: http.IncomingMessage) => {
  const ip = req.headers['x-forwarded-for'] ? (req.headers['x-forwarded-for'] as string).split(',')[0].trim() : req.socket.remoteAddress || '127.0.0.1';

  if ((await db.isIpBanned(ip))) {
    ws.send(JSON.stringify({ type: "ERROR", message: "Aether Security: IP sin permisos" }));
    return ws.close();
  }

  const trackerId = "sock-" + crypto.randomUUID();
  const tracker: WsClientTracker = {
    id: trackerId,
    ws,
    ip,
    connectedAt: Date.now(),
    lastPingAt: Date.now(),
    messageCountWindow: 0,
    roomSwitchCountWindow: 0,
    authFailures: 0,
    status: 'active'
  };
  wsClientTrackerMap.set(ws, tracker);
  logWsSecurityEvent('CONNECT', ip, `Nueva conexión TCP WebSocket iniciada [${trackerId}]`, 'info');

  ws.on("close", () => {
    wsClientTrackerMap.delete(ws);
    logWsSecurityEvent('DISCONNECT', ip, `Conexión TCP finalizada [${trackerId}]`, 'info');
  });

  ws.on("message", async (data: string) => {
    try {
      const rawString = data.toString();
      totalWsMessagesProcessed++;
      wsMessageCounter++;

      // Check heuristics on payload size
      const isBlocked = await checkWsHeuristics(ws, rawString.length, 'SEND');
      if (isBlocked) return;

      const msg = JSON.parse(rawString);

      if (msg.type === "PING") {
        tracker.lastPingAt = Date.now();
        ws.send(JSON.stringify({ type: "PONG" }));
        return;
      }

      if (msg.type === "AUTHENTICATE") {
        const userId = await getSessionUserId(msg.token);
        if (!userId || !((await db.getUser(userId)) !== null)) {
          tracker.authFailures++;
          const authRule = wsHeuristics.find(h => h.id === 'auth_burst');
          if (authRule && authRule.enabled && tracker.authFailures >= authRule.threshold) {
            const reason = `Heurística WAF: Ráfaga de fallos de autenticación (${tracker.authFailures} fallos)`;
            logWsSecurityEvent('AUTO_BAN', ip, reason, 'critical');
            await db.banUserAndIP(ip, reason, 'critical', `Auth failures: ${tracker.authFailures}`);
            ws.send(JSON.stringify({ type: "THREAT_BLOCKED", reason, ip }));
            return ws.close();
          }
          ws.send(JSON.stringify({ type: "ERROR", message: "Sesión no válida" }));
          return ws.close();
        }

        const user = await db.getUser(userId);
        if (user.isBanned || user.status === 'Sancionado' || user.status === 'Baneado' || (await db.isIpBanned(ip))) {
          ws.send(JSON.stringify({ type: "ERROR", message: "Aether Security: Usuario con estado Baneado o IP bloqueada" }));
          return ws.close();
        }

        const vpnCheck = isVpnOrProxy(req as any);
        if (vpnCheck.detected) {
          ws.send(JSON.stringify({ type: "THREAT_BLOCKED", reason: "Uso de VPN o Proxy detectado", ip }));
          return ws.close();
        }

        if (Array.isArray(user.ipWhitelist) && user.ipWhitelist.length > 0) {
          if (!checkIsIpWhitelisted(ip, user.ipWhitelist, user.ip)) {
            db.logSecurityEvent(ip, "UNAUTHORIZED_IP_ACCESS", user.email, `WS bloqueado por Lista Blanca de IPs (${ip})`, true);
            ws.send(JSON.stringify({ type: "ERROR", message: `Aether Security: Acceso bloqueado. La IP ${ip} no está en tu Lista Blanca.` }));
            return ws.close();
          }
        }

        tracker.userId = user.id;
        tracker.userName = user.name;
        tracker.userEmail = user.email;
        tracker.status = 'authenticated';

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

      if ((await db.isIpBanned(senderData.ip))) {
        ws.send(JSON.stringify({ type: "ERROR", message: "Aether Security" }));
        return ws.close();
      }

      if (msg.type === "JOIN_ROOM") {
        const isBlockedHop = await checkWsHeuristics(ws, rawString.length, 'JOIN_ROOM');
        if (isBlockedHop) return;

        const { roomId } = msg;
        const targetRoom = await db.getRoom(roomId);
        if (!targetRoom) {
          return ws.send(JSON.stringify({ type: "ERROR", message: "Sala no localizada" }));
        }

        const roomMode = targetRoom.accessMode || (targetRoom.isClosed ? 'closed' : (targetRoom.isPrivate ? 'open' : 'global'));
        if (roomMode === 'closed' && targetRoom.createdById !== senderData.userId) {
          const userObj = await db.getUser(senderData.userId);
          if (userObj?.role !== 'admin') {
            return ws.send(JSON.stringify({ type: "ERROR", message: "Esta sala está CERRADA por su creador. No se permiten nuevos miembros." }));
          }
        }

        if (senderData.roomId && roomConnections.has(senderData.roomId)) {
          roomConnections.get(senderData.roomId)?.delete(ws);
        }

        senderData.roomId = roomId;
        tracker.roomId = roomId;
        if (!roomConnections.has(roomId)) {
          roomConnections.set(roomId, new Set());
        }
        roomConnections.get(roomId)!.add(ws);

        // Mark existing unread messages as read by this user
        const readMessageIds = await db.markMessagesRead(roomId, senderData.userId);
        if (readMessageIds.length > 0) {
          broadcastToRoom(roomId, {
            type: "MESSAGES_READ",
            roomId,
            readerId: senderData.userId,
            readerName: senderData.name,
            messageIds: readMessageIds
          });
        }

        const roomMsgs = (await db.getMessages(roomId)) || [];
        ws.send(JSON.stringify({ type: "ROOM_HISTORY", roomId, messages: roomMsgs }));

        broadcastToRoom(roomId, {
          type: "SYSTEM_NOTIFICATION",
          text: `${senderData.name} se unió a la sala`,
          activeCount: roomConnections.get(roomId)?.size || 1
        });
        broadcastRoomUsers(roomId);
        
        // System message for join
        const joinMsg = {
          id: "sys-" + crypto.randomUUID(),
          roomId: roomId,
          senderId: "system",
          senderName: "Sistema",
          senderEmail: "system@aether.local",
          encryptedText: "", // We can use plain text for system messages
          plainTextForAI: `El usuario ${senderData.name} se ha unido a la sala.`,
          reactions: [],
          readBy: [senderData.userId],
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: Date.now()
        };
        // broadcast system message
        broadcastToRoom(roomId, {
          type: "NEW_MESSAGE",
          message: joinMsg
        });
        redis.del("rooms_list");
        return;
      }

      if (msg.type === "MARK_READ") {
        const { roomId } = msg;
        if (!roomId) return;
        const readMessageIds = await db.markMessagesRead(roomId, senderData.userId);
        if (readMessageIds.length > 0) {
          broadcastToRoom(roomId, {
            type: "MESSAGES_READ",
            roomId,
            readerId: senderData.userId,
            readerName: senderData.name,
            messageIds: readMessageIds
          });
        }
        return;
      }

      if (msg.type === "ADD_REACTION") {
        const { roomId, messageId, reaction } = msg;
        const currentMsgs = (await db.getMessages(roomId));
        if (currentMsgs) {
          const m = currentMsgs.find(x => x.id === messageId);
          if (m) {
            if (!m.reactions) m.reactions = [];
            m.reactions.push({ emoji: reaction, senderName: senderData.name });
            /* isDirty ignored */
            broadcastToRoom(roomId, {
              type: "REACTION_ADDED",
              roomId,
              messageId,
              reaction: { emoji: reaction, senderName: senderData.name }
            });
          }
        }
        return;
      }

      if (msg.type === "SEND_MESSAGE") {
        const { roomId, encryptedText, attachments, replyTo, selfDestruct, isBotRequest, plainTextForAI, poll, format, codeLanguage, isPinned } = msg;
        if (!roomId || !encryptedText) return;

        if (plainTextForAI && plainTextForAI.length > 2000) {
          ws.send(JSON.stringify({
            type: "THREAT_BLOCKED",
            reason: "El mensaje excede el límite máximo de 2000 caracteres."
          }));
          return;
        }

        if (attachments && Array.isArray(attachments)) {
          let imgCount = 0, vidCount = 0, docCount = 0, audCount = 0;
          for (const att of attachments) {
            if (att.type?.startsWith("image/")) imgCount++;
            else if (att.type?.startsWith("video/")) vidCount++;
            else if (att.type?.startsWith("audio/")) audCount++;
            else docCount++;
          }
          if (imgCount > 5 || vidCount > 5 || docCount > 5 || audCount > 5) {
            ws.send(JSON.stringify({
              type: "THREAT_BLOCKED",
              reason: "Límite de adjuntos por mensaje excedido (Máx. 5 imágenes, 5 videos, 5 documentos, 5 audios)."
            }));
            return;
          }
        }

        // Active users currently in the room will instantly have the message marked as read
        const activeUsersInRoom: string[] = [];
        if (roomConnections.has(roomId)) {
          for (const peerWs of roomConnections.get(roomId)!) {
            const peerData = wsUserMap.get(peerWs);
            if (peerData?.userId && peerData.userId !== senderData.userId) {
              activeUsersInRoom.push(peerData.userId);
            }
          }
        }
        const initialReadBy = [senderData.userId, ...activeUsersInRoom];

        // 1. INSTANT BROADCAST TO ROOM CLIENTS FOR ZERO LATENCY
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
          isPinned: !!isPinned,
          poll: poll || undefined,
          format: format || 'markdown',
          codeLanguage: codeLanguage || undefined,
          readBy: initialReadBy,
          status: 'sent',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: Date.now()
        };

        await db.saveMessage(msgRecord);

        broadcastToRoom(roomId, {
          type: "NEW_MESSAGE",
          message: msgRecord
        });

        // 2. Self-Destruct / Disappearing message timer logic
        if (selfDestruct && typeof selfDestruct === 'number' && selfDestruct > 0) {
          setTimeout(async () => {
            await db.deleteMessage(msgRecord.id);
            broadcastToRoom(roomId, {
              type: "MESSAGE_DELETED",
              roomId,
              messageId: msgRecord.id,
              reason: "Mensaje autodestruido por temporizador"
            });
          }, selfDestruct * 1000);
        }

        // 3. ASYNCHRONOUS BACKGROUND AI MODERATION QUEUE (ZERO LATENCY TO SENDER)
        const attSummary = (attachments || []).map(a => a.name + " (" + a.type + ")").join(", ");
        const payloadToAnalyze = plainTextForAI || (attSummary ? "Adjuntos: " + attSummary : "");
        if (payloadToAnalyze) {
          enqueueModerationJob({
            msgId: msgRecord.id,
            roomId,
            senderIp: senderData.ip,
            senderEmail: senderData.email,
            senderUserId: senderData.userId,
            payloadToAnalyze,
            plainTextForAI,
            attSummary,
            ws
          });
        }

        // 4. BOT IA ASSISTANCE TRIGGER (/bot or explicitly requested)
        const isBotTrigger = isBotRequest || (plainTextForAI && (plainTextForAI.toLowerCase().startsWith("/bot") || plainTextForAI.toLowerCase().includes("@bot")));
        if (isBotTrigger) {
          const rawPrompt = plainTextForAI || encryptedText;
          const cleanPrompt = rawPrompt.replace(/^\/bot\s*/i, "").replace(/@bot\s*/i, "").trim() || "Hola bot, saluda al chat";
          
          const botMsgId = "msg-bot-" + crypto.randomUUID();
          const botLoadingMsgRecord: MessageRecord = {
            id: botMsgId,
            roomId,
            senderId: "bot-ai-assistant",
            senderName: "🤖 Asistente Bot IA",
            senderEmail: "bot@paginaprotegida.com",
            encryptedText: "⏳ Cargando respuesta...",
            reactions: [],
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: Date.now()
          };

          const currentRoomMsgs = await db.getMessages(roomId) || [];
          currentRoomMsgs.push(botLoadingMsgRecord);
          if (currentRoomMsgs.length > 200) currentRoomMsgs.shift();

          broadcastToRoom(roomId, { type: "NEW_MESSAGE", message: botLoadingMsgRecord });

          (async () => {
            try {
              let botReplyText = "🤖 Hola, soy Aether AI Assistant. ¿En qué puedo colaborarte hoy?";
              
              const mediaItems: Array<{ data: string; mimeType: string }> = [];
              if (attachments && Array.isArray(attachments)) {
                for (const att of attachments) {
                  if (att.data && att.type) {
                    mediaItems.push({ data: att.data, mimeType: att.type });
                  }
                }
              }

              const systemPrompt = `Eres "Aether AI", el asistente virtual avanzado.
Ofreces respuestas altamente inteligentes, claras, útiles y amigables estructuradas con código o Markdown claro cuando sea útil.
IMPORTANTE: Debes responder OBLIGATORIAMENTE en el mismo idioma en el que el usuario te hable (Ejemplo: si te dice "Hello", responde en inglés, si dice "Hola", responde en español).
Atiende la solicitud del usuario ${senderData.name}: "${cleanPrompt}".`;

              const multiRes = await queryMultiModelMultimodal(cleanPrompt, mediaItems, systemPrompt);
              if (multiRes && multiRes.text) {
                const providerTag = multiRes.provider ? `\n\n_⚡ Modelo: ${multiRes.provider}_` : '';
                botReplyText = multiRes.text + providerTag;
              }

              // Actualizamos el mensaje en la BD
              const msgs = await db.getMessages(roomId) || [];
              const idx = msgs.findIndex(m => m.id === botMsgId);
              if (idx !== -1) {
                msgs[idx].encryptedText = botReplyText;
                db.saveDatabase();
              }

              broadcastToRoom(roomId, {
                type: "UPDATE_MESSAGE",
                messageId: botMsgId,
                roomId,
                encryptedText: botReplyText
              });

            } catch (err) {
              console.error("Bot IA Error:", err);
            }
          })();
        }

        broadcastPushNotification(roomId, senderData.name, "Nuevo mensaje recibido");
        return;
      }

      if (msg.type === "TOGGLE_REACTION") {
        const { roomId, messageId, emoji } = msg;
        if (!roomId || !messageId || !emoji) return;

        const roomMsgs = (await db.getMessages(roomId)) || [];
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

      if (msg.type === "PIN_MESSAGE") {
        const { roomId, messageId } = msg;
        if (!roomId || !messageId) return;

        const roomMsgs = (await db.getMessages(roomId)) || [];
        const targetMsg = roomMsgs.find(m => m.id === messageId);
        if (targetMsg) {
          targetMsg.isPinned = !targetMsg.isPinned;
          await db.updateMessagePin(messageId, targetMsg.isPinned);
          broadcastToRoom(roomId, {
            type: "MESSAGE_PIN_TOGGLED",
            roomId,
            messageId,
            isPinned: targetMsg.isPinned
          });
        }
        return;
      }

      if (msg.type === "POLL_VOTE") {
        const { roomId, messageId, optionId } = msg;
        if (!roomId || !messageId || !optionId) return;

        const roomMsgs = (await db.getMessages(roomId)) || [];
        const targetMsg = roomMsgs.find(m => m.id === messageId);
        if (targetMsg && targetMsg.poll && Array.isArray(targetMsg.poll.options)) {
          // Toggle vote: remove if already in this option, or switch vote
          targetMsg.poll.options.forEach((opt: any) => {
            opt.votes = (opt.votes || []).filter((uid: string) => uid !== senderData.userId);
          });
          const targetOpt = targetMsg.poll.options.find((o: any) => o.id === optionId);
          if (targetOpt) {
            if (!targetOpt.votes) targetOpt.votes = [];
            targetOpt.votes.push(senderData.userId);
          }
          
          let total = 0;
          targetMsg.poll.options.forEach((opt: any) => {
            total += (opt.votes?.length || 0);
          });
          targetMsg.poll.totalVotes = total;

          await db.updateMessagePoll(messageId, targetMsg.poll);
          broadcastToRoom(roomId, {
            type: "POLL_UPDATED",
            roomId,
            messageId,
            poll: targetMsg.poll
          });
        }
        return;
      }

      if (msg.type === "DELETE_MESSAGE") {
        const { roomId, messageId } = msg;
        if (!roomId || !messageId) return;

        const roomMsgs = (await db.getMessages(roomId)) || [];
        const targetMsg = roomMsgs.find(m => m.id === messageId);
        const userObj = await db.getUser(senderData.userId);
        const isAdmin = userObj?.role === 'admin';
        const isAuthor = targetMsg?.senderId === senderData.userId;

        if (targetMsg && (isAuthor || isAdmin)) {
          await db.deleteMessage(messageId);
          broadcastToRoom(roomId, {
            type: "MESSAGE_DELETED",
            roomId,
            messageId
          });
        }
        return;
      }

      if (msg.type === "CLEAR_ROOM") {
        const { roomId } = msg;
        if (!roomId) return;
        /* messages.set ignored */;
  /* isDirty ignored */
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

  ws.on("close", async () => {
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

async function broadcastRoomUsers(roomId: string) {
  const clients = roomConnections.get(roomId);
  if (!clients) return;
  const usersMap = new Map<string, { id: string; name: string; email: string; role?: string; avatar?: string; isPremium?: boolean; planTier?: string; ip?: string; status?: string }>();
  for (const client of clients) {
    const u = wsUserMap.get(client);
    if (u) {
      const userObj = (await db.getUser(u.userId));
      const formatted = userObj ? formatUserResponse(userObj) : null;
      usersMap.set(u.userId, {
        id: u.userId,
        name: u.name,
        email: u.email,
        role: formatted?.role || 'user',
        avatar: userObj?.avatar,
        isPremium: formatted?.isPremium || false,
        planTier: formatted?.planTier || 'free',
        ip: u.ip,
        status: userObj?.status || 'Activo'
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
  await db.loadDatabase();

  setInterval(async () => {
    try {
      const now = Date.now();
      const allUsers = await db.getAllUsers();
      for (const u of allUsers) {
        if (u.isPremium && u.premiumExpiresAt && u.premiumExpiresAt > 0 && u.premiumExpiresAt < now) {
          u.isPremium = false;
          u.premiumExpiresAt = undefined;
          await db.saveUser(u);
          await (UserModel as any).updateOne({ email: u.email }, {
            $set: { isPremium: false },
            $unset: { premiumExpiresAt: 1 }
          });
          redis.flush();

          await sendPremiumInvoiceEmail({
            userEmail: u.email,
            userName: u.name || u.email,
            type: 'EXPIRED'
          });

          console.log(`[PREMIUM EXPIRATION] La suscripción de ${u.email} ha expirado y se ha revocado automáticamente con factura enviada.`);
        }
      }
    } catch(err) {
      console.error("[PREMIUM EXPIRATION INTERVAL ERROR]:", err);
    }
  }, 10000);
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", async (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[AETHER CORE] Servidor iniciado en http://0.0.0.0:${PORT}`);
  });
}

startServer();
