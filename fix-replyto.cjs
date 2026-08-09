const fs = require('fs');
const file = 'src/App.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  '          attachments,\n          replyTo,\n          replyTo: replyToMsg',
  '          attachments,\n          replyTo: replyToMsg'
);

fs.writeFileSync(file, code);
