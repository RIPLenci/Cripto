const fs = require('fs');

const file = 'server.ts';
let code = fs.readFileSync(file, 'utf8');

// Add isDirty
code = code.replace(
  'class DatabaseStore {',
  'class DatabaseStore {\n  public isDirty = false;'
);

// Modify constructor to add interval
code = code.replace(
  '  constructor() {\n    this.loadDatabase();\n  }',
  `  constructor() {
    this.loadDatabase();
    setInterval(() => {
      if (this.isDirty) {
        this.saveDatabase();
        this.isDirty = false;
      }
    }, 5000);
  }`
);

// We need to set isDirty = true periodically or intercept Map/Set.
// Intercepting Map/Set is hard. Let's just set isDirty = true in all methods.
code = code.replace(
  'public logSecurityEvent(',
  'public logSecurityEvent('
);
code = code.replace(
  'this.securityLogs.unshift(log);',
  'this.securityLogs.unshift(log);\n    this.isDirty = true;'
);
code = code.replace(
  'this.bannedIPs.add(ip);',
  'this.bannedIPs.add(ip);\n    this.isDirty = true;'
);
code = code.replace(
  'this.threats.push(threat);',
  'this.threats.push(threat);\n    this.isDirty = true;'
);

fs.writeFileSync(file, code);

console.log("Updated!");
