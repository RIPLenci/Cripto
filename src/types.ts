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
  avatar?: string;
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
  accessMode?: 'open' | 'closed' | 'global';
  description?: string;
  activeUsersCount: number;
}

export interface BannedIpDetail {
  id: string;
  ip: string;
  reason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  bannedBy?: string;
  timestamp: number;
  userEmail?: string;
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

export interface WsConnectionClient {
  id: string;
  ip: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  roomId?: string;
  connectedAt: number;
  lastPingAt: number;
  messageCountWindow: number;
  roomSwitchCountWindow: number;
  authFailures: number;
  status: 'active' | 'authenticated' | 'suspicious' | 'blocked';
  pingMs?: number;
}

export interface WsSecurityHeuristicRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  threshold: number;
  unit: string;
  action: 'WARN' | 'DISCONNECT' | 'AUTO_BAN';
}

export interface WsMonitorStats {
  activeSockets: number;
  authenticatedSockets: number;
  totalMessagesProcessed: number;
  messagesPerSecond: number;
  suspiciousEventsCount: number;
  autoBlockedIpsCount: number;
  activeClients: WsConnectionClient[];
  heuristics: WsSecurityHeuristicRule[];
  bannedIps: Array<{ ip: string; reason: string; bannedAt: number }>;
  recentEvents: Array<{
    id: string;
    type: 'CONNECT' | 'DISCONNECT' | 'HEURISTIC_TRIGGER' | 'AUTO_BAN' | 'MANUAL_BLOCK' | 'PING';
    ip: string;
    detail: string;
    severity: 'info' | 'warn' | 'alert' | 'critical';
    timestamp: number;
  }>;
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
