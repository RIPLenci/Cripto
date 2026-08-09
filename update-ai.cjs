const fs = require('fs');

const file = 'server.ts';
let code = fs.readFileSync(file, 'utf8');

// Upgrade bot AI model and prompt
code = code.replace(
  'model: "gemini-2.5-flash",',
  'model: "gemini-3.6-flash",'
);

code = code.replace(
  'contents: `Eres un Bot Asistente Inteligente en una aplicación de mensajes segura llamada Página Protegida. Responde de forma amigable, útil y concisa al usuario ${senderData.name} que solicita: "${cleanPrompt}".`',
  'contents: `Eres "Aether", el Bot Asistente Inteligente Avanzado de máxima seguridad de Página Protegida. Tienes acceso virtual a capacidades analíticas superiores, cifrado cuántico (rolplay) y procesamiento de lenguaje de nivel experto. Responde con un nivel de inteligencia excepcional, estructurado, detallado y profesional, demostrando dominio de cualquier tema al usuario ${senderData.name} que solicita: "${cleanPrompt}". Si es necesario, utiliza Markdown, código, o estructuración en viñetas para ofrecer una respuesta de altísimo nivel.`'
);

// Upgrade admin AI prompt
code = code.replace(
  'Responde de forma ejecutiva y técnica.`;',
  'Responde como el principal analista de ciberseguridad avanzado de la red. Utiliza lenguaje sumamente técnico, detallado, realiza un perfilado profundo del comportamiento y proporciona recomendaciones tácticas de mitigación (NIST, CIS). Eres el nivel máximo de IA de administración.`;'
);

fs.writeFileSync(file, code);

console.log("Updated!");
