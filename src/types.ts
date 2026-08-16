export type PlanTier = 'free' | 'premium' | 'cyber_elite';

export type BadgeType = 
  | 'owner'
  | 'developer'
  | 'admin'
  | 'staff'
  | 'support'
  | 'bug_hunter'
  | 'donator'
  | 'custom'
  | 'booster'
  | 'verified'
  | 'verified_instagram'
  | 'verified_tiktok'
  | 'verified_youtube'
  | 'verified_kick'
  | 'verified_twitch'
  | 'cyber_elite'
  | 'premium'
  | 'user';

export interface BadgeDefinition {
  id: BadgeType;
  name: string;
  shortName: string;
  category: 'hierarchy' | 'special' | 'social' | 'vip' | 'general';
  description: string;
  bgGradient: string;
  borderColor: string;
  textColor: string;
  glowColor: string;
  iconName: string;
}

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
  planTier?: 'free' | 'premium' | 'cyber_elite';
  premiumExpiresAt?: number;
  avatar?: string;
  statusMood?: string;
  bio?: string;
  violations?: number;
  infractions?: InfractionLog[];
  banReason?: string;
  banSeverity?: 'low' | 'medium' | 'high' | 'critical';
  banEvidence?: string;
  bannedAt?: number;
  ipWhitelist?: string[];
  badges?: string[];
  customBadgeText?: string;
}

export interface ForensicCase {
  id: string;
  roomId: string;
  roomName: string;
  offenderUserId: string;
  offenderEmail: string;
  offenderName: string;
  offenderIp: string;
  lawArticles: string[];
  violationSummary: string;
  evidenceSnippet: string;
  fullTranscript: string;
  messagesJson?: any[];
  timestamp: number;
  status: 'seized_and_banned';
  usersExpelledCount: number;
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
  senderBadges?: string[];
  senderCustomBadgeText?: string;
  encryptedText: string;
  text?: string;
  attachments?: Array<{ name: string; type: string; data: string; size?: string }>;
  replyTo?: { id: string; senderName: string; text: string };
  reactions?: Array<{emoji: string, senderName: string}> | any[];
  selfDestruct?: number;
  isPinned?: boolean;
  poll?: {
    question: string;
    options: Array<{ id: string; text: string; votes: string[] }>;
    totalVotes?: number;
    closed?: boolean;
  };
  format?: 'markdown' | 'code' | 'poll';
  codeLanguage?: string;
  readBy?: string[];
  status?: 'sending' | 'sent' | 'read';
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
  soundType?: 'futuristic' | 'chime' | 'pulse' | 'sonar';
  autoScroll: boolean;
  highContrast: boolean;
  chatBubbleStyle?: 'modern' | 'cyber' | 'minimal' | 'glass';
  chatPattern?: 'grid' | 'dots' | 'carbon' | 'subtle' | 'none';
  uiDensity?: 'compact' | 'comfortable' | 'spacious';
  timeFormat?: '12h' | '24h';
  messagePreview?: boolean;
  autoLockMinutes?: number;
  antiSpyMode?: boolean;
}
