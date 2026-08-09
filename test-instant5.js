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

instant.subscribeQuery({ users: {} }, (res) => {
  console.log("Sub:", res.data);
  process.exit(0);
});
