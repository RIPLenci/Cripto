const fs = require('fs');

const file = 'server.ts';
let code = fs.readFileSync(file, 'utf8');

// 1. Add imports at the top
const imports = `import "fake-indexeddb/auto";
Object.defineProperty(global, 'window', {
  value: {
    addEventListener: () => {},
    removeEventListener: () => {},
    setTimeout,
    clearTimeout,
  },
  writable: true
});
Object.defineProperty(global, 'navigator', { value: { product: 'ReactNative' }, writable: true });
Object.defineProperty(global, 'addEventListener', { value: () => {}, writable: true });

import { init as initInstantDB, tx } from "@instantdb/core";
const instant = initInstantDB({ appId: "222816e6-294f-4d87-ab1e-6e94aa4e6c74" });
`;

code = code.replace(
  'import { WebSocketServer, WebSocket } from "ws";',
  imports + '\nimport { WebSocketServer, WebSocket } from "ws";'
);

// 2. Rewrite loadDatabase
code = code.replace(
  /public loadDatabase\(\) \{[\s\S]*?public saveDatabase/g,
  `public async loadDatabase() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const data = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
        this.users = new Map(data.users || []);
        this.userByEmailIndex = new Map(data.userByEmailIndex || []);
        this.bannedIPs = new Set(data.bannedIPs || []);
        this.rooms = new Map(data.rooms || []);
        this.roomByCodeIndex = new Map(data.roomByCodeIndex || []);
        this.messages = new Map(data.messages || []);
        this.threats = data.threats || [];
        this.securityLogs = data.securityLogs || [];
      } else {
        this.seedDefaultAdmin();
      }
      
      // Also try to sync down from InstantDB as a primary source of truth if available
      const unsub = instant.subscribeQuery({ users: {}, rooms: {}, messages: {}, threats: {}, securityLogs: {} }, (res) => {
        if (!res.isLoading && res.data) {
          if (res.data.users && res.data.users.length > 0) {
            for (const u of res.data.users) {
              this.users.set(u.id, u);
              this.userByEmailIndex.set(u.email.toLowerCase(), u.id);
            }
          }
          if (res.data.rooms && res.data.rooms.length > 0) {
            for (const r of res.data.rooms) {
              this.rooms.set(r.id, r);
              this.roomByCodeIndex.set(r.code, r.id);
            }
          }
          if (res.data.messages && res.data.messages.length > 0) {
            this.messages.clear(); // Re-group
            for (const m of res.data.messages) {
              if (!this.messages.has(m.roomId)) this.messages.set(m.roomId, []);
              this.messages.get(m.roomId)!.push(m);
            }
          }
          if (res.data.threats && res.data.threats.length > 0) {
             this.threats = res.data.threats.sort((a,b) => b.timestamp - a.timestamp);
          }
          if (res.data.securityLogs && res.data.securityLogs.length > 0) {
             this.securityLogs = res.data.securityLogs.sort((a,b) => b.timestamp - a.timestamp);
          }
          console.log("[InstantDB] Sync completed successfully from cloud.");
          unsub();
        }
      });
    } catch (err) {
      console.error("Error loading database:", err);
      this.seedDefaultAdmin();
    }
  }

  public saveDatabase`
);

// 3. Rewrite saveDatabase
code = code.replace(
  /public saveDatabase\(\) \{[\s\S]*?public hashPassword/g,
  `public async saveDatabase() {
    try {
      const data = {
        users: Array.from(this.users.entries()),
        userByEmailIndex: Array.from(this.userByEmailIndex.entries()),
        bannedIPs: Array.from(this.bannedIPs),
        rooms: Array.from(this.rooms.entries()),
        roomByCodeIndex: Array.from(this.roomByCodeIndex.entries()),
        messages: Array.from(this.messages.entries()),
        threats: this.threats,
        securityLogs: this.securityLogs
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(data), "utf-8");

      // Sync to InstantDB
      const ops = [];
      for (const [_, u] of this.users) ops.push(tx.users[u.id].update(u));
      for (const [_, r] of this.rooms) ops.push(tx.rooms[r.id].update(r));
      for (const [_, msgs] of this.messages) {
         for (const m of msgs) ops.push(tx.messages[m.id].update(m));
      }
      for (const t of this.threats) ops.push(tx.threats[t.id].update(t));
      for (const l of this.securityLogs) ops.push(tx.securityLogs[l.id].update(l));

      const chunkSize = 50;
      for (let i = 0; i < ops.length; i += chunkSize) {
        instant.transact(ops.slice(i, i + chunkSize));
      }
    } catch (err) {
      console.error("Error saving database:", err);
    }
  }

  public hashPassword`
);

fs.writeFileSync(file, code);
console.log("Applied InstantDB!");
