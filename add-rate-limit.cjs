const fs = require('fs');
const file = 'server.ts';
let code = fs.readFileSync(file, 'utf8');

const rateLimitCode = `
const requestCounts = new Map<string, { count: number, resetTime: number }>();

app.use(async (req, res, next) => {
  const ip = getClientIP(req);
  if (db.bannedIPs.has(ip)) {
    return res.status(403).json({ error: "Aether Security: IP Baneada por Seguridad." });
  }

  const now = Date.now();
  let record = requestCounts.get(ip);
  
  if (!record || now > record.resetTime) {
    record = { count: 1, resetTime: now + 60000 };
    requestCounts.set(ip, record);
  } else {
    record.count++;
  }

  // Si hace más de 100 peticiones en 1 minuto
  if (record.count > 100) {
    const threatCheck = await analyzeTrafficWithAI(ip, "Anónimo", \`DDOS_ATTACK_DETECTED \${record.count} reqs/min\`, "PROTECCION_WAF");
    if (threatCheck.blocked) {
      return res.status(403).json({ error: "Aether Security: IP Bloqueada temporalmente por comportamiento de BotNet/DDoS." });
    }
  }
  next();
});
`;

code = code.replace(
  'app.use(express.json({ limit: "50mb" }));',
  'app.use(express.json({ limit: "50mb" }));\n' + rateLimitCode
);

fs.writeFileSync(file, code);
