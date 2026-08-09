const fs = require('fs');

const file = 'server.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  '  u.role = newRole;\n\n  db.logSecurityEvent',
  '  u.role = newRole;\n  db.users.set(userId, u);\n  db.saveDatabase();\n\n  db.logSecurityEvent'
);

code = code.replace(
  '  u.isBanned = u.status === \'Baneado\';\n\n  if (u.isBanned) {',
  '  u.isBanned = u.status === \'Baneado\';\n  db.users.set(userId, u);\n  db.saveDatabase();\n\n  if (u.isBanned) {'
);

code = code.replace(
  '  u.passwordHash = db.hashPassword(newPassword);\n  db.logSecurityEvent("ADMIN", "ROLE_CHANGED"',
  '  u.passwordHash = db.hashPassword(newPassword);\n  db.users.set(userId, u);\n  db.saveDatabase();\n  db.logSecurityEvent("ADMIN", "ROLE_CHANGED"'
);

fs.writeFileSync(file, code);

console.log("Fixed endpoints!");
