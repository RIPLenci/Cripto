const fs = require('fs');
const file = 'server.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'for (const s of this.securityLogs) ops.push(tx.securityLogs[s.id].update(s));',
  'for (const s of this.securityLogs) ops.push(tx.securityLogs[s.id].update(s as any));'
);

fs.writeFileSync(file, code);
