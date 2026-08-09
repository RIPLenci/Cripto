const fs = require('fs');

const file = 'server.ts';
let code = fs.readFileSync(file, 'utf8');

// Update maps definition
code = code.replace(
  'const emailVerificationCodes = new Map<string, { code: string; expiresAt: number }>();',
  'const emailVerificationCodes = new Map<string, { codeHash: string; expiresAt: number }>();'
);

code = code.replace(
  'const admin2FACodes = new Map<string, { code: string; expiresAt: number }>();',
  'const admin2FACodes = new Map<string, { codeHash: string; expiresAt: number }>();'
);

// Update Register - Send Code
code = code.replace(
  'const code = Math.floor(100000 + Math.random() * 900000).toString();',
  'const code = crypto.randomInt(100000, 999999).toString();'
);

code = code.replace(
  'emailVerificationCodes.set(cleanEmail, { code, expiresAt });',
  'emailVerificationCodes.set(cleanEmail, { codeHash: db.hashPassword(code), expiresAt });'
);

// Update Register - Verify
code = code.replace(
  'if (record.code !== code.trim()) {',
  'if (record.codeHash !== db.hashPassword(code.trim())) {'
);

// Update Forgot Password - Send Code
code = code.replace(
  'const code = Math.floor(100000 + Math.random() * 900000).toString();',
  'const code = crypto.randomInt(100000, 999999).toString();'
);

code = code.replace(
  'emailVerificationCodes.set("reset:" + cleanEmail, { code, expiresAt });',
  'emailVerificationCodes.set("reset:" + cleanEmail, { codeHash: db.hashPassword(code), expiresAt });'
);

// Update Forgot Password - Verify
code = code.replace(
  'if (record.code !== code.trim()) {',
  'if (record.codeHash !== db.hashPassword(code.trim())) {'
);

// Update Admin 2FA - Send Code
code = code.replace(
  'const code = Math.floor(100000 + Math.random() * 900000).toString();',
  'const code = crypto.randomInt(100000, 999999).toString();'
);

code = code.replace(
  'admin2FACodes.set(user.email.toLowerCase(), { code, expiresAt });',
  'admin2FACodes.set(user.email.toLowerCase(), { codeHash: db.hashPassword(code), expiresAt });'
);

// Update Admin 2FA - Verify
code = code.replace(
  'if (record.code !== code.trim()) {',
  'if (record.codeHash !== db.hashPassword(code.trim())) {'
);


fs.writeFileSync(file, code);

console.log("Updated OTP logic!");
