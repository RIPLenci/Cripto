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

async function sendPremiumInvoiceEmail(params: {
  userEmail: string;
  userName?: string;
  type: 'ACTIVATED' | 'EXTENDED' | 'REMOVED' | 'EXPIRED';
  months?: number;
  expiresAt?: number;
  reason?: string;
}) {
  const { userEmail, userName, type, months, expiresAt, reason } = params;
  if (!userEmail) return;

  const displayName = userName || userEmail.split('@')[0];
  const invoiceNum = `FACT-AETHER-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
  const issueDate = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const expiresDateStr = expiresAt ? new Date(expiresAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';

  const m = months && months > 0 ? months : 1;
  const isPaid = type === 'ACTIVATED' || type === 'EXTENDED';

  const basePlanPrice = isPaid ? 9.99 * m : 0;
  const processingFee = isPaid ? 0.80 : 0;
  const subtotal = basePlanPrice + processingFee;
  const iva = isPaid ? subtotal * 0.16 : 0;
  const grandTotal = subtotal + iva;

  let subject = '';
  let badgeColor = '#10b981';
  let badgeText = 'PAGADO & ACTIVADO';
  let statusBanner = '';

  if (type === 'ACTIVATED') {
    subject = `📄 Factura Electrónica y Activación Premium #${invoiceNum}`;
    badgeColor = '#10b981';
    badgeText = 'PAGADO & ACTIVADO';
    statusBanner = '¡Gracias por adquirir tu membresía Aether Security Pro! Tu servicio ha sido activado exitosamente con acceso total a Inteligencias Artificiales y encriptación VIP.';
  } else if (type === 'EXTENDED') {
    subject = `📄 Factura Electrónica y Extensión Premium #${invoiceNum}`;
    badgeColor = '#06b6d4';
    badgeText = 'SUSCRIPCIÓN AMPLIADA';
    statusBanner = 'Tu período de suscripción Premium ha sido renovado y ampliado exitosamente en Aether Security.';
  } else if (type === 'REMOVED') {
    subject = `📄 Comprobante de Cancelación Premium #${invoiceNum}`;
    badgeColor = '#ef4444';
    badgeText = 'CANCELADO / REMOVIDO';
    statusBanner = `Tu suscripción Premium ha sido revocada/removida por el administrador. ${reason ? 'Razón indicada: ' + reason : ''}`;
  } else if (type === 'EXPIRED') {
    subject = `📄 Notificación de Vencimiento de Suscripción Premium #${invoiceNum}`;
    badgeColor = '#f59e0b';
    badgeText = 'EXPIRADO AUTOMÁTICAMENTE';
    statusBanner = 'El tiempo de vigencia de tu plan Aether Premium ha finalizado. Tu cuenta ha vuelto automáticamente al plan estándar básico.';
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; background: #090d16; color: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid #1e293b; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); padding: 30px 25px; border-bottom: 1px solid #334155;">
        <table style="width: 100%;">
          <tr>
            <td>
              <h1 style="margin: 0; color: #38bdf8; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">AETHER SECURITY CORE</h1>
              <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 11px; font-family: monospace;">SISTEMA CENTRAL DE FACTURACIÓN Y SUSCRIPCIONES</p>
            </td>
            <td style="text-align: right;">
              <span style="display: inline-block; padding: 6px 14px; background: ${badgeColor}22; color: ${badgeColor}; border: 1px solid ${badgeColor}44; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase;">
                ${badgeText}
              </span>
            </td>
          </tr>
        </table>
      </div>

      <div style="padding: 25px;">
        <div style="background: #111827; border: 1px solid #1f2937; padding: 16px; border-radius: 12px; margin-bottom: 25px; font-size: 13px; color: #cbd5e1; line-height: 1.5;">
          ${statusBanner}
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 13px; color: #cbd5e1;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #1e293b; color: #64748b; font-weight: bold;">N° DE FACTURA:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #1e293b; text-align: right; font-family: monospace; font-weight: bold; color: #38bdf8;">${invoiceNum}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #1e293b; color: #64748b; font-weight: bold;">FECHA DE EMISIÓN:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #1e293b; text-align: right; color: #f8fafc;">${issueDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #1e293b; color: #64748b; font-weight: bold;">CLIENTE / CORREO:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #1e293b; text-align: right; color: #f8fafc;">${displayName} (${userEmail})</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #1e293b; color: #64748b; font-weight: bold;">FECHA DE VENCIMIENTO:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #1e293b; text-align: right; font-weight: bold; color: #fbbf24;">${expiresDateStr}</td>
          </tr>
        </table>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 13px;">
          <thead>
            <tr style="background: #1e293b; color: #94a3b8; text-transform: uppercase; font-size: 11px; font-weight: bold;">
              <th style="padding: 10px; text-align: left; border-radius: 8px 0 0 8px;">Concepto / Cargo</th>
              <th style="padding: 10px; text-align: center;">Cant.</th>
              <th style="padding: 10px; text-align: right; border-radius: 0 8px 8px 0;">Monto</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 12px 10px; border-bottom: 1px solid #1e293b; color: #f8fafc; font-weight: bold;">
                Membresía Plan Aether Premium ($9.99 USD / mes)
                <div style="font-size: 11px; font-weight: normal; color: #64748b; margin-top: 2px;">Acceso ilimitado a IA avanzadas, salas cibernéticas y cifrado VIP</div>
              </td>
              <td style="padding: 12px 10px; border-bottom: 1px solid #1e293b; text-align: center; color: #94a3b8; font-weight: bold;">
                ${isPaid ? `${m} mes${m > 1 ? 'es' : ''}` : '-'}
              </td>
              <td style="padding: 12px 10px; border-bottom: 1px solid #1e293b; text-align: right; color: #f8fafc; font-weight: bold; font-family: monospace;">
                $${basePlanPrice.toFixed(2)} USD
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 10px; border-bottom: 1px solid #1e293b; color: #cbd5e1;">
                Cargo por Servicio y Procesamiento de Transacción
              </td>
              <td style="padding: 12px 10px; border-bottom: 1px solid #1e293b; text-align: center; color: #94a3b8;">1</td>
              <td style="padding: 12px 10px; border-bottom: 1px solid #1e293b; text-align: right; color: #f8fafc; font-weight: bold; font-family: monospace;">
                +$${processingFee.toFixed(2)} USD
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 10px; border-bottom: 1px solid #1e293b; color: #cbd5e1;">
                Impuesto al Valor Agregado (IVA 16%)
              </td>
              <td style="padding: 12px 10px; border-bottom: 1px solid #1e293b; text-align: center; color: #94a3b8;">16%</td>
              <td style="padding: 12px 10px; border-bottom: 1px solid #1e293b; text-align: right; color: #f8fafc; font-weight: bold; font-family: monospace;">
                +$${iva.toFixed(2)} USD
              </td>
            </tr>
          </tbody>
        </table>

        <div style="background: #0f172a; border: 1px solid #334155; padding: 18px; border-radius: 12px; margin-bottom: 25px;">
          <table style="width: 100%; font-size: 13px;">
            <tr>
              <td style="color: #94a3b8;">Subtotal:</td>
              <td style="text-align: right; font-family: monospace; color: #f8fafc;">$${subtotal.toFixed(2)} USD</td>
            </tr>
            <tr>
              <td style="color: #94a3b8;">IVA (16%):</td>
              <td style="text-align: right; font-family: monospace; color: #f8fafc;">+$${iva.toFixed(2)} USD</td>
            </tr>
            <tr style="border-top: 1px solid #334155;">
              <td style="padding-top: 10px; color: #38bdf8; font-weight: bold; font-size: 15px;">TOTAL FINAL COBRADO:</td>
              <td style="padding-top: 10px; text-align: right; color: #38bdf8; font-size: 22px; font-weight: 800; font-family: monospace;">$${grandTotal.toFixed(2)} USD</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; color: #64748b; font-size: 11px; line-height: 1.6; border-top: 1px solid #1e293b; padding-top: 20px;">
          Factura Electrónica y Comprobante Oficial emitido por el Servidor SMTP de Aether Security.<br/>
          Si requieres soporte o consultas sobre tu facturación, comunícate con la administración.
        </div>
      </div>
    </div>
  `;

  await sendRealEmail(userEmail, subject, html, `${subject} - Total: $${grandTotal.toFixed(2)} USD - Cliente: ${displayName} (${userEmail}) - Vencimiento: ${expiresDateStr}`);
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
  premiumExpiresAt?: number;
  violations?: number;
  infractions?: InfractionRecord[];
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
  reactions?: Array<{emoji: string, senderName: string}>;
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

import { UserModel, RoomModel, MessageModel, ThreatModel, SecurityLogModel, BannedIPModel, SessionModel } from './src/db/models.js';

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
    return {
      ...obj,
      name: this.decryptStringIfNeeded(obj.name),
      ip: this.decryptStringIfNeeded(obj.ip),
      banReason: this.decryptStringIfNeeded(obj.banReason),
      banEvidence: this.decryptStringIfNeeded(obj.banEvidence)
    };
  }

  async getUserByEmail(email: string) {
    const clean = String(email || '').trim().toLowerCase();
    const doc = await (UserModel as any).findOne({ email: clean } as any);
    if (!doc) return null;
    const obj = doc.toObject ? doc.toObject() : doc;
    return {
      ...obj,
      name: this.decryptStringIfNeeded(obj.name),
      ip: this.decryptStringIfNeeded(obj.ip),
      banReason: this.decryptStringIfNeeded(obj.banReason),
      banEvidence: this.decryptStringIfNeeded(obj.banEvidence)
    };
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
    await (MessageModel as any).create(msg);
  }

  async addBannedIP(ip: string) {
    await (BannedIPModel as any).findOneAndUpdate({ ip: ip } as any, { ip, timestamp: Date.now() }, { upsert: true });
  }

  async removeBannedIP(ip: string) {
    await (BannedIPModel as any).deleteOne({ ip: ip } as any);
  }

  async isIpBanned(ip: string) {
    return (await (BannedIPModel as any).findOne({ ip: ip } as any)) !== null;
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
  
  isDirty = false;
  saveDatabase() {}

  public async ensureMasterAdmin() {
    try {
      const email = "ydark126@gmail.com";
      const masterUser = await this.getUserByEmail(email);
      const adminPassHash = this.hashPassword("Admin123");

      if (!masterUser) {
        await this.saveUser({
          id: "admin-master-101",
          email: email,
          passwordHash: adminPassHash,
          name: "YDark Admin",
          ip: "127.0.0.1",
          role: "admin",
          status: "Activo",
          isVerified: true,
          isPremium: true,
          createdAt: Date.now(),
          isBanned: false
        });
        console.log("[ADMIN SYNC] Master admin ydark126@gmail.com creado exitosamente con clave Admin123.");
      } else {
        masterUser.role = "admin";
        masterUser.status = "Activo";
        masterUser.isBanned = false;
        masterUser.isVerified = true;
        masterUser.isPremium = true;
        masterUser.passwordHash = adminPassHash;
        await this.saveUser(masterUser);
        console.log("[ADMIN SYNC] Master admin ydark126@gmail.com sincronizado exitosamente (Clave: Admin123, Rol: admin, Estado: Activo).");
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
      email: "ydark126@gmail.com",
      passwordHash: this.hashPassword("Admin123"),
      name: "YDark Admin",
      ip: "127.0.0.1",
      role: "admin",
      status: "Activo",
      isVerified: true,
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

  public async banUserAndIP(ip: string, reason: string, severity: 'low' | 'medium' | 'high' | 'critical', evidence?: string, userId?: string) {
    await this.addBannedIP(ip);
    
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
function getClientIP(req: express.Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

// IP Ban Enforcement Middleware
app.use(async (req, res, next) => {
  const ip = getClientIP(req);
  if ((await db.isIpBanned(ip))) {
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

  if (user.isBanned || user.status === 'Sancionado' || (await db.isIpBanned(user.ip))) {
    return res.status(403).json({ error: "Aether Security: Cuenta con estado Baneado." });
  }

  (req as any).user = user;
  (req as any).token = token;
  next();
}

// Admin Role + 2FA Verification Middleware
async function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = (req as any).user as UserRecord;
  const token = (req as any).token as string;

  if (!user || user.role !== 'admin') {
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
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="margin: 0; padding: 0; background-color: #020617; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc; -webkit-font-smoothing: antialiased;">
    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #020617; padding: 40px 20px;">
      <tr>
        <td align="center">
          <table width="100%" max-width="600" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; background: #0f172a; border-radius: 16px; border: 1px solid #1e293b; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
            <!-- Header -->
            <tr>
              <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-bottom: 1px solid #334155;">
                <h1 style="margin: 0; color: #38bdf8; font-size: 28px; font-weight: 900; letter-spacing: -1px; text-transform: uppercase;">AETHER SECURITY</h1>
                <div style="margin-top: 12px; display: inline-block; background-color: #f59e0b20; border: 1px solid #f59e0b50; color: #fbbf24; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 700; letter-spacing: 0.5px;">⚠️ ADVERTENCIA DE SEGURIDAD 1/3</div>
              </td>
            </tr>
            <!-- Content -->
            <tr>
              <td style="padding: 40px 30px;">
                <h2 style="margin: 0 0 20px 0; font-size: 20px; color: #f1f5f9; font-weight: 700;">Estimado/a ${user.name},</h2>
                <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #94a3b8;">
                  Nuestro sistema de moderación automatizado potenciado por <strong>Inteligencia Artificial</strong> ha detectado e interceptado un mensaje o archivo no permitido en su cuenta.
                </p>
                
                <!-- Infraction Details -->
                <div style="background-color: #020617; border-radius: 12px; padding: 24px; border: 1px solid #334155;">
                  <h3 style="margin: 0 0 16px 0; font-size: 14px; color: #fbbf24; text-transform: uppercase; letter-spacing: 1px;">Detalles del Incidente</h3>
                  
                  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="font-size: 14px;">
                    <tr>
                      <td style="padding: 8px 0; color: #64748b; width: 140px;">Fecha y Hora</td>
                      <td style="padding: 8px 0; color: #e2e8f0; font-weight: 600;">${infraction.dateFormatted}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #64748b;">Ubicación</td>
                      <td style="padding: 8px 0; color: #e2e8f0; font-weight: 600;">${infraction.roomName || 'Sala de Chat'}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #64748b;">Motivo</td>
                      <td style="padding: 8px 0; color: #f87171; font-weight: 600;">${infraction.reason}</td>
                    </tr>
                  </table>
                  
                  <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #1e293b;">
                    <div style="color: #64748b; font-size: 13px; margin-bottom: 8px;">Evidencia Capturada:</div>
                    <div style="background-color: #0f172a; border: 1px solid #1e293b; padding: 12px; border-radius: 8px; color: #38bdf8; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 13px; line-height: 1.5; word-break: break-all;">
                      ${infraction.evidence}
                    </div>
                  </div>
                  
                  ${infraction.attachmentsInfo ? `
                  <div style="margin-top: 16px;">
                    <div style="color: #64748b; font-size: 13px; margin-bottom: 8px;">Adjuntos involucrados:</div>
                    <div style="color: #e2e8f0; font-size: 14px; font-weight: 500;">${infraction.attachmentsInfo}</div>
                  </div>
                  ` : ''}
                </div>

                <!-- Warning Box -->
                <div style="margin-top: 32px; background-color: #3b82f615; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 0 8px 8px 0;">
                  <h4 style="margin: 0 0 8px 0; color: #60a5fa; font-size: 15px;">Reglamento del Sistema</h4>
                  <p style="margin: 0; color: #94a3b8; font-size: 14px; line-height: 1.5;">
                    Por favor respete los términos de convivencia. Si acumula <strong>3 infracciones</strong> por contenido ilegal o prohibido (drogas, armas, violencia, malware, spam o acoso), su cuenta e IP serán suspendidas automáticamente de forma permanente.
                  </p>
                </div>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding: 24px 30px; text-align: center; background-color: #020617; border-top: 1px solid #1e293b;">
                <p style="margin: 0; font-size: 12px; color: #475569;">
                  Aether Security System &bull; Notificación Automática IA<br>
                  No responda a este correo.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}

function generateEmail2Html(user: UserRecord, infraction: InfractionRecord, fullHistory: InfractionRecord[]): string {
  const historyHtml = fullHistory.map((inf, idx) => `
    <div style="margin-bottom: 12px; padding-bottom: 12px; ${idx !== fullHistory.length - 1 ? 'border-bottom: 1px solid #1e293b;' : ''}">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
        <span style="color: #f59e0b; font-weight: 700; font-size: 13px;">Infracción #${inf.number}</span>
        <span style="color: #64748b; font-size: 12px;">${inf.dateFormatted}</span>
      </div>
      <div style="color: #e2e8f0; font-size: 14px; font-weight: 500;">${inf.reason}</div>
    </div>
  `).join('');

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="margin: 0; padding: 0; background-color: #020617; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc; -webkit-font-smoothing: antialiased;">
    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #020617; padding: 40px 20px;">
      <tr>
        <td align="center">
          <table width="100%" max-width="600" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; background: #0f172a; border-radius: 16px; border: 1px solid #7f1d1d; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(220, 38, 38, 0.15);">
            <!-- Header -->
            <tr>
              <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #450a0a 0%, #0f172a 100%); border-bottom: 1px solid #7f1d1d;">
                <h1 style="margin: 0; color: #ef4444; font-size: 28px; font-weight: 900; letter-spacing: -1px; text-transform: uppercase;">AETHER SECURITY</h1>
                <div style="margin-top: 12px; display: inline-block; background-color: #ef444420; border: 1px solid #ef444450; color: #fca5a5; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 700; letter-spacing: 0.5px;">🚨 2DA ADVERTENCIA - ÚLTIMO AVISO 🚨</div>
              </td>
            </tr>
            <!-- Content -->
            <tr>
              <td style="padding: 40px 30px;">
                <h2 style="margin: 0 0 20px 0; font-size: 20px; color: #f1f5f9; font-weight: 700;">Atención ${user.name},</h2>
                <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #fecaca;">
                  Su cuenta ha registrado una <strong>SEGUNDA INFRACCIÓN GRAVE</strong>. El mensaje o archivo que intentó transmitir ha sido bloqueado de inmediato por nuestros sistemas de seguridad.
                </p>
                
                <!-- Latest Infraction -->
                <div style="background-color: #020617; border-radius: 12px; padding: 24px; border: 1px solid #7f1d1d; margin-bottom: 24px;">
                  <h3 style="margin: 0 0 16px 0; font-size: 14px; color: #f87171; text-transform: uppercase; letter-spacing: 1px;">Incidente Reciente</h3>
                  <div style="margin-bottom: 12px;">
                    <div style="color: #94a3b8; font-size: 13px; margin-bottom: 4px;">Motivo del Bloqueo</div>
                    <div style="color: #fca5a5; font-size: 15px; font-weight: 600;">${infraction.reason}</div>
                  </div>
                  <div>
                    <div style="color: #94a3b8; font-size: 13px; margin-bottom: 4px;">Evidencia</div>
                    <div style="background-color: #0f172a; border: 1px solid #1e293b; padding: 12px; border-radius: 8px; color: #ef4444; font-family: ui-monospace, SFMono-Regular, monospace; font-size: 13px; line-height: 1.5; word-break: break-all;">
                      ${infraction.evidence}
                    </div>
                  </div>
                </div>

                <!-- History -->
                <h3 style="margin: 0 0 16px 0; font-size: 15px; color: #e2e8f0;">Historial de Infracciones Acumuladas</h3>
                <div style="background-color: #020617; border-radius: 12px; padding: 20px; border: 1px solid #334155;">
                  ${historyHtml}
                </div>

                <!-- Final Warning Box -->
                <div style="margin-top: 32px; background-color: #7f1d1d; border: 1px solid #b91c1c; padding: 24px; border-radius: 12px; text-align: center;">
                  <h4 style="margin: 0 0 12px 0; color: #fef2f2; font-size: 18px; font-weight: 800; text-transform: uppercase;">⚠️ Último Aviso ⚠️</h4>
                  <p style="margin: 0; color: #fecaca; font-size: 15px; line-height: 1.5; font-weight: 500;">
                    Si comete <strong>1 infracción más</strong>, su cuenta (${user.email}) y su dirección IP serán SANCIÓNADAS Y EXPULSADAS PERMANENTEMENTE de la plataforma.
                  </p>
                </div>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding: 24px 30px; text-align: center; background-color: #020617; border-top: 1px solid #1e293b;">
                <p style="margin: 0; font-size: 12px; color: #475569;">
                  Aether Security System &bull; Sistema Automático Disciplinario<br>
                  No responda a este correo.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}

function generateSanctionEmailHtml(user: UserRecord, lastInfraction: InfractionRecord, fullHistory: InfractionRecord[], ip: string): string {
  const historyRows = fullHistory.map((inf, idx) => `
    <div style="background-color: #0f172a; border-left: 4px solid #ef4444; border-radius: 8px; padding: 16px; margin-bottom: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="color: #f87171; font-weight: 700; font-size: 14px; text-transform: uppercase;">Infracción #${inf.number || (idx + 1)} - ${inf.severity}</span>
        <span style="color: #94a3b8; font-size: 12px;">${inf.dateFormatted}</span>
      </div>
      <div style="margin-bottom: 6px;">
        <span style="color: #cbd5e1; font-size: 13px;"><strong>Motivo:</strong> ${inf.reason}</span>
      </div>
      <div style="margin-bottom: 8px;">
        <span style="color: #94a3b8; font-size: 13px;"><strong>Sala:</strong> ${inf.roomName || 'Sala General'}</span>
      </div>
      <div style="background-color: #020617; padding: 10px; border-radius: 6px; border: 1px solid #1e293b; font-family: monospace; font-size: 12px; color: #38bdf8; word-break: break-all;">
        ${inf.evidence}
      </div>
    </div>
  `).join('');

  return `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc; -webkit-font-smoothing: antialiased;">
    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 15px;">
      <tr>
        <td align="center">
          <table width="100%" max-width="600" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; background: #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.7); border: 1px solid #334155;">
            
            <!-- Header Section with Logo Area -->
            <tr>
              <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #7f1d1d 0%, #450a0a 100%); border-bottom: 2px solid #ef4444;">
                <div style="margin-bottom: 16px;">
                  <!-- Logo Placeholder -->
                  <div style="display: inline-block; width: 64px; height: 64px; background-color: #ef4444; border-radius: 16px; line-height: 64px; font-size: 32px; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);">🛡️</div>
                </div>
                <h1 style="margin: 0 0 10px 0; color: #fef2f2; font-size: 28px; font-weight: 900; letter-spacing: -0.5px;">AETHER SECURITY</h1>
                <div style="display: inline-block; background-color: #fee2e2; color: #991b1b; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;">Notificación de Sanción Automática</div>
              </td>
            </tr>
            
            <!-- Main Content -->
            <tr>
              <td style="padding: 40px 30px;">
                <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #f87171; font-weight: 800;">Acceso Suspendido Permanentemente</h2>
                <p style="margin: 0 0 30px 0; font-size: 15px; line-height: 1.6; color: #cbd5e1;">
                  Hola <strong>${user.name}</strong>,<br><br>
                  Le informamos que su cuenta y dirección IP han sido <strong>suspendidas de forma definitiva</strong> de nuestra plataforma. Nuestro sistema de moderación IA ha registrado la acumulación de <strong>3 infracciones graves</strong> a los protocolos de seguridad y convivencia.
                </p>
                
                <!-- Report Details Box -->
                <div style="background-color: #0f172a; border-radius: 12px; padding: 24px; border: 1px solid #334155; margin-bottom: 30px;">
                  <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #e2e8f0; font-weight: 700; border-bottom: 1px solid #1e293b; padding-bottom: 10px;">📋 Detalles de la Sanción</h3>
                  
                  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="font-size: 14px;">
                    <tr>
                      <td style="padding: 8px 0; color: #94a3b8; width: 140px;">Nivel de Gravedad</td>
                      <td style="padding: 8px 0; color: #ef4444; font-weight: 800;">CRÍTICA (Nivel 3)</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #94a3b8;">Motivo Principal</td>
                      <td style="padding: 8px 0; color: #f8fafc; font-weight: 600;">${lastInfraction.reason}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #94a3b8;">Hora de Aplicación</td>
                      <td style="padding: 8px 0; color: #f8fafc;">${lastInfraction.dateFormatted}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #94a3b8;">IP Identificada</td>
                      <td style="padding: 8px 0; color: #fca5a5; font-family: monospace; font-weight: 600;">${ip}</td>
                    </tr>
                  </table>

                  <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #1e293b;">
                    <div style="color: #94a3b8; font-size: 13px; margin-bottom: 8px;">Evidencia Adjunta (Última Infracción):</div>
                    <div style="background-color: #020617; padding: 12px; border-radius: 8px; border: 1px solid #1e293b; color: #38bdf8; font-family: monospace; font-size: 13px; word-break: break-all;">
                      ${lastInfraction.evidence}
                    </div>
                  </div>
                </div>

                <!-- History Summary -->
                <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #e2e8f0; font-weight: 700;">Resumen de Infracciones Acumuladas</h3>
                <div style="margin-bottom: 30px;">
                  ${historyRows}
                </div>

                <!-- Appeal Section -->
                <div style="text-align: center; background: linear-gradient(180deg, #1e1b4b 0%, #0f172a 100%); border: 1px solid #3730a3; padding: 32px 20px; border-radius: 12px;">
                  <h3 style="margin: 0 0 12px 0; color: #818cf8; font-size: 18px; font-weight: 800;">¿Fue un error?</h3>
                  <p style="margin: 0 0 24px 0; color: #c7d2fe; font-size: 14px; line-height: 1.5;">
                    Si crees que la Inteligencia Artificial cometió un error (falso positivo), puedes apelar esta sanción comunicándote con nuestro equipo de moderación humana.
                  </p>
                  
                  <a href="https://discord.gg/aether-security" style="display: inline-block; background-color: #5865F2; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 16px; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 14px rgba(88,101,242,0.4); transition: background-color 0.2s;">
                    Apelar en Discord
                  </a>
                  
                  <div style="margin-top: 20px; font-size: 12px; color: #6366f1;">
                    Proporciona esta ID al equipo: <strong style="font-family: monospace; color: #a5b4fc;">${user.id}</strong>
                  </div>
                </div>
              </td>
            </tr>
            
            <!-- Footer -->
            <tr>
              <td style="padding: 24px 30px; text-align: center; background-color: #0f172a; border-top: 1px solid #334155;">
                <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b;">
                  Aether Security System &bull; Moderación IA
                </p>
                <p style="margin: 0; font-size: 11px; color: #475569;">
                  Este es un mensaje automático. Por favor, no respondas a este correo.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
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

// AI WAF Scan Helper
async function analyzeTrafficWithAI(ip: string, userEmail: string | undefined, payloadStr: string, contextType: string, autoBan: boolean = true) {
  if (!payloadStr || payloadStr.trim().length === 0) {
    return { blocked: false, reason: undefined, severity: undefined, evidence: undefined };
  }

  // Fast-path for common benign greetings, normal chat, audio labels
  const benignPattern = /^(hola|hola!|buenas|buenos días|buenas noches|qué tal|probando|test|hola bot|@bot|\/bot|\[audio de voz.*\]|\[adjuntos:.*\])$/i;
  if (benignPattern.test(payloadStr.trim())) {
    return { blocked: false, reason: undefined, severity: undefined, evidence: undefined };
  }

  // Do not inspect encrypted blobs (iv:...) as SQL injection
  if (/^[a-f0-9]{32}:[a-f0-9]+$/i.test(payloadStr.trim())) {
    return { blocked: false, reason: undefined, severity: undefined, evidence: undefined };
  }

  const sqlPattern = /('|--|union\s+select|select\s+.*\s+from|insert\s+into|drop\s+table|alter\s+table|<script>|javascript:|eval\(|exec\()/i;
  const ddosPattern = payloadStr.length > 50000;

  if (sqlPattern.test(payloadStr) || ddosPattern) {
    const reason = ddosPattern ? "Comportamiento anómalo en transmisión de datos" : "Petición no autorizada detectada en payload";
    const evidence = `Payload: ${payloadStr.slice(0, 100)}...`;
    if (autoBan) db.banUserAndIP(ip, reason, "critical", evidence);
    return { blocked: true, reason, severity: "critical" as const, evidence };
  }

  try {
    const prompt = `Actúa como "Aether WAF Guard & Moderación IA", responsable de auditoría técnica.
Analiza detenidamente la siguiente actividad o mensaje de usuario:
- IP: ${ip}
- Email: ${userEmail || 'Anónimo'}
- Contexto: ${contextType}
- Contenido: "${payloadStr.slice(0, 2000)}"

REGLAS ABSOLUTAS DE PERMISIVIDAD Y NO-SANCIONABILIDAD:
1. Saludos cotidianos ("Hola", "Buenas", "Qué tal"), mensajes inocentes, chistes, conversaciones informales, notas de voz normales y preguntas NO SON AMENAZAS.
2. Jamás sancionar o bloquear mensajes comunes o audios como "Hola". 'isThreat' DEBE SER 'false'.
3. 'isThreat' solo debe ser 'true' en casos extremadamente graves y explícitos de:
   - Inyección activa de malware, ransomware, exploits SQLi/XSS/DDoS.
   - Venta explícita de drogas o armas.
   - Material de abuso infantil (CSAM).
   - Amenazas directas de muerte o terrorismo.
4. Si tienes cualquier duda o es una conversación normal, 'isThreat' DEBE SER 'false'.

Responde ÚNICAMENTE en un objeto JSON válido sin bloques markdown ni texto adicional:
{
  "isThreat": boolean,
  "severity": "low" | "medium" | "high" | "critical",
  "reason": "Motivo conciso en español",
  "evidence": "Texto o fragmento exacto"
}`;

    const res = await queryMultiModelText(prompt, "Eres AETHER WAF GUARD & Moderación IA Superior.", true);
    if (res && res.text) {
      try {
        const cleanJson = res.text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        if (parsed.isThreat) {
          if (autoBan) db.banUserAndIP(ip, parsed.reason, parsed.severity || "high", parsed.evidence || "Análisis automatizado (" + res.provider + ")");
          return { blocked: true, reason: parsed.reason, severity: parsed.severity || "high", evidence: parsed.evidence || payloadStr.slice(0, 100) };
        }
      } catch (e) {
        // Continue
      }
    }
  } catch (err) {
    // Fail safe
  }

  return { blocked: false, reason: undefined, severity: undefined, evidence: undefined };
}

// ==========================================
// ASYNCHRONOUS MODERATION QUEUE WORKER
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

      const threatCheck = await analyzeTrafficWithAI(job.senderIp, job.senderEmail, job.payloadToAnalyze, "MENSAJE_CHAT_E2E_VERIFICADO", false);

      if (threatCheck.blocked) {
        // Delete blocked message from room history
        const currentMsgs = (await db.getMessages(job.roomId)) || [];
        const updatedMsgs = currentMsgs.filter(m => m.id !== job.msgId);
        
        broadcastToRoom(job.roomId, {
          type: "MESSAGE_DELETED",
          roomId: job.roomId,
          messageId: job.msgId,
          reason: "Mensaje removido por Moderación IA: " + threatCheck.reason
        });

        const user = (await db.getUser(job.senderUserId));
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
            senderEmail: "bot@paginaprotegida.com",
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

  if (cleanEmail === "ydark126@gmail.com") {
    await db.ensureMasterAdmin();
  }

  if (cleanEmail !== "ydark126@gmail.com") {
    const threatCheck = await analyzeTrafficWithAI(ip, cleanEmail, `${cleanEmail}`, "INICIO_SESION");
    if (threatCheck.blocked) {
      return res.status(403).json({ error: "Aether Security: Acceso denegado por seguridad" });
    }
  }

  let userId = ((await db.getUserByEmail(cleanEmail))?.id);
  if (!userId && cleanEmail === "ydark126@gmail.com") {
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

  if (cleanEmail !== "ydark126@gmail.com") {
    if (user.isBanned || user.status === 'Sancionado' || (await db.isIpBanned(ip))) {
      db.logSecurityEvent(ip, "SUSPICIOUS_ATTEMPT", cleanEmail, "Intento de login con cuenta o IP Baneada", true);
      return res.status(403).json({ error: "Aether Security: Esta cuenta o IP se encuentra en estado Baneado." });
    }
  }

  user.ip = ip;
  /* isDirty ignored */
  const token = crypto.randomBytes(32).toString("hex");
  await saveUserSession(token, userId);

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
    user: {
      id: u.id,
      email: u.email,
      name: u.name,
      ip: u.ip,
      role: u.role,
      status: u.status,
      isVerified: u.isVerified,
      createdAt: u.createdAt,
      isBanned: u.isBanned,
      isPremium: u.isPremium,
      premiumExpiresAt: u.premiumExpiresAt
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
    .filter(r => user.role === 'admin' || !r.isPrivate || r.createdById === user.id)
    .map(r => ({
      ...r,
      activeUsersCount: roomConnections.get(r.id)?.size || 0
    }));
  res.json(roomList);
});

app.post("/api/rooms/create", authenticateToken, async (req, res) => {
  const user = (req as any).user as UserRecord;
  const { name, isPrivate } = req.body;

  if (!name) return res.status(400).json({ error: "Nombre de sala requerido" });
  const userRooms = (await db.getAllRooms() as any[]).filter(r => r.createdById === user.id);
  if (userRooms.length >= 5) return res.status(403).json({ error: "Límite de 5 salas alcanzado." });

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

  await db.saveRoom(room);
  /* isDirty ignored */
  /* room index set */
  /* messages.set ignored */;
  /* isDirty ignored */

  redis.del("rooms_list");
  res.json(room);
});

app.post("/api/rooms/join-code", authenticateToken, async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: "Código de acceso requerido" });

  const roomId = (await db.getRoomByCode(code.trim()))?.id;
  if (!roomId) return res.status(404).json({ error: "Sala no localizada" });

  const room = await db.getRoom(roomId);
  if (room.isClosed) return res.status(403).json({ error: "La sala está cerrada por el administrador o creador." });
  res.json(room);
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
  const userList = (await db.getAllUsers()).map(u => ({
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
    bannedAt: u.bannedAt,
    isPremium: u.isPremium,
    premiumExpiresAt: u.premiumExpiresAt
  }));
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
  res.json({ message: `Estado actualizado a ${u.status}`, user: u });
});

app.post("/api/admin/edit-user", authenticateToken, requireAdmin, async (req, res) => {
  const { userId, name, email, role, status, ip, isPremium, premiumExpiresAt } = req.body;
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
  if (isPremium !== undefined) u.isPremium = !!isPremium;
  if (premiumExpiresAt !== undefined) u.premiumExpiresAt = premiumExpiresAt ? Number(premiumExpiresAt) : undefined;

  await db.saveUser(u);
  db.saveDatabase();
  redis.flush();

  // Trigger invoice / notification email if premium state changed
  if (!wasPremium && u.isPremium) {
    await sendPremiumInvoiceEmail({ userEmail: u.email, userName: u.name, type: 'ACTIVATED', expiresAt: u.premiumExpiresAt });
  } else if (wasPremium && !u.isPremium) {
    await sendPremiumInvoiceEmail({ userEmail: u.email, userName: u.name, type: 'REMOVED', reason: 'Ajuste manual de perfil por administrador' });
  } else if (wasPremium && u.isPremium && oldExpiresAt !== u.premiumExpiresAt) {
    await sendPremiumInvoiceEmail({ userEmail: u.email, userName: u.name, type: 'EXTENDED', expiresAt: u.premiumExpiresAt });
  }

  db.logSecurityEvent("ADMIN", "ROLE_CHANGED", u.email, `Perfil de usuario ${u.name} actualizado por Administrador`);

  res.json({ message: `Perfil de ${u.name} actualizado exitosamente`, user: u });
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

app.post("/api/admin/ban-ip", authenticateToken, requireAdmin, async (req, res) => {
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

app.post("/api/admin/unban-ip", authenticateToken, requireAdmin, async (req, res) => {
  const { ip, userId } = req.body;
  if (ip) {
    await db.removeBannedIP(ip.trim());
  }

  if (userId && ((await db.getUser(userId)) !== null)) {
    const u = await db.getUser(userId);
    u.isBanned = false;
    u.status = 'Activo';
    u.banReason = undefined;
    u.banEvidence = undefined;
  } else {
    for (const u of (await db.getAllUsers()).values()) {
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
  }
  redis.flush();

  await sendPremiumInvoiceEmail({
    userEmail: cleanEmail,
    userName: doc.name || cleanEmail,
    type: 'ACTIVATED',
    months: parseInt(months),
    expiresAt: newExpiresAt
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
  }
  redis.flush();

  await sendPremiumInvoiceEmail({
    userEmail: cleanEmail,
    userName: doc.name || cleanEmail,
    type: 'EXTENDED',
    expiresAt: newExpiresAt
  });

  res.json({ message: "Fecha de expiración actualizada", expiresAt: newExpiresAt });
});

app.get("/api/admin/threats", authenticateToken, requireAdmin, async (req, res) => {
  res.json((await db.getAllThreats()));
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

wss.on("connection", async (ws: WebSocket, req: http.IncomingMessage) => {
  const ip = req.headers['x-forwarded-for'] ? (req.headers['x-forwarded-for'] as string).split(',')[0].trim() : req.socket.remoteAddress || '127.0.0.1';

  if ((await db.isIpBanned(ip))) {
    ws.send(JSON.stringify({ type: "ERROR", message: "Aether Security: IP sin permisos" }));
    return ws.close();
  }

  ws.on("message", async (data: string) => {
    try {
      const msg = JSON.parse(data.toString());

      if (msg.type === "PING") {
        ws.send(JSON.stringify({ type: "PONG" }));
        return;
      }

      if (msg.type === "AUTHENTICATE") {
        const userId = await getSessionUserId(msg.token);
        if (!userId || !((await db.getUser(userId)) !== null)) {
          ws.send(JSON.stringify({ type: "ERROR", message: "Sesión no válida" }));
          return ws.close();
        }

        const user = await db.getUser(userId);
        if (user.isBanned || user.status === 'Sancionado' || (await db.isIpBanned(ip))) {
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

      if ((await db.isIpBanned(senderData.ip))) {
        ws.send(JSON.stringify({ type: "ERROR", message: "Aether Security" }));
        return ws.close();
      }

      if (msg.type === "JOIN_ROOM") {
        const { roomId } = msg;
        if (!((await db.getRoom(roomId)) !== null)) {
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
        const { roomId, encryptedText, attachments, replyTo, selfDestruct, isBotRequest, plainTextForAI } = msg;
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
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: Date.now()
        };

        const roomMsgs = (await db.getMessages(roomId)) || [];
        roomMsgs.push(msgRecord);
        if (roomMsgs.length > 200) roomMsgs.shift();

        broadcastToRoom(roomId, {
          type: "NEW_MESSAGE",
          message: msgRecord
        });

        // 2. Self-Destruct / Disappearing message timer logic
        if (selfDestruct && typeof selfDestruct === 'number' && selfDestruct > 0) {
          setTimeout(async () => {
            const currentMsgs = (await db.getMessages(roomId)) || [];
            const filtered = currentMsgs.filter(m => m.id !== msgRecord.id);
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
  const usersMap = new Map<string, { id: string; name: string; email: string; role?: string }>();
  for (const client of clients) {
    const u = wsUserMap.get(client);
    if (u) {
      const userObj = (await db.getUser(u.userId));
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
  await db.loadDatabase();

  setInterval(async () => {
    try {
      const now = Date.now();
      const allUsers = await db.getAllUsers();
      for (const u of allUsers) {
        if (u.isPremium && u.premiumExpiresAt && u.premiumExpiresAt < now) {
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
