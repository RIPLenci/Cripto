import "fake-indexeddb/auto";
global.window = { addEventListener: () => {}, removeEventListener: () => {}, setTimeout, clearTimeout };
Object.defineProperty(global, 'navigator', { value: { product: 'ReactNative' }, writable: true });
global.addEventListener = () => {};

import { init, tx } from "@instantdb/core";
const instant = init({ appId: "222816e6-294f-4d87-ab1e-6e94aa4e6c74" });

import crypto from 'crypto';
function hashPassword(plain) {
  let hash = plain;
  for (let i = 1; i <= 9; i++) {
    const algo = i % 2 === 0 ? "sha512" : "sha256";
    hash = crypto.createHash(algo).update(hash + `_AETHER_LAYER_${i}_2026`).digest("hex");
  }
  return hash;
}

async function run() {
  await instant.transact([
    tx.users['admin-master-101'].update({ passwordHash: hashPassword('admin123'), status: 'Activo', isBanned: false, role: 'admin' })
  ]);
  console.log("Password updated in InstantDB to 'admin123' again to be absolutely sure!");
  process.exit(0);
}
run();
