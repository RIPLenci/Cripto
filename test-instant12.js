import "fake-indexeddb/auto";
global.window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  setTimeout,
  clearTimeout,
};
Object.defineProperty(global, 'navigator', { value: { product: 'ReactNative' }, writable: true });
global.addEventListener = () => {};

import { init, tx } from "@instantdb/core";
const instant = init({ appId: "222816e6-294f-4d87-ab1e-6e94aa4e6c74" });

async function run() {
  try {
    await instant.transact([
      tx.testCol["usr-12345"].update({ val: "hello" })
    ]);
  } catch (e) {
    console.error(e.message);
  }
  process.exit(0);
}
run();
