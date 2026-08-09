const fs = require('fs');

const file = 'server.ts';
let code = fs.readFileSync(file, 'utf8');

const replacement = `const prompt = \`Actúa como "Aether WAF", el motor de seguridad cuántica en tiempo real.
Analiza la siguiente actividad:
- IP: \${ip}
- Email: \${userEmail || 'Anónimo'}
- Contexto: \${contextType}
- Payload: "\${payloadStr.slice(0, 1000)}"

Determina si contiene una amenaza de seguridad (DDoS, inyección SQL, XSS) O contenido ilegal (drogas, armas, pedofilia, terrorismo, malware, enlaces maliciosos, spam extremo).
IMPORTANTE: Es una app de máxima seguridad, cualquier contenido altamente ilegal o de ataque de botnet/DDoS debe ser catalogado como amenaza 'critical' y bloqueado de inmediato.
Responde ÚNICAMENTE en JSON válido sin markdown:
{
  "isThreat": boolean,
  "severity": "low" | "medium" | "high" | "critical",
  "reason": "Motivo breve",
  "evidence": "Evidencia extraída del payload"
}\`;`;

code = code.replace(
  /const prompt = \`Actúa como un motor de seguridad WAF en tiempo real.[\s\S]*?\"\s*\}\`;/,
  replacement
);

fs.writeFileSync(file, code);

