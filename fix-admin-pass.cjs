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
data.users = data.users.map(([id, user]) => {
  if (user.email === 'ydark126@gmail.com') {
    user.passwordHash = hashPassword('admin123');
    user.status = 'Activo';
    user.isBanned = false;
    modified = true;
    console.log("Admin password reset to 'admin123' and unbanned!");
  }
  return [id, user];
});
if (modified) fs.writeFileSync(DB_FILE, JSON.stringify(data), 'utf-8');
