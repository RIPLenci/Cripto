const fs = require('fs');

const file = 'src/App.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'plainTextForAI: plainText: replyToMsg ?',
  'replyTo: replyToMsg ?'
);
code = code.replace(
  'text: (replyToMsg as any).text || \'Adjunto\' } : undefined\n        })',
  'text: (replyToMsg as any).text || \'Adjunto\' } : undefined,\n          plainTextForAI: plainText\n        })'
);

fs.writeFileSync(file, code);
