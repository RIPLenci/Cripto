const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Replacements for /api/admin/premium/add
const addOld = `app.post("/api/admin/premium/add", authenticateToken, requireAdmin, async (req, res) => {
  const { email, months } = req.body;
  if (!email || !months) return res.status(400).json({ error: "Email y meses son requeridos" });
  
  const targetUser = (await db.getAllUsers()).find(u => u.email === email.trim().toLowerCase());
  if (!targetUser) return res.status(404).json({ error: "Usuario no encontrado" });

  const durationMs = parseInt(months) * 30 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  if (targetUser.isPremium && targetUser.premiumExpiresAt && targetUser.premiumExpiresAt > now) {
    targetUser.premiumExpiresAt += durationMs;
  } else {
    targetUser.isPremium = true;
    targetUser.premiumExpiresAt = now + durationMs;
  }
  
  await db.saveUser(targetUser);`;

const addNew = `app.post("/api/admin/premium/add", authenticateToken, requireAdmin, async (req, res) => {
  const { email, months } = req.body;
  if (!email || !months) return res.status(400).json({ error: "Email y meses son requeridos" });
  
  const cleanEmail = email.trim().toLowerCase();
  const doc = await (UserModel as any).findOne({ email: cleanEmail });
  if (!doc) return res.status(404).json({ error: "Usuario no encontrado" });

  const durationMs = parseInt(months) * 30 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  let newExpiresAt = doc.premiumExpiresAt || 0;
  
  if (doc.isPremium && newExpiresAt > now) {
    newExpiresAt += durationMs;
  } else {
    newExpiresAt = now + durationMs;
  }
  
  await (UserModel as any).updateOne({ email: cleanEmail }, {
    $set: { isPremium: true, premiumExpiresAt: newExpiresAt }
  });
  
  const targetUser = { premiumExpiresAt: newExpiresAt, email: cleanEmail };`;

code = code.replace(addOld, addNew);

// Replacements for /api/admin/premium/remove
const removeOld = `app.post("/api/admin/premium/remove", authenticateToken, requireAdmin, async (req, res) => {
  const { email, reason } = req.body;
  if (!email) return res.status(400).json({ error: "Email es requerido" });
  
  const targetUser = (await db.getAllUsers()).find(u => u.email === email.trim().toLowerCase());
  if (!targetUser) return res.status(404).json({ error: "Usuario no encontrado" });

  targetUser.isPremium = false;
  targetUser.premiumExpiresAt = undefined;
  
  await db.saveUser(targetUser);`;

const removeNew = `app.post("/api/admin/premium/remove", authenticateToken, requireAdmin, async (req, res) => {
  const { email, reason } = req.body;
  if (!email) return res.status(400).json({ error: "Email es requerido" });
  
  const cleanEmail = email.trim().toLowerCase();
  const doc = await (UserModel as any).findOne({ email: cleanEmail });
  if (!doc) return res.status(404).json({ error: "Usuario no encontrado" });
  
  await (UserModel as any).updateOne({ email: cleanEmail }, {
    $set: { isPremium: false },
    $unset: { premiumExpiresAt: 1 }
  });
  
  const targetUser = { email: cleanEmail };`;

code = code.replace(removeOld, removeNew);

// Replacements for /api/admin/premium/update-date
const updateDateOld = `app.post("/api/admin/premium/update-date", authenticateToken, requireAdmin, async (req, res) => {
  const { email, timestamp } = req.body;
  if (!email || !timestamp) return res.status(400).json({ error: "Email y fecha son requeridos" });
  
  const targetUser = (await db.getAllUsers()).find(u => u.email === email.trim().toLowerCase());
  if (!targetUser) return res.status(404).json({ error: "Usuario no encontrado" });

  targetUser.isPremium = true;
  targetUser.premiumExpiresAt = timestamp;
  
  await db.saveUser(targetUser);`;

const updateDateNew = `app.post("/api/admin/premium/update-date", authenticateToken, requireAdmin, async (req, res) => {
  const { email, timestamp } = req.body;
  if (!email || !timestamp) return res.status(400).json({ error: "Email y fecha son requeridos" });
  
  const cleanEmail = email.trim().toLowerCase();
  const doc = await (UserModel as any).findOne({ email: cleanEmail });
  if (!doc) return res.status(404).json({ error: "Usuario no encontrado" });

  await (UserModel as any).updateOne({ email: cleanEmail }, {
    $set: { isPremium: true, premiumExpiresAt: timestamp }
  });
  
  const targetUser = { premiumExpiresAt: timestamp, email: cleanEmail };`;

code = code.replace(updateDateOld, updateDateNew);

fs.writeFileSync('server.ts', code);
