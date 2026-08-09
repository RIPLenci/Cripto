const fs = require('fs');
const file = 'server.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'for (const l of this.securityLogs) ops.push(tx.securityLogs[l.id].update(l));',
  'for (const l of this.securityLogs) ops.push(tx.securityLogs[l.id].update(l as any));'
);

fs.writeFileSync(file, code);
