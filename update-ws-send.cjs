const fs = require('fs');

const file = 'src/App.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  "type: 'SEND_MESSAGE',\n          roomId: currentRoom.id,\n          encryptedText,\n          attachments,\n          replyTo",
  "type: 'SEND_MESSAGE',\n          roomId: currentRoom.id,\n          encryptedText,\n          attachments,\n          replyTo,\n          plainTextForAI: plainText"
);

fs.writeFileSync(file, code);
