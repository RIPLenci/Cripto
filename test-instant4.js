import { init } from "@instantdb/core";
// Mock browser environment
global.window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  setTimeout,
  clearTimeout,
};
Object.defineProperty(global, 'navigator', { value: { product: 'ReactNative' }, writable: true });

const instant = init({ appId: "222816e6-294f-4d87-ab1e-6e94aa4e6c74" });

instant.subscribeQuery({ test: {} }, (res) => {
  console.log("Sub:", res);
  process.exit(0);
});
