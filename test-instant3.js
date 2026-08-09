import { init } from "@instantdb/core";
const instant = init({ appId: "222816e6-294f-4d87-ab1e-6e94aa4e6c74" });
try {
  instant.subscribeQuery({ test: {} }, (res) => {
    console.log("Sub:", res);
    process.exit(0);
  });
} catch(e) { console.error(e.message); }
