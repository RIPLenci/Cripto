const fs = require('fs');
const DB_FILE = 'database.json';
const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
data.bannedIPs = [];
fs.writeFileSync(DB_FILE, JSON.stringify(data), 'utf-8');
console.log("Cleared banned IPs!");
