const fs = require('fs');
const crypto = require('crypto');
function hashPassword(plain) {
  let hash = plain;
  for (let i = 1; i <= 9; i++) {
    const algo = i % 2 === 0 ? "sha512" : "sha256";
    hash = crypto.createHash(algo).update(hash + `_AETHER_LAYER_${i}_2026`).digest("hex");
  }
  return hash;
}

const DB_FILE = 'database.json';
const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
let modified = false;

// Create or ensure ydark126@gmail.com has the correct credentials
let adminFound = false;
data.users = data.users.map(([id, user]) => {
  if (user.email === 'ydark126@gmail.com') {
    adminFound = true;
    user.passwordHash = hashPassword('admin123');
    user.status = 'Activo';
    user.isBanned = false;
    user.role = 'admin';
    user.name = 'YDark Admin';
    modified = true;
    console.log("Admin updated directly.");
  }
  return [id, user];
});

if (!adminFound) {
  const newId = 'admin-' + Date.now();
  data.users.push([newId, {
    id: newId,
    email: 'ydark126@gmail.com',
    passwordHash: hashPassword('admin123'),
    name: 'YDark Admin',
    ip: '127.0.0.1',
    role: 'admin',
    status: 'Activo',
    isVerified: true,
    createdAt: Date.now(),
    isBanned: false
  }]);
  data.userByEmailIndex.push(['ydark126@gmail.com', newId]);
  modified = true;
  console.log("Admin created because it was missing!");
}

if (modified) fs.writeFileSync(DB_FILE, JSON.stringify(data), 'utf-8');
