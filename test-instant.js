import { init, tx, id } from "@instantdb/core";
const instant = init({ appId: "222816e6-294f-4d87-ab1e-6e94aa4e6c74" });
async function test() {
  try {
    const res = await instant.queryOnce({ __admin_store: {} });
    console.log("Query Once:", res);
  } catch (e) {
    console.error("Error:", e.message);
  }
}
test();
