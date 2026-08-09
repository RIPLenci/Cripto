import "fake-indexeddb/auto";
global.window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  setTimeout,
  clearTimeout,
};
Object.defineProperty(global, 'navigator', { value: { product: 'ReactNative' }, writable: true });
global.addEventListener = () => {};

import { init, tx, id } from "@instantdb/core";
const instant = init({ appId: "222816e6-294f-4d87-ab1e-6e94aa4e6c74" });

async function run() {
  const testId = id();
  await instant.transact([
    tx.users[testId].update({ name: "Admin Principal", role: "admin" })
  ]);
  console.log("Written!");
  process.exit(0);
}
run();
