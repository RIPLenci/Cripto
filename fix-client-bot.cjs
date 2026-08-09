const fs = require('fs');

const file = 'src/App.tsx';
let code = fs.readFileSync(file, 'utf8');

// For ROOM_HISTORY
code = code.replace(
  'if (roomRoomKey) {',
  `if (m.senderId === 'bot-ai-assistant') {
                text = m.encryptedText;
              } else if (roomRoomKey) {`
);

// For NEW_MESSAGE
code = code.replace(
  'if (roomRoomKey) {',
  `if (data.message.senderId === 'bot-ai-assistant') {
            text = data.message.encryptedText;
          } else if (roomRoomKey) {`
);

fs.writeFileSync(file, code);

console.log("Updated App.tsx bot handling!");
