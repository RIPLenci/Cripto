const fs = require('fs');
const file = 'server.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/gemini-3\.6-flash/g, 'gemini-2.5-flash');

fs.writeFileSync(file, code);
