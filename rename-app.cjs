const fs = require('fs');

function replaceInFile(file, oldStr, newStr) {
  let code = fs.readFileSync(file, 'utf8');
  code = code.split(oldStr).join(newStr);
  fs.writeFileSync(file, code);
}

replaceInFile('index.html', 'Página Protegida', 'Aether Security');
replaceInFile('src/App.tsx', 'Página Protegida', 'Aether Security');
replaceInFile('src/components/AdminDashboard.tsx', 'Página Protegida', 'Aether Security');
replaceInFile('server.ts', 'Página Protegida', 'Aether Security');

let meta = JSON.parse(fs.readFileSync('metadata.json', 'utf8'));
meta.name = 'Aether Security';
fs.writeFileSync('metadata.json', JSON.stringify(meta, null, 2));

console.log("Renamed to Aether Security!");
