const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const buildAetherEmailCode = `
// ==========================================
// AETHER EMAIL TEMPLATE SYSTEM
// ==========================================
function buildAetherEmail(title, subtitle, contentHtml, colorHex = '#0ea5e9') {
  return \`
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="margin: 0; padding: 0; background-color: #030303; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f8fafc; -webkit-font-smoothing: antialiased;">
    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #030303; padding: 60px 20px;">
      <tr>
        <td align="center">
          <table width="100%" max-width="600" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; background: #0c0c0f; border-radius: 24px; border: 1px solid #1a1a20; overflow: hidden; box-shadow: 0 40px 80px -20px rgba(0, 0, 0, 0.8), 0 0 40px -10px \${colorHex}30;">
            <!-- Header -->
            <tr>
              <td style="padding: 40px 40px 30px 40px; text-align: center; border-bottom: 1px solid #1a1a20; background: radial-gradient(circle at top, \${colorHex}15 0%, transparent 70%);">
                <div style="margin-bottom: 24px; display: inline-block;">
                  <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #18181b, #09090b); border: 1px solid #27272a; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto; box-shadow: inset 0 2px 10px rgba(255,255,255,0.05), 0 10px 20px rgba(0,0,0,0.5);">
                    <span style="font-size: 24px; color: \${colorHex};">✦</span>
                  </div>
                </div>
                <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 800; letter-spacing: -1px; text-transform: uppercase;">AETHER SECURITY</h1>
                <div style="margin-top: 16px; display: inline-block; background-color: \${colorHex}15; border: 1px solid \${colorHex}40; color: \${colorHex}; padding: 6px 16px; border-radius: 100px; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">\${subtitle}</div>
              </td>
            </tr>
            <!-- Content -->
            <tr>
              <td style="padding: 40px;">
                <h2 style="margin: 0 0 20px 0; font-size: 20px; color: #f8fafc; font-weight: 700; letter-spacing: -0.5px;">\${title}</h2>
                \${contentHtml}
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding: 30px 40px; text-align: center; background-color: #070709; border-top: 1px solid #1a1a20;">
                <p style="margin: 0; font-size: 12px; color: #52525b; line-height: 1.6;">
                  <strong>Aether Security Network</strong><br>
                  Infraestructura de protección avanzada.<br>
                  Este mensaje fue generado automáticamente, no responda a este correo.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>\`;
}
`;


// Replace the infraction templates
const infractionRegex = /\/\/ HTML Email Templates for Infraction Warnings & Sanction Reports\s+function generateEmail1Html.*?function generateSanctionEmailHtml.*?\n\s+return `.*?`;\n}/s;

let newInfractionTemplates = `// HTML Email Templates for Infraction Warnings & Sanction Reports
function generateEmail1Html(user: UserRecord, infraction: InfractionRecord): string {
  const content = \`
    <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #a1a1aa;">
      Nuestro sistema de moderación automatizado ha detectado e interceptado un mensaje o archivo no permitido en su cuenta.
    </p>
    <div style="background-color: #0c0c0f; border-radius: 16px; padding: 24px; border: 1px solid #27272a;">
      <h3 style="margin: 0 0 16px 0; font-size: 12px; color: #f59e0b; text-transform: uppercase; letter-spacing: 2px;">Detalles del Incidente</h3>
      <div style="display: grid; gap: 12px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #1a1a20; padding-bottom: 8px;">
          <span style="color: #52525b; font-size: 13px;">Fecha</span>
          <span style="color: #e4e4e7; font-size: 13px; font-weight: 600;">\${infraction.dateFormatted}</span>
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #1a1a20; padding-bottom: 8px;">
          <span style="color: #52525b; font-size: 13px;">Ubicación</span>
          <span style="color: #e4e4e7; font-size: 13px; font-weight: 600;">\${infraction.roomName || 'Sala de Chat'}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #52525b; font-size: 13px;">Motivo</span>
          <span style="color: #fbbf24; font-size: 13px; font-weight: 600;">\${infraction.reason}</span>
        </div>
      </div>
      <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #1a1a20;">
        <div style="color: #52525b; font-size: 12px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px;">Evidencia Capturada</div>
        <div style="background-color: #050505; border: 1px solid #1a1a20; padding: 16px; border-radius: 12px; color: #0ea5e9; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 13px; line-height: 1.5; word-break: break-all;">
          \${infraction.evidence}
        </div>
      </div>
    </div>
    <div style="margin-top: 32px; background-color: #f59e0b10; border: 1px solid #f59e0b30; padding: 20px; border-radius: 16px;">
      <h4 style="margin: 0 0 8px 0; color: #fbbf24; font-size: 14px;">Reglamento del Sistema</h4>
      <p style="margin: 0; color: #a1a1aa; font-size: 13px; line-height: 1.6;">
        Por favor respete los términos de convivencia. Si acumula <strong>3 infracciones</strong> por contenido ilegal o prohibido, su cuenta e IP serán suspendidas automáticamente de forma permanente.
      </p>
    </div>
  \`;
  return buildAetherEmail(\`Estimado/a \${user.name}\`, "⚠️ ADVERTENCIA 1/3", content, "#f59e0b");
}

function generateEmail2Html(user: UserRecord, infraction: InfractionRecord, fullHistory: InfractionRecord[]): string {
  const historyHtml = fullHistory.map((inf, idx) => \`
    <div style="margin-bottom: 16px; padding-bottom: 16px; \${idx !== fullHistory.length - 1 ? 'border-bottom: 1px solid #1a1a20;' : ''}">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
        <span style="color: #f43f5e; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Infracción #\${inf.number}</span>
        <span style="color: #52525b; font-size: 12px;">\${inf.dateFormatted}</span>
      </div>
      <div style="color: #e4e4e7; font-size: 14px; font-weight: 500;">\${inf.reason}</div>
    </div>
  \`).join('');

  const content = \`
    <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #fecdd3;">
      Su cuenta ha registrado una <strong>SEGUNDA INFRACCIÓN GRAVE</strong>. El mensaje o archivo que intentó transmitir ha sido bloqueado de inmediato.
    </p>
    <div style="background-color: #0c0c0f; border-radius: 16px; padding: 24px; border: 1px solid #ef444450; margin-bottom: 24px; box-shadow: 0 10px 30px -10px rgba(239,68,68,0.1);">
      <h3 style="margin: 0 0 16px 0; font-size: 12px; color: #ef4444; text-transform: uppercase; letter-spacing: 2px;">Incidente Reciente</h3>
      <div style="margin-bottom: 16px;">
        <div style="color: #52525b; font-size: 12px; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px;">Motivo del Bloqueo</div>
        <div style="color: #fca5a5; font-size: 14px; font-weight: 600;">\${infraction.reason}</div>
      </div>
      <div>
        <div style="color: #52525b; font-size: 12px; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px;">Evidencia</div>
        <div style="background-color: #050505; border: 1px solid #3f3f46; padding: 16px; border-radius: 12px; color: #ef4444; font-family: ui-monospace, SFMono-Regular, monospace; font-size: 13px; line-height: 1.5; word-break: break-all;">
          \${infraction.evidence}
        </div>
      </div>
    </div>
    <h3 style="margin: 0 0 16px 0; font-size: 14px; color: #e4e4e7;">Historial de Infracciones</h3>
    <div style="background-color: #050505; border-radius: 16px; padding: 24px; border: 1px solid #27272a;">
      \${historyHtml}
    </div>
    <div style="margin-top: 32px; background: linear-gradient(135deg, #7f1d1d, #450a0a); border: 1px solid #b91c1c; padding: 24px; border-radius: 16px; text-align: center;">
      <h4 style="margin: 0 0 12px 0; color: #fef2f2; font-size: 16px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">⚠️ Último Aviso ⚠️</h4>
      <p style="margin: 0; color: #fecaca; font-size: 14px; line-height: 1.6; font-weight: 500;">
        Si comete <strong>1 infracción más</strong>, su cuenta (\${user.email}) y su dirección IP serán SUSPENDIDAS Y EXPULSADAS PERMANENTEMENTE.
      </p>
    </div>
  \`;
  return buildAetherEmail(\`Atención \${user.name}\`, "🚨 2DA ADVERTENCIA - ÚLTIMO AVISO", content, "#ef4444");
}

function generateSanctionEmailHtml(user: UserRecord, lastInfraction: InfractionRecord, fullHistory: InfractionRecord[], ip: string): string {
  const historyRows = fullHistory.map((inf, idx) => \`
    <div style="background-color: #0c0c0f; border-left: 4px solid #ef4444; border-radius: 12px; padding: 20px; margin-bottom: 16px; border-top: 1px solid #27272a; border-right: 1px solid #27272a; border-bottom: 1px solid #27272a;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <span style="color: #f87171; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Infracción #\${inf.number || (idx + 1)} - \${inf.severity}</span>
        <span style="color: #52525b; font-size: 12px;">\${inf.dateFormatted}</span>
      </div>
      <div style="margin-bottom: 8px;">
        <span style="color: #a1a1aa; font-size: 13px;"><strong>Motivo:</strong> \${inf.reason}</span>
      </div>
      <div style="margin-bottom: 12px;">
        <span style="color: #52525b; font-size: 13px;"><strong>Sala:</strong> \${inf.roomName || 'Sala General'}</span>
      </div>
      <div style="background-color: #050505; padding: 12px; border-radius: 8px; border: 1px solid #1a1a20; font-family: monospace; font-size: 12px; color: #ef4444; word-break: break-all;">
        \${inf.evidence}
      </div>
    </div>
  \`).join('');

  const content = \`
    <p style="margin: 0 0 32px 0; font-size: 15px; line-height: 1.6; color: #e4e4e7;">
      Le informamos que su cuenta y dirección IP han sido <strong>suspendidas de forma definitiva</strong> de nuestra plataforma. Nuestro sistema de moderación IA ha registrado la acumulación de <strong>3 infracciones graves</strong> a los protocolos de seguridad.
    </p>
    <div style="background-color: #050505; border-radius: 16px; padding: 24px; border: 1px solid #27272a; margin-bottom: 32px;">
      <h3 style="margin: 0 0 20px 0; font-size: 14px; color: #e4e4e7; font-weight: 700; border-bottom: 1px solid #1a1a20; padding-bottom: 12px; text-transform: uppercase; letter-spacing: 1px;">📋 Detalles de la Sanción</h3>
      <div style="display: grid; gap: 12px;">
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #1a1a20; padding-bottom: 8px;">
          <span style="color: #52525b; font-size: 13px;">Nivel de Gravedad</span>
          <span style="color: #ef4444; font-size: 13px; font-weight: 800;">CRÍTICA (Nivel 3)</span>
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #1a1a20; padding-bottom: 8px;">
          <span style="color: #52525b; font-size: 13px;">Cuenta Afectada</span>
          <span style="color: #e4e4e7; font-size: 13px; font-weight: 600;">\${user.email}</span>
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #1a1a20; padding-bottom: 8px;">
          <span style="color: #52525b; font-size: 13px;">Dirección IP</span>
          <span style="color: #e4e4e7; font-size: 13px; font-weight: 600;">\${ip}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #52525b; font-size: 13px;">Motivo Principal</span>
          <span style="color: #f87171; font-size: 13px; font-weight: 600; max-width: 60%; text-align: right;">Acumulación de Infracciones - \${lastInfraction.reason}</span>
        </div>
      </div>
    </div>
    <h3 style="margin: 0 0 16px 0; font-size: 14px; color: #e4e4e7; text-transform: uppercase; letter-spacing: 1px;">Historial Completo</h3>
    \${historyRows}
  \`;
  return buildAetherEmail(\`Acceso Suspendido\`, "⛔ SANCIÓN DEFINITIVA", content, "#ef4444");
}`;

code = code.replace(infractionRegex, newInfractionTemplates);

// Replace auth/send-code embedded email
const sendCodeRegex = /app\.post\("\/api\/auth\/send-code".*?const htmlTemplate = `.*?`;/s;
code = code.replace(sendCodeRegex, (match) => {
  return match.replace(/const htmlTemplate = `.*?`;/s, `const htmlTemplate = buildAetherEmail(\`Código de Verificación\`, "AUTENTICACIÓN", \`
    <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #a1a1aa;">
      Has solicitado un código para verificar tu identidad en Aether Security. Usa el siguiente código para continuar:
    </p>
    <div style="background: linear-gradient(135deg, #0f172a, #020617); border: 1px solid #1e293b; border-radius: 16px; padding: 32px 20px; text-align: center; margin-bottom: 32px; box-shadow: inset 0 2px 10px rgba(0,0,0,0.5);">
      <span style="font-family: 'Courier New', monospace; font-size: 42px; font-weight: 900; letter-spacing: 8px; color: #38bdf8; text-shadow: 0 0 20px rgba(56,189,248,0.4);">\${code}</span>
    </div>
    <div style="border-t: 1px solid #1a1a20; padding-top: 20px; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #52525b;">Este código expira en 10 minutos.<br>Si no lo solicitaste, puedes ignorarlo de forma segura.</p>
    </div>
  \`, "#38bdf8");`);
});

// Replace auth/forgot-password embedded email
const forgotRegex = /app\.post\("\/api\/auth\/forgot-password".*?const htmlTemplate = `.*?`;/s;
code = code.replace(forgotRegex, (match) => {
  return match.replace(/const htmlTemplate = `.*?`;/s, `const htmlTemplate = buildAetherEmail(\`Recuperación de Contraseña\`, "RESTABLECER ACCESO", \`
    <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #a1a1aa;">
      Hemos recibido una solicitud para cambiar tu contraseña en Aether Security.
    </p>
    <div style="background: linear-gradient(135deg, #2e1065, #0f172a); border: 1px solid #4c1d95; border-radius: 16px; padding: 32px 20px; text-align: center; margin-bottom: 32px; box-shadow: inset 0 2px 10px rgba(0,0,0,0.5);">
      <span style="font-family: 'Courier New', monospace; font-size: 42px; font-weight: 900; letter-spacing: 8px; color: #a78bfa; text-shadow: 0 0 20px rgba(167,139,250,0.4);">\${code}</span>
    </div>
    <div style="border-t: 1px solid #1a1a20; padding-top: 20px; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #52525b;">Este código expira en 10 minutos.<br>Si no solicitaste este cambio, ignora este correo.</p>
    </div>
  \`, "#8b5cf6");`);
});

// Replace admin-login-step1 embedded email
const admin2FARegex = /app\.post\("\/api\/auth\/admin-login-step1".*?const htmlTemplate = `.*?`;/s;
code = code.replace(admin2FARegex, (match) => {
  return match.replace(/const htmlTemplate = `.*?`;/s, `const htmlTemplate = buildAetherEmail(\`Código 2FA de Administrador\`, "ACCESO PRIVILEGIADO", \`
    <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #a1a1aa;">
      Se ha detectado un intento de inicio de sesión con credenciales de Administrador. Ingresa este código de seguridad para verificar tu identidad:
    </p>
    <div style="background: linear-gradient(135deg, #064e3b, #022c22); border: 1px solid #059669; border-radius: 16px; padding: 32px 20px; text-align: center; margin-bottom: 32px; box-shadow: inset 0 2px 10px rgba(0,0,0,0.5);">
      <span style="font-family: 'Courier New', monospace; font-size: 42px; font-weight: 900; letter-spacing: 8px; color: #34d399; text-shadow: 0 0 20px rgba(52,211,153,0.4);">\${code}</span>
    </div>
    <div style="border-t: 1px solid #1a1a20; padding-top: 20px; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #52525b;">Válido por 10 minutos.<br>Si no intentaste acceder al panel, tu cuenta podría estar comprometida.</p>
    </div>
  \`, "#10b981");`);
});

// Replace /api/admin/test-email embedded email
const testEmailRegex = /app\.post\("\/api\/admin\/test-email".*?const testHtml = `.*?`;/s;
code = code.replace(testEmailRegex, (match) => {
  return match.replace(/const testHtml = `.*?`;/s, `const testHtml = buildAetherEmail(\`Prueba de Servidor SMTP\`, "SISTEMA", \`
    <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #a1a1aa;">
      Este es un mensaje de diagnóstico enviado desde tu servidor de Aether Security. Si estás leyendo esto, significa que el sistema de correos está perfectamente configurado y operativo.
    </p>
    <div style="background-color: #0c0c0f; border-radius: 16px; padding: 20px; border: 1px solid #27272a; margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #1a1a20; padding-bottom: 12px; margin-bottom: 12px;">
        <span style="color: #52525b; font-size: 13px;">Servidor SMTP</span>
        <span style="color: #10b981; font-size: 13px; font-weight: 600;">\${currentSmtpConfig.host}:\${currentSmtpConfig.port}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="color: #52525b; font-size: 13px;">Estado de Conexión</span>
        <span style="color: #10b981; font-size: 13px; font-weight: 600;">Establecida 100%</span>
      </div>
    </div>
  \`, "#0ea5e9");`);
});

// Write the buildAetherEmail function below the generic sendRealEmail
code = code.replace(/async function sendRealEmail\(.*?}\n\n/s, (match) => {
  return match + buildAetherEmailCode + "\n";
});


fs.writeFileSync('server.ts', code);
