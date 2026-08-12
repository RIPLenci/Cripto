export interface InfractionLog {
  id: string;
  number: number;
  timestamp: number;
  dateFormatted: string;
  reason: string;
  evidence: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  roomName?: string;
  attachmentsInfo?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  ip: string;
  role: 'user' | 'admin';
  status: 'Activo' | 'Baneado' | 'Sancionado';
  isVerified: boolean;
  createdAt: number;
  isBanned?: boolean;
  isPremium?: boolean;
  premiumExpiresAt?: number;
  violations?: number;
  infractions?: InfractionLog[];
  banReason?: string;
  banSeverity?: 'low' | 'medium' | 'high' | 'critical';
  banEvidence?: string;
  bannedAt?: number;
}

export interface AuthSession {
  token: string;
  user: UserProfile;
  admin2FAVerified?: boolean;
}

export interface ChatRoom {
  id: string;
  name: string;
  code: string;
  createdById: string;
  createdByName: string;
  createdAt: number;
  isPrivate: boolean;
  isClosed?: boolean;
  activeUsersCount: number;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  encryptedText: string;
  text?: string;
  attachments?: Array<{ name: string; type: string; data: string; size?: string }>;
  replyTo?: { id: string; senderName: string; text: string };
  reactions?: Array<{emoji: string, senderName: string}> | any[];
  selfDestruct?: number;
  time: string;
  timestamp: number;
}

export interface ThreatLog {
  id: string;
  ip: string;
  userId?: string;
  userEmail?: string;
  threatType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  evidence: string;
  reason: string;
  timestamp: number;
  blocked: boolean;
  webhookNotified: boolean;
}

export interface SecurityAccessLog {
  id: string;
  ip: string;
  action: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'SUSPICIOUS_ATTEMPT' | 'ACCESS_DENIED' | 'IP_BAN_TRIGGERED' | 'AI_THREAT_BLOCKED' | 'EMAIL_VERIFIED' | 'ADMIN_2FA_VERIFIED' | 'ROLE_CHANGED';
  userEmail?: string;
  userAgent?: string;
  details?: string;
  timestamp: number;
  suspicious: boolean;
}

export interface SystemStats {
  totalUsers: number;
  bannedUsers: number;
  bannedIPsCount: number;
  activeRooms: number;
  activeConnections: number;
  threatsDetected: number;
  totalLogs: number;
  cacheHitRatio: number;
}

export interface CustomPreferences {
  theme: 'dark' | 'oled' | 'midnight' | 'cyberpunk' | 'emerald' | 'violet';
  accent: string;
  fontFam: 'font-jakarta' | 'font-inter' | 'font-mono' | 'font-outfit';
  privacyBlur: boolean;
  soundEnabled: boolean;
  autoScroll: boolean;
  highContrast: boolean;
}
