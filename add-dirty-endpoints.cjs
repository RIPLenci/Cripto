const fs = require('fs');

const file = 'server.ts';
let code = fs.readFileSync(file, 'utf8');

const injectPoints = [
  'db.users.set(userId, newUser);',
  'user.passwordHash = db.hashPassword(newPassword);',
  'user.ip = ip;',
  'db.rooms.set(roomId, room);',
  'u.status = status;',
  'u.passwordHash = db.hashPassword(newPassword);',
  'db.messages.get(roomId)!.push(newMsg);',
  'db.messages.set(roomId, filtered);',
  'db.messages.set(roomId, []);'
];

injectPoints.forEach(pt => {
  code = code.split(pt).join(pt + '\n  db.isDirty = true;');
});

fs.writeFileSync(file, code);

console.log("Updated!");
