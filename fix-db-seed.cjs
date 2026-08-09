const fs = require('fs');
const file = 'server.ts';
let code = fs.readFileSync(file, 'utf8');

const seedMethod = `
  public seedDefaultAdmin() {
    const adminId = "admin-master-101";
    this.users.set(adminId, {
      id: adminId,
      email: "ydark126@gmail.com",
      passwordHash: this.hashPassword("admin123"),
      name: "YDark Admin",
      ip: "127.0.0.1",
      role: "admin",
      status: "Activo",
      isVerified: true,
      createdAt: Date.now(),
      isBanned: false
    });
    this.userByEmailIndex.set("ydark126@gmail.com", adminId);
    this.saveDatabase();
  }
`;

code = code.replace(
  'public async saveDatabase() {',
  seedMethod.trim() + '\n\n  public async saveDatabase() {'
);

fs.writeFileSync(file, code);
