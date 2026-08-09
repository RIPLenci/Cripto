const fs = require('fs');

const file = 'server.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'const { roomId, encryptedText, attachments, replyTo, selfDestruct, isBotRequest } = msg;',
  'const { roomId, encryptedText, attachments, replyTo, selfDestruct, isBotRequest, plainTextForAI } = msg;'
);

code = code.replace(
  'const threatCheck = await analyzeTrafficWithAI(senderData.ip, senderData.email, encryptedText, "MENSAJE_CHAT");',
  `
        const attSummary = (attachments || []).map(a => a.name + " (" + a.type + ")").join(", ");
        const payloadToAnalyze = plainTextForAI ? (plainTextForAI + " | Adjuntos: " + attSummary) : encryptedText;
        const threatCheck = await analyzeTrafficWithAI(senderData.ip, senderData.email, payloadToAnalyze, "MENSAJE_CHAT_E2E_VERIFICADO");
  `
);

fs.writeFileSync(file, code);

