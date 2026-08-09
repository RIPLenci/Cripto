const fs = require('fs');
const file = 'server.ts';
let code = fs.readFileSync(file, 'utf8');
code = code.replace(
  'const room = db.rooms.get(roomId)!;\n  res.json(room);',
  'const room = db.rooms.get(roomId)!;\n  if (room.isClosed) return res.status(403).json({ error: "La sala está cerrada por el administrador o creador." });\n  res.json(room);'
);
fs.writeFileSync(file, code);
