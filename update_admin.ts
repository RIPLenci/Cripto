import mongoose from 'mongoose';
import { UserModel } from './src/db/models';
import dotenv from 'dotenv';

dotenv.config();

async function update() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/aether-security");
  const user = await (UserModel as any).findOne({ email: 'ydark126@gmail.com' });
  if (user) {
    if (!user.ipWhitelist.includes('200.70.47.12')) {
      user.ipWhitelist.push('200.70.47.12');
      await user.save();
      console.log("Admin updated:", user.ipWhitelist);
    } else {
      console.log("Admin already has 200.70.47.12");
    }
  } else {
    console.log("Admin not found in DB.");
  }
  process.exit(0);
}
update();
