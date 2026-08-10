const { webcrypto } = require('crypto');
global.window = { crypto: webcrypto };
const { CryptoEngine } = require('./src/lib/crypto.ts'); // Wait, ts not supported directly in node unless we transpile. Let's just copy the code.
