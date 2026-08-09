const fs = require('fs');
const DB_FILE = 'database.json';
const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
let modified = false;
data.users = data.users.map(([id, user]) => {
  if (user.email === 'ydark126@gmail.com') {
    user.status = 'Activo';
    user.isBanned = false;
    modified = true;
    console.log("Admin unbanned!");
  }
  return [id, user];
});
if (modified) fs.writeFileSync(DB_FILE, JSON.stringify(data), 'utf-8');
