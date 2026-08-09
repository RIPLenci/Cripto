const fs = require('fs');
const file = 'server.ts';
let code = fs.readFileSync(file, 'utf8');

const newEndpoint = `
app.post("/api/rooms/toggle-closed", authenticateToken, (req, res) => {
  const { roomId, isClosed } = req.body;
  const user = (req as any).user as UserRecord;
  
  if (!roomId || !db.rooms.has(roomId)) {
    return res.status(404).json({ error: "Sala no encontrada" });
  }
  
  const room = db.rooms.get(roomId)!;
  if (room.createdById !== user.id && user.role !== 'admin') {
    return res.status(403).json({ error: "No tienes permisos para modificar esta sala" });
  }
  
  room.isClosed = !!isClosed;
  db.rooms.set(roomId, room);
  db.saveDatabase();
  
  // Enviar evento por WS para expulsar si se cerró (opcional) o notificar
  res.json({ message: room.isClosed ? "Sala cerrada correctamente" : "Sala abierta correctamente", room });
});
`;

code = code.replace(
  '// ==========================================\n// ADMIN DASHBOARD ROUTES',
  newEndpoint + '\n// ==========================================\n// ADMIN DASHBOARD ROUTES'
);

fs.writeFileSync(file, code);
