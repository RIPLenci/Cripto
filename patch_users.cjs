const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldUsers = `app.get("/api/admin/users", authenticateToken, requireAdmin, async (req, res) => {
  const userList = (await db.getAllUsers()).map(u => ({
    id: u.id,
    email: u.email,
    name: u.name,
    ip: u.ip,
    role: u.role,
    status: u.status,
    isVerified: u.isVerified,
    createdAt: u.createdAt,
    isBanned: u.isBanned,
    banReason: u.banReason,
    banSeverity: u.banSeverity,
    banEvidence: u.banEvidence,
    bannedAt: u.bannedAt
  }));`;

const newUsers = `app.get("/api/admin/users", authenticateToken, requireAdmin, async (req, res) => {
  const userList = (await db.getAllUsers()).map(u => ({
    id: u.id,
    email: u.email,
    name: u.name,
    ip: u.ip,
    role: u.role,
    status: u.status,
    isVerified: u.isVerified,
    createdAt: u.createdAt,
    isBanned: u.isBanned,
    banReason: u.banReason,
    banSeverity: u.banSeverity,
    banEvidence: u.banEvidence,
    bannedAt: u.bannedAt,
    isPremium: u.isPremium,
    premiumExpiresAt: u.premiumExpiresAt
  }));`;

code = code.replace(oldUsers, newUsers);
fs.writeFileSync('server.ts', code);
