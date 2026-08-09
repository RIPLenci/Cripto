import "fake-indexeddb/auto";
global.window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  setTimeout,
  clearTimeout,
};
Object.defineProperty(global, 'navigator', { value: { product: 'ReactNative' }, writable: true });
global.addEventListener = () => {};

import { init } from "@instantdb/core";
const instant = init({ appId: "222816e6-294f-4d87-ab1e-6e94aa4e6c74" });

const unsub = instant.subscribeQuery({ users: {} }, (res) => {
  console.log("Sub callback:", Object.keys(res), "isLoading:", res.isLoading);
  if (!res.isLoading && res.data) {
     console.log("Data:", res.data);
     unsub();
     process.exit(0);
  }
});
