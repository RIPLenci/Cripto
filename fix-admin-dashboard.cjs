const fs = require('fs');
const file = 'src/components/AdminDashboard.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  "body: JSON.stringify({ userId, role: targetRole })",
  "body: JSON.stringify({ userId, targetRole })"
);

fs.writeFileSync(file, code);
