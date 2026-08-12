const fs = require('fs');
let code = fs.readFileSync('src/db/models.ts', 'utf8');

if (!code.includes('MessageSchema.index({ roomId: 1, timestamp: 1 });')) {
  code = code.replace("MessageSchema.plugin(", "MessageSchema.index({ roomId: 1, timestamp: 1 });\nMessageSchema.plugin(");
}
if (!code.includes('UserSchema.index({ email: 1 });')) {
  code = code.replace("UserSchema.plugin(", "UserSchema.index({ email: 1 });\nUserSchema.index({ id: 1 });\nUserSchema.plugin(");
}
if (!code.includes('RoomSchema.index({ id: 1 });')) {
  code = code.replace("RoomSchema.plugin(", "RoomSchema.index({ id: 1 });\nRoomSchema.index({ code: 1 });\nRoomSchema.plugin(");
}

fs.writeFileSync('src/db/models.ts', code);
