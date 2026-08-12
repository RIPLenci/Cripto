import mongoose, { Schema, Document } from 'mongoose';
import mongooseFieldEncryption from 'mongoose-field-encryption';

const fieldEncryption = mongooseFieldEncryption.fieldEncryption;

const ENCRYPTION_KEY = process.env.DB_SECRET || 'AETHER_SUPER_SECRET_KEY_2026_12345'; // 32 bytes required for AES-256-CBC, but mongoose-field-encryption uses AES-256-CBC with a 32-byte key. If it's not 32 bytes, it hashes it.
const secret = ENCRYPTION_KEY;

// 1. User
export interface IUser extends Document {
  id: string; // the old string id
  email: string;
  passwordHash: string;
  name: string;
  ip: string;
  role: 'admin' | 'user';
  status: 'Activo' | 'Baneado' | 'Sancionado';
  isVerified: boolean;
  createdAt: number;
  isBanned: boolean;
  isPremium?: boolean;
  premiumExpiresAt?: number;
  banReason?: string;
  banSeverity?: 'low' | 'medium' | 'high' | 'critical';
  banEvidence?: string;
  violations?: number;
  infractions?: any[];
}
const UserSchema = new Schema<IUser>({
  id: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true },
  ip: { type: String, required: true },
  role: { type: String, required: true, default: 'user' },
  status: { type: String, required: true, default: 'Activo' },
  isVerified: { type: Boolean, required: true, default: false },
  createdAt: { type: Number, required: true, default: Date.now },
  isBanned: { type: Boolean, required: true, default: false },
  isPremium: { type: Boolean, default: false },
  premiumExpiresAt: { type: Number },
  banReason: { type: String },
  banSeverity: { type: String },
  banEvidence: { type: String },
  violations: { type: Number, default: 0 },
  infractions: { type: [Object], default: [] }
});
UserSchema.index({ email: 1 });
UserSchema.index({ id: 1 });
UserSchema.plugin(fieldEncryption, { fields: ['passwordHash', 'ip', 'name'], secret });
export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

// 2. Room
export interface IRoom extends Document {
  id: string;
  name: string;
  code: string;
  createdById: string;
  createdByName: string;
  createdAt: number;
  isPrivate: boolean;
  isClosed: boolean;
}
const RoomSchema = new Schema<IRoom>({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true, index: true },
  createdById: { type: String, required: true },
  createdByName: { type: String, required: true },
  createdAt: { type: Number, required: true, default: Date.now },
  isPrivate: { type: Boolean, required: true, default: false },
  isClosed: { type: Boolean, required: true, default: false }
});
RoomSchema.index({ id: 1 });
RoomSchema.index({ code: 1 });
RoomSchema.plugin(fieldEncryption, { fields: ['name'], secret });
export const RoomModel = mongoose.models.Room || mongoose.model<IRoom>('Room', RoomSchema);

// 3. Message
export interface IMessage extends Document {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderEmail?: string;
  encryptedText: string;
  reactions: any[];
  time: string;
  timestamp: number;
}
const MessageSchema = new Schema<IMessage>({
  id: { type: String, required: true, unique: true, index: true },
  roomId: { type: String, required: true, index: true },
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  senderEmail: { type: String },
  encryptedText: { type: String, required: true },
  reactions: { type: [Object], default: [] },
  time: { type: String, required: true },
  timestamp: { type: Number, required: true, default: Date.now }
});
MessageSchema.index({ roomId: 1, timestamp: 1 });
MessageSchema.plugin(fieldEncryption, { fields: ['encryptedText', 'senderEmail', 'senderName'], secret });
export const MessageModel = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);

// 4. Threat (and Config/IP Bans/SecurityLogs)
export interface IThreat extends Document {
  ip: string;
  userId?: string;
  userEmail?: string;
  reason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  evidence?: string;
  timestamp: number;
}
const ThreatSchema = new Schema<IThreat>({
  ip: { type: String, required: true },
  userId: { type: String },
  userEmail: { type: String },
  reason: { type: String, required: true },
  severity: { type: String, required: true },
  evidence: { type: String },
  timestamp: { type: Number, required: true, default: Date.now }
});
ThreatSchema.plugin(fieldEncryption, { fields: ['ip', 'userEmail', 'evidence'], secret });
export const ThreatModel = mongoose.models.Threat || mongoose.model<IThreat>('Threat', ThreatSchema);

// Security Logs
export interface ISecurityLog extends Document {
  ip: string;
  event: string;
  target?: string;
  details?: string;
  timestamp: number;
  suspicious: boolean;
}
const SecurityLogSchema = new Schema<ISecurityLog>({
  ip: { type: String, required: true },
  event: { type: String, required: true },
  target: { type: String },
  details: { type: String },
  timestamp: { type: Number, required: true, default: Date.now },
  suspicious: { type: Boolean, required: true, default: false }
});
SecurityLogSchema.plugin(fieldEncryption, { fields: ['ip', 'target'], secret });
export const SecurityLogModel = mongoose.models.SecurityLog || mongoose.model<ISecurityLog>('SecurityLog', SecurityLogSchema);

// Banned IPs
export interface IBannedIP extends Document {
  ip: string;
  timestamp: number;
}
const BannedIPSchema = new Schema<IBannedIP>({
  ip: { type: String, required: true, unique: true, index: true },
  timestamp: { type: Number, required: true, default: Date.now }
});
BannedIPSchema.plugin(fieldEncryption, { fields: ['ip'], secret });
export const BannedIPModel = mongoose.models.BannedIP || mongoose.model<IBannedIP>('BannedIP', BannedIPSchema);

// Persistent Session Store
export interface ISession extends Document {
  token: string;
  userId: string;
  isAdmin2FA?: boolean;
  createdAt: number;
}
const SessionSchema = new Schema<ISession>({
  token: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  isAdmin2FA: { type: Boolean, default: false },
  createdAt: { type: Number, default: Date.now }
});
SessionSchema.index({ token: 1 });
export const SessionModel = mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema);


