const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const invoiceRegex = /async function sendPremiumInvoiceEmail.*?const html = `.*?`;/s;
code = code.replace(invoiceRegex, (match) => {
  return match.replace(/const html = `.*?`;/s, `const content = \`
    <div style="background-color: \${badgeColor}15; border: 1px solid \${badgeColor}40; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center;">
      <p style="margin: 0; color: \${badgeColor}; font-size: 14px; font-weight: 600;">\${statusBanner}</p>
    </div>
    <div style="background-color: #0c0c0f; border-radius: 16px; border: 1px solid #1a1a20; overflow: hidden; margin-bottom: 24px;">
      <table width="100%" border="0" cellpadding="0" cellspacing="0">
        <thead>
          <tr>
            <th style="padding: 16px; text-align: left; background-color: #050505; border-bottom: 1px solid #1a1a20; color: #52525b; font-size: 12px; font-weight: 600; text-transform: uppercase;">Descripción</th>
            <th style="padding: 16px; text-align: center; background-color: #050505; border-bottom: 1px solid #1a1a20; color: #52525b; font-size: 12px; font-weight: 600; text-transform: uppercase;">Cant.</th>
            <th style="padding: 16px; text-align: right; background-color: #050505; border-bottom: 1px solid #1a1a20; color: #52525b; font-size: 12px; font-weight: 600; text-transform: uppercase;">Monto</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 16px; border-bottom: 1px solid #1a1a20; color: #e4e4e7; font-weight: 500;">
              Membresía Plan Aether Premium
              <div style="font-size: 11px; color: #71717a; margin-top: 4px;">Acceso ilimitado a IA avanzadas y cifrado VIP</div>
            </td>
            <td style="padding: 16px; border-bottom: 1px solid #1a1a20; text-align: center; color: #a1a1aa;">\${isPaid ? \`\${m} mes\${m > 1 ? 'es' : ''}\` : '-'}</td>
            <td style="padding: 16px; border-bottom: 1px solid #1a1a20; text-align: right; color: #e4e4e7; font-weight: 600; font-family: monospace;">$\${basePlanPrice.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 16px; border-bottom: 1px solid #1a1a20; color: #e4e4e7; font-weight: 500;">Cargo por Servicio</td>
            <td style="padding: 16px; border-bottom: 1px solid #1a1a20; text-align: center; color: #a1a1aa;">1</td>
            <td style="padding: 16px; border-bottom: 1px solid #1a1a20; text-align: right; color: #e4e4e7; font-weight: 600; font-family: monospace;">+$\${processingFee.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 16px; color: #e4e4e7; font-weight: 500;">IVA (16%)</td>
            <td style="padding: 16px; text-align: center; color: #a1a1aa;">16%</td>
            <td style="padding: 16px; text-align: right; color: #e4e4e7; font-weight: 600; font-family: monospace;">+$\${iva.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div style="background: linear-gradient(135deg, #0f0f13, #050505); border: 1px solid #27272a; padding: 24px; border-radius: 16px; margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
        <span style="color: #71717a; font-size: 13px;">Subtotal</span>
        <span style="color: #e4e4e7; font-family: monospace;">$\${subtotal.toFixed(2)} USD</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #1a1a20;">
        <span style="color: #71717a; font-size: 13px;">Impuestos</span>
        <span style="color: #e4e4e7; font-family: monospace;">+$\${iva.toFixed(2)} USD</span>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="color: \${badgeColor}; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Total Final</span>
        <span style="color: \${badgeColor}; font-size: 24px; font-weight: 900; font-family: monospace; letter-spacing: -1px;">$\${grandTotal.toFixed(2)}</span>
      </div>
    </div>
    <div style="text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #52525b; line-height: 1.6;">Factura Electrónica emitida a <strong>\${displayName}</strong> (\${userEmail}).</p>
    </div>
  \`;
  const html = buildAetherEmail(\`Factura #\${invoiceNum}\`, badgeText, content, badgeColor);`);
});

fs.writeFileSync('server.ts', code);
