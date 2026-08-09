const fs = require('fs');

let types = fs.readFileSync('src/types.ts', 'utf8');
types = types.replace(
  'isPrivate: boolean;',
  'isPrivate: boolean;\n  isClosed?: boolean;'
);
fs.writeFileSync('src/types.ts', types);

let server = fs.readFileSync('server.ts', 'utf8');
server = server.replace(
  'isPrivate: boolean;',
  'isPrivate: boolean;\n  isClosed?: boolean;'
);
fs.writeFileSync('server.ts', server);

console.log("Added isClosed");
