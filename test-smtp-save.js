const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, 'smtp-config.json');
let config = {};
if (fs.existsSync(configPath)) {
  config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}
console.log(config);
