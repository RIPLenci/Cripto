import mongoose from 'mongoose';
import { UserModel } from './src/db/models';

async function check() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/aether-security");
  const user = await (UserModel as any).findOne({ email: 'ydark126@gmail.com' });
  console.log("Admin record:", user ? { email: user.email, ip: user.ip, ipWhitelist: user.ipWhitelist } : "Not found");
  process.exit(0);
}
check();
