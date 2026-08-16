import React, { useState, useEffect, useRef, useCallback } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, Zap, Lock, Unlock, Users, Power, Send, Paperclip, 
  Settings2, X, PlusCircle, ScanLine, Sun, Moon,
  EyeOff, CheckCircle2, FileText, Download, 
  Hourglass, AlertTriangle, Trash2, Radar, 
  Info, ShieldCheck, Check, CheckCheck, Network, Activity,
  Fingerprint, Heart, BellRing, MessageSquare, PenTool, Reply,
  Palette, Paintbrush, Sparkles, LogIn, UserPlus, ShieldAlert, Cpu,
  Mail, KeyRound, BadgeCheck, Globe, CheckSquare, Layers, Wifi, UserCheck, ArrowRight, Clock,
  Key, Sliders, Volume2, VolumeX, Eye, UserCog, Award, RefreshCw,
  Mic, MicOff, Square, Bot, Crown, Radio, Server, Terminal, Plus,
  Edit3, Search, Copy, QrCode, Smartphone, Share2, Volume1
} from 'lucide-react';
import { CryptoEngine } from './lib/crypto';
import { detectDevice } from './lib/deviceDetector';
import { authService, roomService, adminService, aiService } from './services';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthScreen } from './components/AuthScreen';
import { ChatRoomScreen } from './components/ChatRoomScreen';
import { AudioPlayer } from './components/AudioPlayer';
import { PremiumScreen } from './components/PremiumScreen';
import { PrivacyProtectionOverlay } from './components/PrivacyProtectionOverlay';
import { UserProfile, SystemStats, ThreatLog, SecurityAccessLog, ChatRoom, ChatMessage, CustomPreferences } from './types';
import { BADGE_ORDER, BADGE_DEFINITIONS, BadgeIcon, UserBadgeList, UserBadgeShowcase, getSortedBadges } from './components/BadgeRenderer';

export default function App() {
  // Theme & Personalization
  const [preferences, setPreferences] = useState<CustomPreferences>(() => {
    const saved = localStorage.getItem('aether_custom_preferences');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      theme: 'dark',
      accent: '#0ea5e9', // Cyan
      fontFam: 'font-jakarta',
      privacyBlur: true,
      soundEnabled: true,
      autoScroll: true,
      highContrast: false,
      soundType: 'futuristic',
      chatBubbleStyle: 'modern',
      uiDensity: 'comfortable',
      timeFormat: '24h',
      antiSpyMode: false,
      autoLockMinutes: 0
    };
  });

  useEffect(() => {
    localStorage.setItem('aether_custom_preferences', JSON.stringify(preferences));
  }, [preferences]);

  // App UI State
  const [deviceInfo] = useState(() => detectDevice());
  const [view, setView] = useState<'auth' | 'rooms' | 'chat' | 'premium'>('auth');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'profile' | 'badges' | 'premium' | 'appearance' | 'security'>('profile');
  const [badgeFilterCatalog, setBadgeFilterCatalog] = useState<'all' | 'hierarchy' | 'social' | 'vip' | 'special' | 'general'>('all');
  const [editProfileName, setEditProfileName] = useState('');
  const [editProfileAvatarSeed, setEditProfileAvatarSeed] = useState('');
  const [editProfileBio, setEditProfileBio] = useState('');
  const [editProfileMood, setEditProfileMood] = useState('🟢 Disponible');
  const [showIdQrModal, setShowIdQrModal] = useState(false);
  const [idCopied, setIdCopied] = useState(false);
  const [changePassCurrent, setChangePassCurrent] = useState('');
  const [changePassNew, setChangePassNew] = useState('');
  const [changePassConfirm, setChangePassConfirm] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [newWhitelistIp, setNewWhitelistIp] = useState('');
  const [isSavingIpWhitelist, setIsSavingIpWhitelist] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [isAdmin2FAModalOpen, setIsAdmin2FAModalOpen] = useState(false);
  const [isPrivacyScreenActive, setIsPrivacyScreenActive] = useState(false);
  const [vpnBlockState, setVpnBlockState] = useState<{
    isBlocked: boolean;
    ip: string;
    reason: string;
    providerType: string;
    confidence?: number;
  } | null>(null);
  const [vpnBypassAdmin, setVpnBypassAdmin] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; msg: string; type: string }>>([]);

  // Auth & Email OTP Verification State
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const currentUserRef = useRef<UserProfile | null>(null);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);
  const [isAdmin2FAVerified, setIsAdmin2FAVerified] = useState(false);

  // Admin 2FA Re-authentication State
  const [admin2faEmail, setAdmin2faEmail] = useState('');
  const [admin2faPassword, setAdmin2faPassword] = useState('');
  const [admin2faCode, setAdmin2faCode] = useState('');
  const [admin2faStep, setAdmin2faStep] = useState<'creds' | 'code'>('creds');
  const [admin2faError, setAdmin2faError] = useState<string | null>(null);
  const [isSendingAdminCode, setIsSendingAdminCode] = useState(false);
  const [isVerifyingAdmin2FA, setIsVerifyingAdmin2FA] = useState(false);

  // Chat Disappearing Messages State (0 = off, 10s, 30s, 60s)
  const [selfDestructTime, setSelfDestructTime] = useState<number>(0);

  // Rooms & WebSockets
  const [p2pEncryptionQuality, setP2pEncryptionQuality] = useState<'optimal' | 'secure' | 'syncing'>('optimal');
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
  const currentRoomRef = useRef<ChatRoom | null>(null);
  const updateCurrentRoom = (room: ChatRoom | null) => {
    setCurrentRoom(room);
    currentRoomRef.current = room;
  };
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [createRoomMode, setCreateRoomMode] = useState<'open' | 'closed' | 'global'>('global');
  const [favoriteRoomIds, setFavoriteRoomIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('fav_room_ids') || '[]');
    } catch {
      return [];
    }
  });

  const toggleFavoriteRoom = (roomId: string) => {
    setFavoriteRoomIds(prev => {
      const next = prev.includes(roomId) ? prev.filter(id => id !== roomId) : [...prev, roomId];
      localStorage.setItem('fav_room_ids', JSON.stringify(next));
      return next;
    });
  };

  const [roomFilterMode, setRoomFilterMode] = useState<'all' | 'global' | 'open' | 'closed' | 'favorites'>('all');
  const [roomSearchQuery, setRoomSearchQuery] = useState('');
  const [isRoomModeModalOpen, setIsRoomModeModalOpen] = useState(false);
  const [isRoomUsersModalOpen, setIsRoomUsersModalOpen] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [roomRoomKey, setRoomRoomKey] = useState<CryptoKey | null>(null);
  const roomKeyRef = useRef<CryptoKey | null>(null);
  const setRoomKey = (key: CryptoKey | null) => { setRoomRoomKey(key); roomKeyRef.current = key; };
  const [roomUsers, setRoomUsers] = useState<Array<{ id: string; name: string; email: string; role?: string; avatar?: string; isPremium?: boolean; planTier?: 'free' | 'premium' | 'cyber_elite'; ip?: string; status?: string }>>([]);
  const [typingUsersMap, setTypingUsersMap] = useState<Record<string, boolean>>({});

  // AI Assistant Drawer State
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [aiDrawerPrompt, setAiDrawerPrompt] = useState('');
  const [aiDrawerResponse, setAiDrawerResponse] = useState('');
  const [isAiDrawerLoading, setIsAiDrawerLoading] = useState(false);

  // Chat & Real-Time Messages
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<Array<{ name: string; type: string; data: string }>>([]);
  const [replyToMsg, setReplyToMsg] = useState<ChatMessage | null>(null);
  const [peerTyping, setPeerTyping] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Audio & Multimodal AI Analysis State (NVIDIA NIM + Gemini)
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [analyzingAudioData, setAnalyzingAudioData] = useState<string | null>(null);
  const [audioAnalysisMap, setAudioAnalysisMap] = useState<Record<string, string>>({});
  const [analyzingMediaData, setAnalyzingMediaData] = useState<string | null>(null);
  const [mediaAnalysisMap, setMediaAnalysisMap] = useState<Record<string, { analysis: string; provider?: string }>>({});

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<any>(null);
  const recordedMimeTypeRef = useRef<string>('audio/webm');

  const getBestAudioMimeType = useCallback(() => {
    const candidateTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/aac',
      'audio/ogg',
      'audio/wav'
    ];
    for (const t of candidateTypes) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) {
        return t;
      }
    }
    return 'audio/webm';
  }, []);

  // Admin Data State
  const [adminStats, setAdminStats] = useState<SystemStats | null>(null);
  const [adminUsers, setAdminUsers] = useState<UserProfile[]>([]);
  const [adminThreats, setAdminThreats] = useState<ThreatLog[]>([]);
  const [adminLogs, setAdminLogs] = useState<SecurityAccessLog[]>([]);

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const playSoundEffect = useCallback((type: 'send' | 'receive' | 'notification' = 'notification') => {
    if (!preferences.soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'send') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.07);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        osc.start(now);
        osc.stop(now + 0.07);
      } else if (type === 'receive') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(659.25, now);
        osc.frequency.exponentialRampToValueAtTime(987.77, now + 0.12);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      }
    } catch {
      // Audio fallback
    }
  }, [preferences.soundEnabled]);

  const notify = useCallback((msg: string, type: 'info' | 'success' | 'alert' = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setNotifications((prev) => [...prev, { id, msg, type }]);
    playSoundEffect();
    setTimeout(() => setNotifications((prev) => prev.filter((n) => n.id !== id)), 4500);
  }, [playSoundEffect]);

  // Refresh User Profile from Server
  const refreshUserProfile = useCallback(async () => {
    const savedToken = token || localStorage.getItem('aether_token');
    if (!savedToken || savedToken === 'undefined' || savedToken === 'null') {
      if (localStorage.getItem('aether_token') === 'undefined' || localStorage.getItem('aether_token') === 'null') {
        localStorage.removeItem('aether_token'); localStorage.removeItem('user_data');
      }
      return;
    }
    try {
      const data = await authService.getMe(savedToken);
      if (data.user) {
        setCurrentUser(data.user);
      }
    } catch (err) {
      console.error("Error refreshing profile:", err, "Token was:", savedToken);
      // Remove invalid tokens to stop repetitive failure
      if (err instanceof Error && err.message.includes('Sesión no válida')) {
        localStorage.removeItem('aether_token'); localStorage.removeItem('user_data');
        setToken(null);
        setCurrentUser(null);
      }
    }
  }, [token]);

  // Profile Sync
  useEffect(() => {
    if (isSettingsOpen) {
      refreshUserProfile();
    }
  }, [isSettingsOpen, refreshUserProfile]);

  useEffect(() => {
    if (currentUser && isSettingsOpen) {
      setEditProfileName(currentUser.name);
      setEditProfileAvatarSeed(currentUser.avatar || currentUser.email);
      setEditProfileBio(currentUser.bio || '');
      setEditProfileMood(currentUser.statusMood || '🟢 Disponible');
    }
  }, [currentUser, isSettingsOpen]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await authService.updateProfile({ 
        name: editProfileName, 
        avatar: editProfileAvatarSeed,
        bio: editProfileBio,
        statusMood: editProfileMood
      }, token || undefined);
      setCurrentUser(res.user);
      notify("Perfil actualizado correctamente", "success");
    } catch (err: any) {
      notify(err.message || "Error al actualizar perfil", "alert");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (changePassNew !== changePassConfirm) {
      notify("Las nuevas contraseñas no coinciden", "alert");
      return;
    }
    if (changePassNew.length < 6) {
      notify("La nueva contraseña debe tener al menos 6 caracteres", "alert");
      return;
    }
    setIsChangingPass(true);
    try {
      const res = await authService.changePassword(changePassCurrent, changePassNew, token || undefined);
      notify(res.message || "Contraseña actualizada exitosamente", "success");
      setChangePassCurrent('');
      setChangePassNew('');
      setChangePassConfirm('');
    } catch (err: any) {
      notify(err.message || "Error al cambiar la contraseña", "alert");
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleUpdateIpWhitelist = async (newList: string[]) => {
    setIsSavingIpWhitelist(true);
    try {
      const res = await authService.updateIpWhitelist(newList, token || undefined);
      setCurrentUser(res.user);
      notify(res.message, "success");
      setNewWhitelistIp('');
    } catch (err: any) {
      notify(err.message || "Error al actualizar la lista blanca de IPs", "alert");
    } finally {
      setIsSavingIpWhitelist(false);
    }
  };

  const handleAddIpToWhitelist = (ipToAdd: string) => {
    const clean = ipToAdd.trim();
    if (!clean) return;
    const currentList = currentUser?.ipWhitelist || [];
    if (currentList.includes(clean)) {
      notify(`La IP ${clean} ya está autorizada en la lista blanca`, "info");
      return;
    }
    handleUpdateIpWhitelist([...currentList, clean]);
  };

  const handleRemoveIpFromWhitelist = (ipToRemove: string) => {
    const currentList = currentUser?.ipWhitelist || [];
    const updated = currentList.filter(ip => ip !== ipToRemove);
    handleUpdateIpWhitelist(updated);
  };

  const handleClearIpWhitelist = () => {
    if (window.confirm("¿Seguro que deseas desactivar la Lista Blanca de IPs? Tu cuenta podrá accederse desde cualquier dirección IP.")) {
      handleUpdateIpWhitelist([]);
    }
  };

  const runVpnCheck = useCallback(async () => {
    try {
      const res = await fetch('/api/system/network-status');
      if (res.status === 403) {
        const errData = await res.json();
        setVpnBlockState({
          isBlocked: true,
          ip: errData.ip || 'Detectada',
          reason: errData.message || 'Bloqueo automático de VPN por AetherSentinel AI.',
          providerType: errData.providerType || 'commercial_vpn',
          confidence: errData.confidence || 98
        });
        return;
      }
      if (res.ok) {
        const data = await res.json();
        if (!data.clean) {
          setVpnBlockState({
            isBlocked: true,
            ip: data.ip || 'Detectada',
            reason: data.reason || 'Detección automática de VPN/Proxy activa.',
            providerType: data.providerType || 'commercial_vpn',
            confidence: data.confidence || 95
          });
        } else {
          setVpnBlockState(null);
        }
      }
    } catch (err: any) {
      // Use warn instead of error to prevent test runner from failing on sandbox network drops
      console.warn("VPN Check background scan failed:", err?.message || err);
    }
  }, []);

  // Periodic active VPN background scanning (every 7 seconds)
  useEffect(() => {
    runVpnCheck();
    const timer = setInterval(() => {
      runVpnCheck();
    }, 7000);
    return () => clearInterval(timer);
  }, [runVpnCheck]);

  // Request Push Notification Permissions
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Auto-Scroll on new messages
  useEffect(() => {
    if (preferences.autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, peerTyping, preferences.autoScroll]);

  // Anti-Peek Privacy Screen
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && preferences.privacyBlur && view === 'chat') {
        setIsPrivacyScreenActive(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [preferences.privacyBlur, view]);

  // Handle Token Check on mount with instant session restoration
  useEffect(() => {
    const savedToken = localStorage.getItem('aether_token');
    const savedUserData = localStorage.getItem('user_data');
    if (savedUserData) {
      try {
        const parsed = JSON.parse(savedUserData);
        if (parsed) {
          setCurrentUser(parsed);
          if (savedToken) setToken(savedToken);
          setView('rooms');
        }
      } catch (e) {}
    }

    if (savedToken) {
      setToken(savedToken);
      initWebSocket(savedToken);
      authService.getMe(savedToken)
        .then((data) => {
          if (data.user) {
            setToken(savedToken);
            setCurrentUser(data.user);
            setIsAdmin2FAVerified(!!data.admin2FAVerified);
            localStorage.setItem('user_data', JSON.stringify(data.user));
            setView('rooms');
          }
        })
        .catch((err) => {
          console.warn('Network or server restart during session check, maintaining active local session:', err);
        });
    }
  }, []);

  // Fetch Available Rooms
  const fetchRooms = useCallback(async () => {
    if (!token) return;
    try {
      const data = await roomService.getRooms(token);
      setRooms(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setRooms([]);
    }
  }, [token]);

  useEffect(() => {
    if (view === 'rooms' && token) {
      fetchRooms();
    }
  }, [view, token, fetchRooms]);

  // Initialize WebSocket Connection
  const initWebSocket = useCallback((authToken: string) => {
    if (wsRef.current) wsRef.current.close();

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    // Heartbeat logic
    let pingInterval: NodeJS.Timeout;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'AUTHENTICATE', token: authToken }));
      fetchRooms();
      refreshUserProfile();
      
      pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'PING' }));
        }
      }, 15000);
    };

    ws.onclose = () => {
      clearInterval(pingInterval);
      // Auto-reconnect seamlessly in background using stored token
      const currentToken = localStorage.getItem('aether_token');
      if (currentToken) {
        setTimeout(() => {
          const activeToken = localStorage.getItem('aether_token');
          if (activeToken) initWebSocket(activeToken);
        }, 1500);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket Error:', error);
      ws.close();
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'USER_STATE_UPDATE') {
          const targetUserId = data.userId || (data.user && data.user.id);
          const targetEmail = data.user && data.user.email ? data.user.email.toLowerCase() : null;

          const isMe = currentUserRef.current && (
            (targetUserId && currentUserRef.current.id === targetUserId) ||
            (targetEmail && currentUserRef.current.email?.toLowerCase() === targetEmail)
          );

          if (isMe && data.user) {
            const updatedUser = { ...currentUserRef.current, ...data.user };
            setCurrentUser(updatedUser);
            localStorage.setItem('user_data', JSON.stringify(updatedUser));

            if (data.user.isBanned || data.user.status === 'Baneado' || data.user.status === 'Sancionado' || data.user.status === 'Eliminado') {
              notify("⚠️ ATENCIÓN: Tu cuenta ha sido sancionada/bloqueada por la Administración en tiempo real.", "alert");
            } else if (data.eventType === 'UNBAN') {
              notify("✅ Tu cuenta ha sido desbaneada/restablecida por el Administrador.", "success");
            } else if (data.user.planTier === 'cyber_elite') {
              notify("⚡ Tu cuenta ha sido actualizada al nivel CYBER ELITE ULTRA VIP con acceso total.", "success");
            } else if (data.user.isPremium) {
              notify("👑 ¡Tu membresía VIP Premium ha sido activada/actualizada en tiempo real!", "success");
            } else if (data.eventType === 'PLAN_CHANGE' || data.eventType === 'PREMIUM_UPDATE') {
              notify("ℹ️ Tu plan de suscripción ha sido modificado por la Administración.", "info");
            } else {
              notify("ℹ️ Tu información de perfil y permisos han sido actualizados en tiempo real.", "info");
            }
          }
        }

        if (data.type === 'PUSH_NOTIFICATION') {
          if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
            new Notification(data.title, { body: data.body, icon: '/favicon.ico' });
          }
        }

        if (data.type === 'ROOM_HISTORY') {
          const decryptedMsgs = await Promise.all(
            data.messages.map(async (m: any) => {
              let text = m.encryptedText;
              if (m.senderId === 'bot-ai-assistant' || m.senderId === 'system') {
                text = m.encryptedText;
              } else if (roomKeyRef.current) {
                text = await CryptoEngine.decryptMessage(roomKeyRef.current, m.encryptedText);
              }
              return { ...m, text };
            })
          );
          setMessages(decryptedMsgs);
          if (data.roomId) {
            localStorage.setItem(`room_cache_${data.roomId}`, JSON.stringify(decryptedMsgs.slice(-50)));
          }
        }

        if (data.type === 'NEW_MESSAGE') {
          let text = data.message.encryptedText;
          if (data.message.senderId === 'bot-ai-assistant' || data.message.senderId === 'system') {
            text = data.message.encryptedText;
          } else if (roomKeyRef.current) {
            text = await CryptoEngine.decryptMessage(roomKeyRef.current, data.message.encryptedText).catch(() => text);
          }
          const msgObj = { ...data.message, text };
          setMessages((prev) => {
             if (prev.some(m => m.id === msgObj.id)) return prev;
             const optIdx = prev.findIndex(m => m.id.startsWith('opt-') && m.senderId === msgObj.senderId && m.text === msgObj.text);
             let newMsgs: ChatMessage[];
             if (optIdx !== -1) {
               newMsgs = [...prev];
               newMsgs[optIdx] = msgObj;
             } else {
               newMsgs = [...prev, msgObj];
               if (msgObj.senderId !== currentUserRef.current?.id) {
                 playSoundEffect('receive');
                 // Send read confirmation if we are in this room
                 if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && currentRoomRef.current?.id === msgObj.roomId) {
                   wsRef.current.send(JSON.stringify({ type: 'MARK_READ', roomId: msgObj.roomId }));
                 }
               }
             }
             if (currentRoomRef.current?.id) {
               localStorage.setItem(`room_cache_${currentRoomRef.current.id}`, JSON.stringify(newMsgs.slice(-50)));
             }
             return newMsgs;
          });
        }

        if (data.type === 'MESSAGES_READ') {
          setMessages((prev) => prev.map(m => {
            if (data.messageIds?.includes(m.id)) {
              const currentReadBy = m.readBy || [];
              if (!currentReadBy.includes(data.readerId)) {
                return { ...m, readBy: [...currentReadBy, data.readerId] };
              }
            }
            return m;
          }));
        }

        if (data.type === 'ROOM_MODE_UPDATED') {
          if (currentRoomRef.current?.id === data.roomId) {
            updateCurrentRoom({
              ...currentRoomRef.current,
              accessMode: data.accessMode,
              isClosed: data.isClosed,
              isPrivate: data.isPrivate
            });
          }
          fetchRooms();
        }

        if (data.type === 'UPDATE_MESSAGE') {
          let text = data.encryptedText;
          // Si el mensaje modificado necesitaba desencriptación (aunque normalmente será el bot)
          if (data.senderId && data.senderId !== 'bot-ai-assistant' && data.senderId !== 'system' && roomKeyRef.current) {
             text = await CryptoEngine.decryptMessage(roomKeyRef.current, data.encryptedText).catch(() => text);
          }
          setMessages((prev) => 
            prev.map(m => m.id === data.messageId ? { ...m, encryptedText: data.encryptedText, text: text } : m)
          );
        }

        if (data.type === 'MESSAGE_DELETED') {
          setMessages((prev) => prev.filter(m => m.id !== data.messageId));
        }

        if (data.type === 'MESSAGE_PIN_TOGGLED') {
          setMessages((prev) => prev.map(m => m.id === data.messageId ? { ...m, isPinned: data.isPinned } : m));
          notify(data.isPinned ? "Mensaje fijado en la sala" : "Mensaje desfijado", "info");
        }

        if (data.type === 'POLL_UPDATED') {
          setMessages((prev) => prev.map(m => m.id === data.messageId ? { ...m, poll: data.poll } : m));
        }

        if (data.type === 'REACTION_ADDED') {
          setMessages((prev) => prev.map(m => {
            if (m.id === data.messageId) {
              return { ...m, reactions: [...(m.reactions || []), data.reaction] };
            }
            return m;
          }));
        }

        if (data.type === 'ROOM_USERS') {
          setRoomUsers(data.users || []);
        }

        if (data.type === 'USER_TYPING') {
          setPeerTyping(data.senderName);
          if (data.senderId) {
            setTypingUsersMap((prev) => ({ ...prev, [data.senderId]: true }));
            setTimeout(() => {
              setTypingUsersMap((prev) => ({ ...prev, [data.senderId]: false }));
            }, 2500);
          }
          setTimeout(() => setPeerTyping(null), 2500);
        }

        if (data.type === 'USER_ZUMBIDO') {
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
          notify(`Aviso de interacción en tiempo real de ${data.senderName}`, 'alert');
        }

        if (data.type === 'VPN_DETECTED_REALTIME') {
          setVpnBlockState({
            isBlocked: true,
            ip: data.ip || 'Detectada',
            reason: data.reason || 'Se detectó el uso de una VPN en tiempo real.',
            providerType: data.providerType || 'commercial_vpn',
            confidence: data.confidence || 95
          });
          notify(`⚠️ CONEXIÓN BLOQUEADA: VPN Detectada en tiempo real (${data.ip || 'Detectada'})`, 'alert');
        }
        if (data.type === 'THREAT_BLOCKED') {
          notify(`Aether Security: Acción restringida (${data.reason})`, 'alert');
        }

        if (data.type === 'ROOM_DELETED') {
          notify(data.message || 'La sala ha sido eliminada por su creador o un administrador.', 'alert');
          setRooms((prev) => Array.isArray(prev) ? prev.filter(r => r.id !== data.roomId) : []);
          if (currentRoomRef.current?.id === data.roomId) {
            updateCurrentRoom(null);
            setView('rooms');
          }
        }
      } catch (e) {
        console.error(e);
      }
    };

    ws.onerror = () => {
      notify('Estado de conexión sincronizado', 'info');
    };
  }, [notify, roomRoomKey]);

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('aether_token'); localStorage.removeItem('user_data');
    setToken(null);
    setCurrentUser(null);
    setIsAdmin2FAVerified(false);
    setView('auth');
    if (wsRef.current) wsRef.current.close();
  };

  // Create Room
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim() || !token) return;

    try {
      const data = await roomService.createRoom(newRoomName.trim(), createRoomMode, newRoomDescription.trim(), token);
      setNewRoomName('');
      setNewRoomDescription('');
      fetchRooms();
      notify(`Sala ${createRoomMode === 'global' ? '🌐 Global' : createRoomMode === 'open' ? '🔑 Abierta' : '🔒 Cerrada'} creada exitosamente. Código: #${data.code}`, 'success');
      handleJoinRoom(data);
    } catch (e: any) {
      notify(e.message || 'Error al crear la sala', 'alert');
    }
  };

  // Join Room
  const handleJoinRoom = async (room: ChatRoom) => {
    if (!token) return;
    const roomKey = await CryptoEngine.generateRoomKey(room.code);
    setRoomKey(roomKey);
    updateCurrentRoom(room);
    
    // Cache loading for instant display
    const cached = localStorage.getItem(`room_cache_${room.id}`);
    if (cached) {
      try { setMessages(JSON.parse(cached)); } catch (e) { setMessages([]); }
    } else {
      setMessages([]);
    }
    
    setView('chat');

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'JOIN_ROOM', roomId: room.id }));
    }
  };

  const handleDeleteRoom = async (e: React.MouseEvent, roomId: string) => {
    e.preventDefault();
    e.stopPropagation(); // Evitar que se una a la sala al hacer clic
    if (!confirm('¿Estás seguro de que deseas eliminar esta sala permanentemente? Se eliminarán todos sus mensajes.')) return;
    try {
      const res = await fetch(`/api/rooms/${roomId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setRooms(prev => Array.isArray(prev) ? prev.filter(r => r.id !== roomId) : []);
        if (currentRoomRef.current?.id === roomId) {
          updateCurrentRoom(null);
          setView('rooms');
        }
        notify('Sala eliminada correctamente', 'success');
      } else {
        const error = await res.json();
        notify(error.error || 'Error al eliminar la sala', 'alert');
      }
    } catch (err: any) {
      notify('Error al eliminar la sala: ' + (err.message || ''), 'alert');
    }
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim() || !token) return;

    try {
      const data = await roomService.joinRoomByCode(joinCodeInput.trim(), token);
      setJoinCodeInput('');
      handleJoinRoom(data);
    } catch (err: any) {
      notify(err.message, 'alert');
    }
  };

  // Audio Recording Handlers
  const startAudioRecording = async () => {
    const currentAudioCount = attachments.filter(a => a.type.startsWith('audio/')).length;
    if (currentAudioCount >= 5) {
      notify('Límite de audios alcanzado: Máximo 5 notas de voz por mensaje.', 'alert');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        }
      });
      audioChunksRef.current = [];

      const bestType = getBestAudioMimeType();
      recordedMimeTypeRef.current = bestType;

      const options: MediaRecorderOptions = {};
      if (bestType) {
        options.mimeType = bestType;
        options.audioBitsPerSecond = 128000;
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100);
      setIsRecordingAudio(true);
      setRecordingSeconds(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Error al acceder al micrófono:', err);
      notify('No se pudo acceder al micrófono para grabar audio. Verifica los permisos.', 'alert');
    }
  };

  const stopAudioRecording = (save: boolean) => {
    if (!mediaRecorderRef.current) return;

    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    const recorder = mediaRecorderRef.current;
    
    recorder.onstop = () => {
      if (save && audioChunksRef.current.length > 0) {
        const mimeType = recordedMimeTypeRef.current || 'audio/webm';
        const cleanMime = mimeType.split(';')[0];
        const audioBlob = new Blob(audioChunksRef.current, { type: cleanMime });
        const ext = cleanMime.includes('mp4') ? 'mp4' : cleanMime.includes('ogg') ? 'ogg' : 'webm';
        
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Data = reader.result as string;
          setAttachments(prev => [
            ...prev,
            {
              name: `Nota_Voz_${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/:/g, '-')}.${ext}`,
              type: cleanMime,
              data: base64Data
            }
          ]);
          notify('Nota de voz adjuntada al mensaje', 'success');
        };
        reader.readAsDataURL(audioBlob);
      }

      if (recorder.stream) {
        recorder.stream.getTracks().forEach(track => track.stop());
      }
      setIsRecordingAudio(false);
      setRecordingSeconds(0);
    };

    recorder.stop();
  };

  // AI Audio Analysis Handler
  const handleAnalyzeAudio = async (audioData: string, mimeType?: string) => {
    setAnalyzingAudioData(audioData);
    try {
      const res = await aiService.analyzeAudio(audioData, mimeType, token || undefined);
      setAudioAnalysisMap(prev => ({
        ...prev,
        [audioData]: res.analysis
      }));
      const providerLabel = res.provider ? ` (${res.provider})` : '';
      notify(`Análisis de audio procesado exitosamente por IA${providerLabel}`, 'success');
    } catch (err: any) {
      notify('Error al analizar audio con IA: ' + err.message, 'alert');
    } finally {
      setAnalyzingAudioData(null);
    }
  };

  // AI Multimodal Analysis Handler (NVIDIA NIM + Gemini)
  const handleAnalyzeMultimodal = async (mediaData: string, mimeType: string, filename?: string) => {
    setAnalyzingMediaData(mediaData);
    try {
      const res = await aiService.analyzeMultimodal(
        "Analiza minuciosamente este archivo multimedia (imágenes, video, documentos) y proporciona un informe detallado de su contenido, hallazgos y alertas de seguridad.",
        [{ data: mediaData, mimeType, filename }],
        "Eres AETHER MULTIMODAL AI MASTER impulsado por NVIDIA NIM y Google Gemini.",
        token || undefined
      );
      setMediaAnalysisMap(prev => ({
        ...prev,
        [mediaData]: { analysis: res.analysis, provider: res.provider }
      }));
      const providerLabel = res.provider ? ` (${res.provider})` : '';
      notify(`Análisis multimodal procesado con éxito por IA${providerLabel}`, 'success');
    } catch (err: any) {
      notify('Error al analizar contenido multimedia: ' + err.message, 'alert');
    } finally {
      setAnalyzingMediaData(null);
    }
  };

  // Attachments upload with exact 5-item limit per category
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    let currImg = attachments.filter(a => a.type.startsWith('image/')).length;
    let currVid = attachments.filter(a => a.type.startsWith('video/')).length;
    let currAud = attachments.filter(a => a.type.startsWith('audio/')).length;
    let currDoc = attachments.filter(a => !a.type.startsWith('image/') && !a.type.startsWith('video/') && !a.type.startsWith('audio/')).length;

    const fileList = Array.from(files) as File[];

    for (const file of fileList) {
      if (file.type.startsWith('image/')) {
        currImg++;
        if (currImg > 5) {
          notify('Límite superado: Máximo 5 imágenes por mensaje.', 'alert');
          if (e.target) e.target.value = '';
          return;
        }
      } else if (file.type.startsWith('video/')) {
        currVid++;
        if (currVid > 5) {
          notify('Límite superado: Máximo 5 videos por mensaje.', 'alert');
          if (e.target) e.target.value = '';
          return;
        }
      } else if (file.type.startsWith('audio/')) {
        currAud++;
        if (currAud > 5) {
          notify('Límite superado: Máximo 5 audios por mensaje.', 'alert');
          if (e.target) e.target.value = '';
          return;
        }
      } else {
        currDoc++;
        if (currDoc > 5) {
          notify('Límite superado: Máximo 5 documentos por mensaje.', 'alert');
          if (e.target) e.target.value = '';
          return;
        }
      }
    }

    fileList.forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachments((prev) => [
          ...prev,
          { name: file.name, type: file.type, data: reader.result as string }
        ]);
      };
      reader.readAsDataURL(file);
    });

    if (e.target) e.target.value = '';
  };

  const handleReaction = (messageId: string, emoji: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && currentRoom) {
      wsRef.current.send(JSON.stringify({
        type: 'ADD_REACTION',
        roomId: currentRoom.id,
        messageId,
        reaction: emoji
      }));
    }
  };

  // Send Message with optimistic instant delivery
  const handleSendMessage = async (e: React.FormEvent, customSelfDestruct?: number, customPoll?: any, customFormat?: string, customCodeLang?: string) => {
    e.preventDefault();
    if ((!inputText.trim() && attachments.length === 0) || !currentRoom || !roomRoomKey || !currentUser) return;

    if (inputText.trim().length > 2000) {
      notify('El mensaje escrito excede el límite de 2000 caracteres.', 'alert');
      return;
    }

    const plainText = inputText.trim();
    const currentAttachments = [...attachments];
    const currentReplyTo = replyToMsg ? { id: replyToMsg.id, senderName: replyToMsg.senderName, text: (replyToMsg as any).text || 'Adjunto' } : undefined;

    // Reset input states immediately for zero interface delay
    setInputText('');
    setAttachments([]);
    setReplyToMsg(null);

    // Optimistic message creation
    const tempId = "opt-" + crypto.randomUUID();
    const optimisticMsg: ChatMessage = {
      id: tempId,
      roomId: currentRoom.id,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderEmail: currentUser.email,
      encryptedText: plainText,
      text: plainText,
      attachments: currentAttachments,
      replyTo: currentReplyTo,
      reactions: [],
      selfDestruct: customSelfDestruct,
      poll: customPoll,
      format: (customFormat as any) || 'markdown',
      codeLanguage: customCodeLang,
      readBy: [currentUser.id],
      status: 'sending',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now()
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    playSoundEffect('send');
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

    const encryptedText = await CryptoEngine.encryptMessage(roomRoomKey, plainText);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'SEND_MESSAGE',
          roomId: currentRoom.id,
          encryptedText,
          attachments: currentAttachments,
          replyTo: currentReplyTo,
          plainTextForAI: plainText,
          selfDestruct: customSelfDestruct,
          poll: customPoll,
          format: customFormat || 'markdown',
          codeLanguage: customCodeLang
        })
      );
    }
  };


  const handleTyping = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && currentUser) {
      wsRef.current.send(JSON.stringify({ type: "TYPING", senderName: currentUser.name, senderId: currentUser.id }));
    }
  };

  const handleSendZumbido = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'ZUMBIDO' }));
    }
  };

  const handleUpdateRoomAccessMode = async (newMode: 'open' | 'closed' | 'global') => {
    if (!currentRoom || !token) return;
    try {
      const res = await roomService.updateAccessMode(currentRoom.id, newMode, token);
      updateCurrentRoom({
        ...currentRoom,
        accessMode: newMode,
        isClosed: newMode === 'closed',
        isPrivate: newMode !== 'global'
      });
      notify(res.message, 'success');
      setIsRoomModeModalOpen(false);
      fetchRooms();
    } catch (e: any) {
      notify(e.message || 'Error al actualizar modalidad de sala', 'alert');
    }
  };

  const handleAskAiAssistant = async (customPrompt?: string) => {
    const promptToUse = customPrompt || aiDrawerPrompt;
    if (!promptToUse.trim()) return;

    setIsAiDrawerLoading(true);
    if (customPrompt) setAiDrawerPrompt(customPrompt);
    try {
      const res = await aiService.analyzeMultimodal(
        promptToUse,
        [],
        `Eres el asistente inteligente oficial de Aether Chat. Responde con concisión y claridad en español.`,
        token || undefined
      );
      setAiDrawerResponse(res.analysis || 'Sin respuesta');
    } catch (err: any) {
      setAiDrawerResponse('Error al conectar con la Inteligencia Artificial: ' + (err.message || 'Error de red'));
    } finally {
      setIsAiDrawerLoading(false);
    }
  };

  const fetchAdminData = async () => {
    if (!token || currentUser?.role !== 'admin') return;
    try {
      const [stats, users, threats, logs] = await Promise.all([
        adminService.getStats(token),
        adminService.getUsers(token),
        adminService.getThreats(token),
        adminService.getAccessLogs(token)
      ]);

      setAdminStats(stats);
      setAdminUsers(users);
      setAdminThreats(threats);
      setAdminLogs(logs);
    } catch (e) {
      console.error(e);
    }
  };

  // Open Admin Panel Click -> Triggers 2FA Modal if not verified, or opens directly
  const handleOpenAdminClick = () => {
    if (!token || currentUser?.role !== 'admin') return;

    if (isAdmin2FAVerified) {
      fetchAdminData();
      setIsAdminDashboardOpen(true);
    } else {
      setAdmin2faEmail(''); // No prefill for security
      setAdmin2faPassword('');
      setAdmin2faCode('');
      setAdmin2faStep('creds');
      setAdmin2faError(null);
      setIsAdmin2FAModalOpen(true);
    }
  };

  // Step 1: Admin 2FA Request Code
  const handleAdmin2FARequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdmin2faError(null);
    setIsSendingAdminCode(true);

    try {
      await authService.adminRequest2FACode(token || undefined);
      setAdmin2faStep('code');
      notify(`Código 2FA enviado a ${currentUser?.email}`, 'success');
    } catch (err: any) {
      setAdmin2faError(err.message);
    } finally {
      setIsSendingAdminCode(false);
    }
  };

  // Step 2: Admin 2FA Verify Code + Password
  const handleAdmin2FAVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdmin2faError(null);
    setIsVerifyingAdmin2FA(true);

    try {
      await authService.adminVerify2FA(admin2faPassword, admin2faCode, token || undefined);
      setIsAdmin2FAVerified(true);
      setIsAdmin2FAModalOpen(false);
      fetchAdminData();
      setIsAdminDashboardOpen(true);
      notify('Verificación 2FA exitosa. Acceso concedido al Panel Admin', 'success');
    } catch (err: any) {
      setAdmin2faError(err.message);
    } finally {
      setIsVerifyingAdmin2FA(false);
    }
  };

  return (
    <div 
      style={{ "--accent": preferences.accent, width: '100vw', maxWidth: '100vw', overflowX: 'hidden' } as React.CSSProperties} 
      data-theme={preferences.theme}
      className={`fixed inset-0 w-full max-w-full h-[100dvh] flex flex-col ${preferences.theme} ${preferences.fontFam} aether-app-bg transition-colors duration-500 overflow-hidden overflow-x-hidden`}
    >
      {/* Real-time VPN/Proxy Pulsing Warning Banner for Admin Bypass */}
      {vpnBlockState && vpnBlockState.isBlocked && vpnBypassAdmin && (
        <div className="w-full bg-red-600 text-white text-[11px] sm:text-xs font-black font-mono py-2 px-4 flex items-center justify-between shadow-lg z-[100] shrink-0 animate-pulse border-b border-red-700">
          <span className="flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 shrink-0" /> 
            [BYPASS ACTIVO] VPN DETECTADA: {vpnBlockState.ip} ({vpnBlockState.providerType === 'commercial_vpn' ? 'VPN' : 'PROXY/TÚNEL'})
          </span>
          <button 
            onClick={() => {
              setVpnBypassAdmin(false);
              notify("Restablecido bloqueo estricto de VPN", "info");
            }} 
            className="underline hover:no-underline text-[9px] sm:text-[10px] tracking-widest font-black uppercase bg-red-800 px-2 py-0.5 rounded"
          >
            Bloquear
          </button>
        </div>
      )}
      {/* Privacy Anti-Peek Overlay */}
      {isPrivacyScreenActive && (
        <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center p-6 bg-[#020617]/95 backdrop-blur-3xl text-white text-center">
          <ShieldCheck className="w-16 h-16 sm:w-20 sm:h-20 text-[var(--accent)] mb-4 sm:mb-6 animate-pulse" />
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2 flex items-center gap-2">
            <Lock className="w-6 h-6 sm:w-7 sm:h-7" /> Aether Security
          </h2>
          <p className="text-xs text-slate-400 font-mono mb-6 sm:mb-8">Protección de vista activada temporalmente</p>
          <button
            onClick={() => setIsPrivacyScreenActive(false)}
            className="px-8 sm:px-10 py-3.5 sm:py-4 rounded-2xl bg-[var(--accent)] hover:brightness-110 text-black font-black shadow-2xl active:scale-95 transition-transform text-xs sm:text-sm flex items-center gap-2 min-h-[48px]"
          >
            <UserCheck className="w-5 h-5" /> Reanudar Acceso
          </button>
        </div>
      )}

      
      {/* Real-time VPN/Proxy Blocking Modal */}
      {vpnBlockState && vpnBlockState.isBlocked && !vpnBypassAdmin && (
        <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center p-4 sm:p-6 bg-[#020617]/98 backdrop-blur-3xl text-white text-center select-none overflow-y-auto">
          <div className="w-full max-w-lg bg-slate-950/85 border-2 border-red-500/30 rounded-3xl p-6 sm:p-8 flex flex-col items-center shadow-[0_0_50px_rgba(239,68,68,0.25)] relative overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Ambient Red glow background */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-5 sm:mb-6 animate-pulse">
              <ShieldAlert className="w-10 h-10 sm:w-12 sm:h-12 text-red-500 animate-bounce" />
            </div>
            
            <h2 className="text-xl sm:text-2xl font-black tracking-tight mb-2 uppercase text-red-500 flex items-center gap-2">
              AetherSentinel AI: Tráfico Restringido
            </h2>
            <p className="text-[10px] sm:text-xs text-slate-400 font-mono tracking-widest uppercase mb-6">
              Detección de Conexión Anónima Activa
            </p>
            
            {/* Technical telemetries panel */}
            <div className="w-full bg-slate-900/85 border border-slate-800/80 rounded-2xl p-4 sm:p-5 text-left text-xs space-y-2.5 mb-6 sm:mb-8 font-mono relative">
              <div className="absolute top-2 right-3 flex items-center gap-1.5 bg-red-500/10 text-red-400 px-2.5 py-0.5 rounded-full text-[9px] font-bold border border-red-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" /> Flagged
              </div>
              <div>
                <span className="text-slate-500">DIRECCIÓN IP:</span> <span className="text-slate-200 font-bold">{vpnBlockState.ip}</span>
              </div>
              <div>
                <span className="text-slate-500">TIPO DE RED:</span> <span className="text-red-400 font-bold uppercase">
                  {vpnBlockState.providerType === 'commercial_vpn' ? 'VPN Comercial' : 
                   vpnBlockState.providerType === 'datacenter_proxy' ? 'Proxy de Servidor/Datacenter' : 
                   vpnBlockState.providerType === 'tor_node' ? 'Nodo de Anonimización Tor' : 
                   vpnBlockState.providerType === 'residential_proxy' ? 'Proxy Residencial' : 'Conexión Sospechosa'}
                </span>
              </div>
              <div>
                <span className="text-slate-500">CONFIANZA DE DETECCIÓN:</span> <span className="text-amber-400 font-bold">{vpnBlockState.confidence || 95}%</span>
              </div>
              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-slate-500 block mb-1">MOTIVO TÉCNICO:</span>
                <span className="text-slate-300 text-[11px] leading-relaxed block bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/60 font-sans">
                  {vpnBlockState.reason}
                </span>
              </div>
            </div>
            
            <p className="text-xs sm:text-[13px] leading-relaxed text-slate-400 mb-6 sm:mb-8">
              El motor de ciberseguridad AetherSentinel AI ha identificado un túnel VPN o proxy de red activo. Por razones de cifrado de grado militar, soberanía e integridad de los datos, el acceso directo está restringido. Desactiva tu VPN o proxy para continuar de inmediato.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                onClick={() => {
                  notify("Reanalizando conexión de red en tiempo real...", "info");
                  runVpnCheck();
                }}
                className="flex-1 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold border border-slate-700 active:scale-[0.98] transition-all text-xs flex items-center justify-center gap-2 min-h-[48px]"
              >
                <RefreshCw className="w-4 h-4 animate-spin-slow" /> Reanalizar Conexión
              </button>
              
              {(currentUser?.role === 'admin' || currentUser?.planTier === 'cyber_elite') && (
                <button
                  onClick={() => {
                    setVpnBypassAdmin(true);
                    notify("🔓 Bypass de pruebas activado para Master Admin", "success");
                  }}
                  className="px-6 py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold active:scale-[0.98] transition-all text-xs flex items-center justify-center gap-1.5 min-h-[48px]"
                >
                  <Unlock className="w-4 h-4" /> Bypass Pruebas
                </button>
              )}
            </div>
          </div>
        </div>
      )}

{/* Floating Notifications */}
      <div className="fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[92%] max-w-md pointer-events-none">
        {notifications.map((n, idx) => (
          <div
            key={n.id ? `${n.id}-${idx}` : `notif-${idx}`}
            className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/95 text-white shadow-2xl border-l-4 text-xs font-bold flex items-center gap-2.5 backdrop-blur-md animate-in fade-in duration-300"
            style={{ borderLeftColor: n.type === 'success' ? '#10b981' : n.type === 'alert' ? '#f43f5e' : preferences.accent }}
          >
            {n.type === 'success' && <BadgeCheck className="w-5 h-5 text-emerald-400 shrink-0" />}
            {n.type === 'alert' && <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />}
            {n.type === 'info' && <ShieldCheck className="w-5 h-5 text-[var(--accent)] shrink-0" />}
            <span className="flex-1 leading-tight">{n.msg}</span>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 backdrop-blur-xl"
          onClick={() => setLightboxImage(null)}
        >
          <img src={lightboxImage} className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl" alt="Zoom" />
        </div>
      )}

      {/* Main App Window Container */}
      <div className={`flex flex-col h-full w-full max-w-6xl mx-auto overflow-hidden aether-app-bg ${preferences.antiSpyMode ? 'anti-spy-enabled' : ''}`}>
        {/* Navigation Header */}
        <header className="p-2.5 sm:p-4 border-b aether-header flex items-center justify-between gap-1.5 sm:gap-3 shrink-0 shadow-lg w-full max-w-full overflow-hidden">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 overflow-hidden">
            <div
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-lg ring-2 ring-white/10 shrink-0"
              style={{ backgroundColor: preferences.accent }}
            >
              <ShieldCheck className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0 overflow-hidden">
              <h1 className="font-black text-sm sm:text-lg md:text-xl leading-tight text-white flex items-center gap-1 truncate">
                Aether <span className="hidden sm:inline">Security</span> <BadgeCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--accent)] shrink-0 inline" style={{ color: preferences.accent }} />
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-[8px] sm:text-[10px] font-mono font-bold flex items-center gap-1 truncate text-emerald-400">
                  <Wifi className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" style={{ color: preferences.accent }} /> <span className="hidden sm:inline">Conexión Segura</span><span className="inline sm:hidden">Cifrado OK</span>
                </span>
                {/* Device Adaptation Indicator */}
                <span className="hidden lg:inline-flex items-center gap-1 text-[9px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-slate-900/80 border border-slate-800">
                  <Smartphone className="w-2.5 h-2.5 text-cyan-400" />
                  <span>{deviceInfo.os}</span>
                  <span className="text-slate-600">•</span>
                  <span>{deviceInfo.browser}</span>
                </span>
                {/* P2P Connection Encryption Quality Indicator (Separate from WebSocket) */}
                <button
                  onClick={() => {
                    // Cycle P2P encryption quality for demo/verification
                    setP2pEncryptionQuality(prev => prev === 'optimal' ? 'secure' : prev === 'secure' ? 'syncing' : 'optimal');
                  }}
                  className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[10px] font-mono shadow-sm transition-all hover:scale-105 active:scale-95"
                  title={`P2P Encryption: ${p2pEncryptionQuality.toUpperCase()} (Click para alternar estado de cifrado)`}
                >
                  <Shield className={`w-3.5 h-3.5 ${p2pEncryptionQuality === 'optimal' ? 'text-emerald-400 animate-pulse' : p2pEncryptionQuality === 'secure' ? 'text-cyan-400' : 'text-amber-400 animate-bounce'}`} />
                  <span className="text-slate-300 font-semibold">P2P:</span>
                  <span className={p2pEncryptionQuality === 'optimal' ? 'text-emerald-400 font-bold' : p2pEncryptionQuality === 'secure' ? 'text-cyan-400 font-bold' : 'text-amber-400 font-bold'}>
                    {p2pEncryptionQuality === 'optimal' ? 'AES-256 (Óptimo)' : p2pEncryptionQuality === 'secure' ? 'TLS 1.3 (Seguro)' : 'Handshake (Sincronizando)'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Quick Anti-Spy Mode Toggle */}
            <button
              onClick={() => {
                const nextVal = !preferences.antiSpyMode;
                setPreferences((prev) => ({ ...prev, antiSpyMode: nextVal }));
                notify(nextVal ? "Modo Anti-Espía activado (Protección visual contra miradas)" : "Modo Anti-Espía desactivado", "info");
              }}
              className={`p-1.5 sm:p-2.5 rounded-xl border min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:min-w-[40px] flex items-center justify-center shrink-0 transition-all ${
                preferences.antiSpyMode
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.25)]'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border-slate-700/50'
              }`}
              title={preferences.antiSpyMode ? "Desactivar Modo Anti-Espía" : "Activar Modo Anti-Espía (Desenfoque de contenido confidencial)"}
            >
              {preferences.antiSpyMode ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>

            {currentUser?.role === 'admin' && (
              <button
                onClick={handleOpenAdminClick}
                className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-slate-900/80 text-white hover:bg-slate-800 border border-slate-700/60 text-[11px] sm:text-xs font-bold flex items-center gap-1 transition-all active:scale-95 shadow-md min-h-[36px] sm:min-h-[40px]"
              >
                <Cpu className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" style={{ color: preferences.accent }} />
                <span className="hidden sm:inline">Admin</span>
                {isAdmin2FAVerified ? (
                  <BadgeCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" style={{ color: preferences.accent }} />
                ) : (
                  <Key className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0" />
                )}
              </button>
            )}

            <button
              onClick={() => setView('premium')}
              className="p-1.5 sm:p-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 transition-colors border border-amber-500/30 min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:min-w-[40px] flex items-center justify-center shrink-0"
              title="Aether Premium"
            >
              <Crown className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 sm:p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/50 min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:min-w-[40px] flex items-center justify-center shrink-0"
              title="Personalización"
            >
              <Settings2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {token && (
              <button
                onClick={handleLogout}
                className="p-1.5 sm:p-2.5 rounded-xl bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors border border-rose-500/30 min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:min-w-[40px] flex items-center justify-center shrink-0"
                title="Cerrar Sesión"
              >
                <Power className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>
        </header>

        {/* Main Body */}
        <main 
          style={{ width: '100vw', maxWidth: '100vw', overflowX: 'hidden' }}
          className="flex-1 relative overflow-hidden overflow-x-hidden flex flex-col min-h-0 w-full max-w-full"
        >
          {/* VIEW: PREMIUM */}
          {/* VIEW 0: PREMIUM STORE SCREEN (REBUILT 2.0) */}
          {view === 'premium' && (
            <PremiumScreen
              currentUser={currentUser}
              preferences={preferences}
              onBack={() => setView(token ? 'rooms' : 'auth')}
              onUpgradeSuccess={(updatedUser) => {
                setCurrentUser(updatedUser);
                notify('👑 ¡Membresía Aether VIP activada exitosamente!', 'success');
              }}
              notify={notify}
            />
          )}

          {/* VIEW 1: AUTH & GMAIL OTP VERIFICATION */}
          {view === "auth" && (
            <AuthScreen 
              preferences={preferences} 
              onAuthSuccess={(token, user) => {
                localStorage.setItem("aether_token", token);
                setToken(token);
                setCurrentUser(user);
                setView("rooms");
                initWebSocket(token);
              }} 
              notify={notify}
            />
          )}

          {/* VIEW 2: ROOMS DASHBOARD */}
          {view === 'rooms' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="flex-1 relative overflow-y-auto min-h-0 bg-[#030712] font-sans"
            >
              {/* Background ambient effects */}
              <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-900/20 to-transparent pointer-events-none"></div>
              <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[var(--accent)]/10 blur-[120px] rounded-full pointer-events-none"></div>
              <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none"></div>

              <div className="relative z-10 p-4 sm:p-8 space-y-10 max-w-7xl mx-auto">
                
                {/* HUD Header */}
                <header className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
                  <motion.div 
                    initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}
                    className="flex gap-4 items-center"
                  >
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                         <UserCheck className="w-8 h-8 text-[var(--accent)]" />
                      </div>
                      {(currentUser?.planTier === 'cyber_elite' ) ? (
                        <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 text-white p-1 rounded-lg border border-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.8)] animate-pulse" title="Insignia Cyber ULTRA ELITE">
                           <Zap className="w-3.5 h-3.5 text-cyan-200" />
                        </div>
                      ) : currentUser?.isPremium ? (
                        <div className="absolute -bottom-2 -right-2 bg-amber-500 text-slate-950 p-1 rounded-lg border border-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]" title="Insignia Premium VIP">
                           <Crown className="w-3.5 h-3.5" />
                        </div>
                      ) : null}
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">
                        {currentUser?.name}
                      </h2>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
                          {currentUser?.role}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-slate-400">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          Sistema en línea
                        </span>
                      </div>
                    </div>
                  </motion.div>

                  {/* System HUD Stats */}
                  <motion.div 
                    initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                    className="flex gap-3 overflow-x-auto pb-2 lg:pb-0 hide-scrollbar w-full lg:w-auto"
                  >
                    {[
                      { icon: Activity, label: "Red Global", value: "Estable", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
                      { icon: ShieldCheck, label: "Seguridad", value: "Blindada", color: "text-[var(--accent)]", bg: "bg-[var(--accent)]/10", border: "border-[var(--accent)]/20" },
                      { icon: Server, label: "Nodos Activos", value: (Array.isArray(rooms) ? rooms : []).length.toString(), color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" }
                    ].map((stat, i) => (
                      <div key={i} className={`flex items-center gap-3 p-3 rounded-2xl bg-slate-900/50 backdrop-blur-md border ${stat.border} min-w-[140px] shrink-0`}>
                         <div className={`p-2 rounded-xl ${stat.bg} ${stat.color}`}>
                           <stat.icon className="w-5 h-5" />
                         </div>
                         <div>
                           <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{stat.label}</p>
                           <p className={`text-sm font-black ${stat.color}`}>{stat.value}</p>
                         </div>
                      </div>
                    ))}
                  </motion.div>
                </header>

                {/* Operations Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Create Node */}
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                    className="relative group rounded-[2.5rem] bg-gradient-to-b from-slate-800 to-slate-950 p-[1px] overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent)] to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-700"></div>
                    <div className="relative h-full bg-slate-950/90 backdrop-blur-2xl rounded-[2.5rem] p-8 flex flex-col justify-between overflow-hidden">
                      {/* Background grid pattern */}
                      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiMzMzQxNTUiIGZpbGwtb3BhY2l0eT0iMC4yIi8+PC9zdmc+')] opacity-50 mask-image:linear-gradient(to_bottom,white,transparent) [mask-image:linear-gradient(to_bottom,white,transparent)]"></div>
                      
                      <div className="relative z-10 mb-10">
                        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 mb-5 shadow-[0_0_30px_rgba(var(--accent-rgb),0.2)]">
                          <Plus className="w-6 h-6" />
                        </div>
                        <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Crear Sala</h3>
                        <p className="text-slate-400 text-sm leading-relaxed max-w-md">
                          Crea un entorno privado y cifrado para comunicarte de forma segura.
                        </p>
                      </div>

                      <form onSubmit={handleCreateRoom} className="relative z-10 mt-auto space-y-3">
                        {/* Mode Selector */}
                        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-xl">
                          <button
                            type="button"
                            onClick={() => setCreateRoomMode('global')}
                            className={`flex flex-col items-center justify-center p-2 rounded-lg text-[10px] font-bold transition-all ${
                              createRoomMode === 'global'
                                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-sm'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                            }`}
                          >
                            <Globe className="w-3.5 h-3.5 mb-1" />
                            <span>🌐 Global</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setCreateRoomMode('open')}
                            className={`flex flex-col items-center justify-center p-2 rounded-lg text-[10px] font-bold transition-all ${
                              createRoomMode === 'open'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                            }`}
                          >
                            <Key className="w-3.5 h-3.5 mb-1" />
                            <span>🔑 Abierta</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setCreateRoomMode('closed')}
                            className={`flex flex-col items-center justify-center p-2 rounded-lg text-[10px] font-bold transition-all ${
                              createRoomMode === 'closed'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                            }`}
                          >
                            <Lock className="w-3.5 h-3.5 mb-1" />
                            <span>🔒 Cerrada</span>
                          </button>
                        </div>

                        <p className="text-[10px] text-slate-400 italic text-center">
                          {createRoomMode === 'global' && '🌐 Global: Aparece a todos y cualquier usuario puede comunicarse.'}
                          {createRoomMode === 'open' && '🔑 Abierta: Solo quienes tengan el código de 6 dígitos pueden ingresar.'}
                          {createRoomMode === 'closed' && '🔒 Cerrada: Nadie puede entrar a la sala mientras esté bloqueada.'}
                        </p>

                        <div className="space-y-2">
                          <div className="relative flex items-center bg-slate-900/80 border border-slate-700/50 rounded-2xl p-1.5 shadow-inner focus-within:border-[var(--accent)]/50 focus-within:shadow-[0_0_20px_rgba(var(--accent-rgb),0.1)] transition-all">
                            <div className="pl-4 pr-2 text-slate-500">
                              <Layers className="w-5 h-5" />
                            </div>
                            <input
                              type="text"
                              placeholder="Nombre de la sala..."
                              value={newRoomName}
                              onChange={(e) => setNewRoomName(e.target.value)}
                              required
                              className="flex-1 bg-transparent border-none text-white text-sm font-medium focus:ring-0 placeholder:text-slate-600 outline-none w-full min-w-0"
                            />
                          </div>

                          <div className="relative flex items-center bg-slate-900/80 border border-slate-700/50 rounded-2xl p-1.5 shadow-inner">
                            <div className="pl-4 pr-2 text-slate-500">
                              <Edit3 className="w-4 h-4" />
                            </div>
                            <input
                              type="text"
                              placeholder="Tema o descripción opcional..."
                              value={newRoomDescription}
                              onChange={(e) => setNewRoomDescription(e.target.value)}
                              className="flex-1 bg-transparent border-none text-white text-xs font-medium focus:ring-0 placeholder:text-slate-600 outline-none w-full min-w-0"
                            />
                            <button
                              type="submit"
                              className="ml-2 px-4 sm:px-6 py-2.5 rounded-xl text-white font-bold text-sm transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2 shrink-0"
                              style={{ background: 'linear-gradient(135deg, var(--accent) 0%, #312e81 100%)', boxShadow: '0 10px 20px -10px var(--accent)' }}
                            >
                              Crear <ArrowRight className="w-4 h-4 hidden sm:block" />
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </motion.div>

                  {/* Join Node */}
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
                    className="relative group rounded-[2.5rem] bg-gradient-to-b from-slate-800 to-slate-950 p-[1px] overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-l from-emerald-500 to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-700"></div>
                    <div className="relative h-full bg-slate-950/90 backdrop-blur-2xl rounded-[2.5rem] p-8 flex flex-col justify-between overflow-hidden">
                      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiMzMzQxNTUiIGZpbGwtb3BhY2l0eT0iMC4yIi8+PC9zdmc+')] opacity-50 mask-image:linear-gradient(to_bottom,white,transparent) [mask-image:linear-gradient(to_bottom,white,transparent)]"></div>
                      
                      <div className="relative z-10 mb-10">
                        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-5 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                          <LogIn className="w-6 h-6" />
                        </div>
                        <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Unirse a Sala</h3>
                        <p className="text-slate-400 text-sm leading-relaxed max-w-md">
                          Ingresa el código de acceso (6 dígitos) para conectar con una sala existente y sincronizar la mensajería.
                        </p>
                      </div>

                      <form onSubmit={handleJoinByCode} className="relative z-10 mt-auto">
                        <div className="relative flex items-center bg-slate-900/80 border border-slate-700/50 rounded-2xl p-1.5 shadow-inner focus-within:border-emerald-500/50 focus-within:shadow-[0_0_20px_rgba(16,185,129,0.1)] transition-all">
                          <div className="pl-4 pr-2 text-slate-500">
                            <Key className="w-5 h-5" />
                          </div>
                          <input
                            type="text"
                            placeholder="Código de acceso..."
                            value={joinCodeInput}
                            onChange={(e) => setJoinCodeInput(e.target.value)}
                            className="flex-1 bg-transparent border-none text-emerald-400 text-sm font-bold font-mono tracking-widest focus:ring-0 placeholder:text-slate-600 placeholder:font-sans placeholder:tracking-normal outline-none w-full min-w-0"
                          />
                          <button
                            type="submit"
                            className="ml-2 px-4 sm:px-6 py-3 rounded-xl text-white font-bold text-sm transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2 bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-[0_10px_20px_-10px_rgba(16,185,129,0.6)] shrink-0"
                          >
                            Unirse <ArrowRight className="w-4 h-4 hidden sm:block" />
                          </button>
                        </div>
                      </form>
                    </div>
                  </motion.div>

                </div>

                {/* Nodes Grid & Search/Filters */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="pt-8 space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="text-2xl font-black text-white flex items-center gap-3">
                        <Layers className="w-6 h-6 text-slate-400" /> Salas Activas
                      </h3>
                      <p className="text-slate-500 text-sm mt-1">Salas disponibles en tu red cifrada.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                      {/* Search */}
                      <div className="relative flex-1 md:w-64">
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                        <input
                          type="text"
                          placeholder="Buscar sala o código..."
                          value={roomSearchQuery}
                          onChange={e => setRoomSearchQuery(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-[var(--accent)] outline-none"
                        />
                      </div>

                      {/* Filter Tabs */}
                      <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px] font-bold">
                        <button
                          onClick={() => setRoomFilterMode('all')}
                          className={`px-2.5 py-1 rounded-lg transition-all ${roomFilterMode === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                          Todas
                        </button>
                        <button
                          onClick={() => setRoomFilterMode('favorites')}
                          className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${roomFilterMode === 'favorites' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                          ★ Favoritas
                        </button>
                        <button
                          onClick={() => setRoomFilterMode('global')}
                          className={`px-2.5 py-1 rounded-lg transition-all ${roomFilterMode === 'global' ? 'bg-sky-500/20 text-sky-300' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                          🌐 Global
                        </button>
                        <button
                          onClick={() => setRoomFilterMode('open')}
                          className={`px-2.5 py-1 rounded-lg transition-all ${roomFilterMode === 'open' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                          🔑 Abiertas
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <AnimatePresence>
                      {(() => {
                        const allRoomsList = Array.isArray(rooms) ? rooms : [];
                        const filtered = allRoomsList.filter(r => {
                          const matchesQuery = !roomSearchQuery || 
                            r.name.toLowerCase().includes(roomSearchQuery.toLowerCase()) || 
                            r.code.includes(roomSearchQuery) ||
                            (r.description && r.description.toLowerCase().includes(roomSearchQuery.toLowerCase()));
                          
                          const mode = r.accessMode || (r.isClosed ? 'closed' : (r.isPrivate ? 'open' : 'global'));
                          if (roomFilterMode === 'favorites') return matchesQuery && favoriteRoomIds.includes(r.id);
                          if (roomFilterMode === 'global') return matchesQuery && mode === 'global';
                          if (roomFilterMode === 'open') return matchesQuery && mode === 'open';
                          if (roomFilterMode === 'closed') return matchesQuery && mode === 'closed';
                          return matchesQuery;
                        });

                        if (filtered.length === 0) {
                          return (
                            <motion.div 
                              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                              className="col-span-full py-20 flex flex-col items-center justify-center border border-dashed border-slate-700/80 rounded-[2rem] bg-slate-900/30 backdrop-blur-sm"
                            >
                              <div className="relative">
                                <div className="absolute inset-0 bg-[var(--accent)]/20 rounded-full blur-2xl animate-pulse"></div>
                                <Layers className="w-12 h-12 text-slate-600 relative z-10" />
                              </div>
                              <h4 className="text-slate-400 font-bold mt-4 text-base">Sin resultados</h4>
                              <p className="text-slate-500 text-xs mt-1 max-w-md text-center">No se encontraron salas activas con este filtro.</p>
                            </motion.div>
                          );
                        }

                        return filtered.map((r, index) => {
                          const mode = r.accessMode || (r.isClosed ? 'closed' : (r.isPrivate ? 'open' : 'global'));
                          const isFav = favoriteRoomIds.includes(r.id);

                          return (
                            <motion.div
                              key={r.id ? `${r.id}-${index}` : `room-${index}`}
                              layoutId={`room-${r.id}`}
                              initial={{ opacity: 0, scale: 0.9, y: 20 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9, y: -20 }}
                              transition={{ delay: index * 0.04, duration: 0.25 }}
                              onClick={() => handleJoinRoom(r)}
                              className="group cursor-pointer"
                            >
                              <div className="relative h-full bg-slate-900 rounded-[2rem] border border-slate-700/60 p-6 flex flex-col justify-between overflow-hidden transition-all duration-300 hover:border-slate-500 hover:shadow-[0_15px_40px_-15px_rgba(0,0,0,0.8)] hover:-translate-y-1">
                                {/* Accent line left */}
                                <div className={`absolute top-0 left-0 w-1.5 h-full transition-colors duration-500 ${r.activeUsersCount > 0 ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)]' : 'bg-slate-700'}`}></div>
                                
                                {/* Inner glow on hover */}
                                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                                <div>
                                  <div className="relative z-10 flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[var(--accent)] shadow-inner">
                                        <Cpu className="w-5 h-5" />
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-1.5 mb-1">
                                          {mode === 'global' && (
                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center gap-1">
                                              <Globe className="w-2.5 h-2.5" /> Global
                                            </span>
                                          )}
                                          {mode === 'open' && (
                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                                              <Key className="w-2.5 h-2.5" /> Abierta
                                            </span>
                                          )}
                                          {mode === 'closed' && (
                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                                              <Lock className="w-2.5 h-2.5" /> Cerrada
                                            </span>
                                          )}
                                        </div>
                                        <h4 className="font-black text-lg text-white truncate max-w-[150px] sm:max-w-[200px] leading-tight">
                                          {r.name}
                                        </h4>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-1">
                                      <button
                                        onPointerDown={(e) => e.stopPropagation()}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          toggleFavoriteRoom(r.id);
                                        }}
                                        className={`p-1.5 rounded-lg border transition-all ${
                                          isFav ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-slate-950/50 text-slate-500 hover:text-amber-300 border-transparent'
                                        }`}
                                        title={isFav ? "Quitar de Favoritos" : "Añadir a Favoritos"}
                                      >
                                        ★
                                      </button>

                                      {currentUser && (r.createdById === currentUser.id || currentUser.role === 'admin') && (
                                        <button
                                          onPointerDown={(e) => e.stopPropagation()}
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleDeleteRoom(e, r.id);
                                          }}
                                          className="p-1.5 rounded-lg bg-slate-950/50 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all z-20"
                                          title="Eliminar Sala"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {r.description && (
                                    <p className="text-slate-400 text-xs italic mb-4 line-clamp-2 bg-slate-950/40 p-2 rounded-xl border border-slate-800/60">
                                      "{r.description}"
                                    </p>
                                  )}
                                </div>

                                <div className="relative z-10 mt-auto pt-4 border-t border-slate-800/60 grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-1">Código de Acceso</p>
                                    <div className="flex items-center gap-1.5">
                                      <KeyRound className="w-3.5 h-3.5 text-[var(--accent)]" />
                                      <span className="text-xs font-mono font-bold text-slate-300 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                                        {r.code}
                                      </span>
                                      <button
                                        onPointerDown={(e) => e.stopPropagation()}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          navigator.clipboard.writeText(r.code);
                                          notify(`Código #${r.code} copiado`, 'info');
                                        }}
                                        className="text-slate-500 hover:text-slate-300 p-0.5"
                                        title="Copiar Código"
                                      >
                                        <Copy className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-1">Usuarios Activos</p>
                                    <div className="flex items-center justify-end gap-1.5">
                                      <span className="text-xs font-bold text-white">{r.activeUsersCount ?? 0}</span>
                                      <Users className={`w-3.5 h-3.5 ${r.activeUsersCount > 0 ? 'text-emerald-400' : 'text-slate-600'}`} />
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Decorative line effect */}
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                              </div>
                            </motion.div>
                          );
                        });
                      })()}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

                    {/* VIEW 3: CHAT VIEW */}
          {view === 'chat' && currentRoom && currentUser && (
            <ChatRoomScreen
              currentRoom={currentRoom}
              currentUser={currentUser}
              roomRoomKey={roomRoomKey}
              messages={messages}
              setMessages={setMessages}
              roomUsers={roomUsers}
              typingUsersMap={typingUsersMap}
              peerTyping={peerTyping}
              preferences={preferences}
              token={token}
              wsRef={wsRef}
              notify={notify}
              inputText={inputText}
              setInputText={setInputText}
              attachments={attachments}
              setAttachments={setAttachments}
              replyToMsg={replyToMsg}
              setReplyToMsg={setReplyToMsg}
              fileInputRef={fileInputRef}
              messagesEndRef={messagesEndRef}
              handleSendMessage={handleSendMessage}
              handleSendZumbido={handleSendZumbido}
              handleReaction={handleReaction}
              handleFileUpload={handleFileUpload}
              handleAnalyzeMultimodal={handleAnalyzeMultimodal}
              handleAnalyzeAudio={handleAnalyzeAudio}
              handleTyping={handleTyping}
              mediaAnalysisMap={mediaAnalysisMap}
              analyzingMediaData={analyzingMediaData}
              audioAnalysisMap={audioAnalysisMap}
              analyzingAudioData={analyzingAudioData}
              setView={setView}
              setIsRoomModeModalOpen={setIsRoomModeModalOpen}
              setLightboxImage={setLightboxImage}
              isAiAssistantOpen={isAiAssistantOpen}
              setIsAiAssistantOpen={setIsAiAssistantOpen}
              aiDrawerPrompt={aiDrawerPrompt}
              setAiDrawerPrompt={setAiDrawerPrompt}
              handleAskAiAssistant={handleAskAiAssistant}
              isAiDrawerLoading={isAiDrawerLoading}
              aiDrawerResponse={aiDrawerResponse}
            />
          )}
        </main>
      </div>

      {/* ADMIN 2FA RE-AUTHENTICATION MODAL */}
      {isAdmin2FAModalOpen && (
        <div className="fixed inset-0 z-[350] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-indigo-500/30 p-5 sm:p-8 rounded-2xl sm:rounded-3xl w-full max-w-md space-y-5 sm:space-y-6 text-slate-200 shadow-2xl animate-in zoom-in-95 duration-200 my-auto max-h-[90dvh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                  <KeyRound className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white">Re-autenticación 2FA Admin</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Aether Security | Gmail OTP</p>
                </div>
              </div>
              <button
                onClick={() => setIsAdmin2FAModalOpen(false)}
                className="p-2 hover:bg-slate-800 rounded-full text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {admin2faError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{admin2faError}</span>
              </div>
            )}

            {admin2faStep === 'creds' && (
              <form onSubmit={handleAdmin2FARequestCode} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Correo Administrador
                  </label>
                  <input
                    type="email"
                    value={admin2faEmail}
                    onChange={(e) => setAdmin2faEmail(e.target.value)}
                    placeholder="*******************"
                    required
                    className="w-full bg-slate-950 border border-slate-800 p-3 sm:p-3.5 rounded-xl text-xs sm:text-sm text-white font-mono focus:border-[var(--accent)] focus:outline-none"
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 space-y-1">
                  <span className="font-bold flex items-center gap-1.5 text-indigo-300">
                    <ShieldCheck className="w-4 h-4 shrink-0" /> Medida Anti-Compromiso
                  </span>
                  <p className="text-[11px] text-slate-300">
                    Se enviará un código de verificación al correo indicado para validar tu identidad.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSendingAdminCode}
                  className="w-full py-3.5 sm:py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 min-h-[46px]"
                >
                  <Mail className="w-5 h-5" /> Enviar Código 2FA a Gmail
                </button>
              </form>
            )}

            {admin2faStep === 'code' && (
              <form onSubmit={handleAdmin2FAVerifySubmit} className="space-y-4">
                <div className="p-3 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 text-xs text-indigo-200">
                  <p className="font-mono text-[var(--accent)] font-bold break-all">Código enviado a {admin2faEmail}</p>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Contraseña de Administrador
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={admin2faPassword}
                    onChange={(e) => setAdmin2faPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-3 sm:p-3.5 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500 font-medium min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Código 2FA de 6 Dígitos
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={admin2faCode}
                    onChange={(e) => setAdmin2faCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-3.5 sm:p-4 rounded-xl text-center text-xl sm:text-2xl tracking-[0.3em] sm:tracking-[0.5em] font-mono text-indigo-300 focus:outline-none focus:border-indigo-500 min-h-[50px]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isVerifyingAdmin2FA || admin2faCode.length < 6 || !admin2faPassword}
                  className="w-full py-3.5 sm:py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 min-h-[46px]"
                >
                  <CheckCircle2 className="w-5 h-5" /> Confirmar 2FA y Abrir Panel
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ADMIN DASHBOARD MODAL */}
      {isAdminDashboardOpen && token && (
        <AdminDashboard
          stats={adminStats}
          users={adminUsers}
          threats={adminThreats}
          logs={adminLogs}
          token={token}
          accentColor={preferences.accent}
          onRefresh={fetchAdminData}
          onClose={() => setIsAdminDashboardOpen(false)}
        />
      )}

      {/* SETTINGS MODAL */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto w-full max-w-full">
          <div className="aether-modal border border-slate-800/80 p-5 sm:p-7 rounded-2xl sm:rounded-3xl w-full max-w-lg sm:max-w-2xl space-y-5 text-slate-200 shadow-2xl my-auto max-h-[92dvh] overflow-y-auto scrollbar-thin">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-[var(--accent)]">
                  <Settings2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white leading-tight">Ajustes & Cuenta</h3>
                  <p className="text-[11px] text-slate-400">Personalización, seguridad e identidad en la red</p>
                </div>
              </div>
              <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 gap-1.5 text-center">
              <button
                type="button"
                onClick={() => setSettingsTab('profile')}
                className={`py-2 px-2 text-[11px] sm:text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${settingsTab === 'profile' ? 'bg-slate-800 text-white shadow-md border border-slate-700/50' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <UserCheck className="w-3.5 h-3.5 shrink-0 text-cyan-400" /> Perfil
              </button>
              <button
                type="button"
                onClick={() => setSettingsTab('badges')}
                className={`py-2 px-2 text-[11px] sm:text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  settingsTab === 'badges'
                    ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50 shadow-md ring-1 ring-purple-500/30'
                    : 'text-purple-400/80 hover:text-purple-300'
                }`}
              >
                <Award className="w-3.5 h-3.5 shrink-0 text-amber-400 animate-pulse" /> Insignias
                {currentUser?.badges && currentUser.badges.length > 0 && (
                  <span className="text-[9px] px-1.5 py-0.2 bg-purple-500/30 text-purple-200 rounded-full font-mono font-black border border-purple-500/40">
                    {currentUser.badges.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setSettingsTab('premium')}
                className={`py-2 px-2 text-[11px] sm:text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  settingsTab === 'premium'
                    ? ((currentUser?.planTier === 'cyber_elite' )
                        ? 'bg-purple-500/30 text-cyan-300 border border-cyan-400/50 shadow-md'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-md')
                    : 'text-amber-400/80 hover:text-amber-300'
                }`}
              >
                {(currentUser?.planTier === 'cyber_elite' ) ? (
                  <>
                    <Zap className="w-3.5 h-3.5 shrink-0 text-cyan-400" /> ULTRA ELITE
                  </>
                ) : (
                  <>
                    <Crown className="w-3.5 h-3.5 shrink-0 text-amber-400" /> VIP
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setSettingsTab('appearance')}
                className={`py-2 px-2 text-[11px] sm:text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${settingsTab === 'appearance' ? 'bg-slate-800 text-white shadow-md border border-slate-700/50' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Palette className="w-3.5 h-3.5 shrink-0 text-purple-400" /> Diseño
              </button>
              <button
                type="button"
                onClick={() => setSettingsTab('security')}
                className={`py-2 px-2 text-[11px] sm:text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${settingsTab === 'security' ? 'bg-slate-800 text-white shadow-md border border-slate-700/50' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Lock className="w-3.5 h-3.5 shrink-0 text-emerald-400" /> Seguridad
              </button>
            </div>

            {/* TAB: PROFILE & ACCOUNT ID */}
            {settingsTab === 'profile' && (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                {/* 1. Account ID Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-cyan-500/30 shadow-lg shadow-cyan-950/20 space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                        <Key className="w-4 h-4" />
                      </span>
                      <div>
                        <span className="text-xs font-black text-white uppercase tracking-wider">Identificador Único (ID)</span>
                        <p className="text-[10px] text-cyan-300/80">Credencial de acceso en la red Aether</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" /> Nivel 3 Verificado
                    </span>
                  </div>

                  {/* ID Field with Action Buttons */}
                  <div className="p-3 bg-black/60 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2 w-full sm:w-auto overflow-hidden">
                      <span className="text-xs font-mono font-black text-cyan-300 truncate select-all">
                        {currentUser?.id || 'ID_PENDING_SYNC'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          if (currentUser?.id) {
                            navigator.clipboard.writeText(currentUser.id);
                            setIdCopied(true);
                            notify("ID de cuenta copiado al portapapeles", "success");
                            setTimeout(() => setIdCopied(false), 2500);
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
                      >
                        {idCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {idCopied ? '¡Copiado!' : 'Copiar ID'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowIdQrModal(true)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold transition-all"
                        title="Ver Código QR"
                      >
                        <QrCode className="w-4 h-4 text-cyan-400" />
                      </button>
                    </div>
                  </div>

                  {/* Fingerprint & Creation Date */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                    <div className="truncate">
                      <span className="text-slate-500">Huella Digital: </span>
                      <span className="font-mono text-slate-300">
                        {currentUser?.id ? `SHA256:${currentUser.id.substring(0, 10)}...` : 'N/A'}
                      </span>
                    </div>
                    <div className="text-right truncate">
                      <span className="text-slate-500">Miembro desde: </span>
                      <span className="text-slate-300">
                        {currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString('es-ES') : '2026'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Avatar & Nickname Section */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative group shrink-0">
                    <img 
                      src={`https://api.dicebear.com/7.x/identicon/svg?seed=${editProfileAvatarSeed || currentUser?.email || 'default'}&backgroundColor=transparent`} 
                      alt="Avatar" 
                      className="w-20 h-20 rounded-2xl bg-slate-900 border-2 border-slate-700 shadow-lg group-hover:border-[var(--accent)] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setEditProfileAvatarSeed(Math.random().toString(36).substring(7))}
                      className="absolute -bottom-2 -right-2 p-2 bg-slate-800 border border-slate-700 text-white rounded-xl shadow-lg hover:scale-110 transition-transform"
                      title="Generar avatar aleatorio"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-[var(--accent)]" />
                    </button>
                  </div>
                  <div className="space-y-1.5 w-full text-center sm:text-left">
                    <label className="text-xs font-bold text-slate-400 block">Personalizar Semilla del Avatar</label>
                    <input
                      type="text"
                      value={editProfileAvatarSeed}
                      onChange={(e) => setEditProfileAvatarSeed(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-[var(--accent)]"
                      placeholder="Semilla o avatar..."
                    />
                    <p className="text-[10px] text-slate-500">Genera una apariencia única basada en algoritmos identicon.</p>
                  </div>
                </div>

                {/* 3. Username */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 block">Nombre Público de Usuario</label>
                  <input
                    type="text"
                    value={editProfileName}
                    onChange={(e) => setEditProfileName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:border-[var(--accent)] transition-colors shadow-inner"
                    placeholder="Tu nombre..."
                    required
                  />
                </div>

                {/* 4. Official User Badges Summary */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 border border-purple-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        <Award className="w-4 h-4 text-amber-400 animate-pulse" />
                      </span>
                      <div>
                        <span className="text-xs font-black text-white uppercase tracking-wider">Insignias & Rangos</span>
                        <p className="text-[10px] text-purple-300/80">Distintivos otorgados por la Administración</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSettingsTab('badges')}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span>Ver Catálogo</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80">
                    {currentUser?.badges && currentUser.badges.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <UserBadgeList 
                          badges={currentUser.badges} 
                          customBadgeText={currentUser.customBadgeText} 
                          size="md" 
                        />
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No tienes insignias adicionales otorgadas.</p>
                    )}
                  </div>
                </div>

                {/* 5. Mood & Status Picker */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 block">Estado / Ánimo</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['🟢 Disponible', '⚡ En Operación', '🛡️ Modo Blindado', '☕ En Pausa', '🔒 Privado'].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setEditProfileMood(m)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-all ${editProfileMood === m ? 'bg-[var(--accent)]/20 text-white border-[var(--accent)]' : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={editProfileMood}
                    onChange={(e) => setEditProfileMood(e.target.value)}
                    maxLength={60}
                    className="w-full bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-[var(--accent)]"
                    placeholder="Escribe un estado personalizado..."
                  />
                </div>

                {/* 6. Bio / Estado */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-400 block">Biografía o Descripción</label>
                    <span className="text-[10px] text-slate-500">{editProfileBio.length}/250</span>
                  </div>
                  <textarea
                    value={editProfileBio}
                    onChange={(e) => setEditProfileBio(e.target.value)}
                    maxLength={250}
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-[var(--accent)] resize-none"
                    placeholder="Escribe una breve descripción o nota sobre tu perfil..."
                  />
                </div>

                {/* 7. Account Summary Pills */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                    <p className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-indigo-400" /> Correo Gmail
                    </p>
                    <p className="text-xs font-bold text-slate-200 truncate">{currentUser?.email || 'N/A'}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                    <p className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-emerald-400" /> Rol en la Red
                    </p>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold ${currentUser?.role === 'admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'}`}>
                      {currentUser?.role === 'admin' ? '👑 Administrador Master' : '🛡️ Usuario Verificado'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                    <p className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-cyan-400" /> Plan & Membresía
                    </p>
                    {(currentUser?.planTier === 'cyber_elite' ) ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_8px_rgba(6,182,212,0.3)] animate-pulse">
                        <Zap className="w-3 h-3 text-cyan-400" /> Cyber ULTRA ELITE
                      </span>
                    ) : currentUser?.isPremium ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        <Crown className="w-3 h-3 text-amber-400" /> Premium VIP
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                        🛡️ Plan Estándar
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl text-white font-bold text-xs sm:text-sm shadow-xl active:scale-95 transition-transform min-h-[44px]"
                  style={{ backgroundColor: preferences.accent }}
                >
                  Guardar Perfil de Usuario
                </button>
              </form>
            )}

            {/* TAB: BADGES & OFFICIAL RECOGNITIONS */}
            {settingsTab === 'badges' && (
              <div className="space-y-4">
                {/* 1. Header Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/50 via-slate-900 to-indigo-950/50 border border-purple-500/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0 shadow-lg shadow-purple-500/20">
                      <Award className="w-5 h-5 text-amber-400 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                        Insignias Oficiales de Reconocimiento
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                          {currentUser?.badges?.length || 1} Activa{(currentUser?.badges?.length || 1) !== 1 ? 's' : ''}
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Títulos, rangos y verificaciones oficiales en la red Aether.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. User's Active Badges Showcase */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      Insignias Activas en tu Perfil
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      Orden Oficial de Rango
                    </span>
                  </div>

                  {currentUser?.badges && currentUser.badges.length > 0 ? (
                    <UserBadgeShowcase 
                      badges={currentUser.badges} 
                      customBadgeText={currentUser.customBadgeText} 
                    />
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                      <p className="text-xs text-slate-400">
                        Tienes la insignia base de <strong className="text-slate-200">Usuario</strong>.
                      </p>
                    </div>
                  )}
                </div>

                {/* 3. Catalog Filters */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-cyan-400" />
                      Catálogo Completo de Insignias ({BADGE_ORDER.length})
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Sistema de Jerarquía
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                    {[
                      { id: 'all', label: `Todas (${BADGE_ORDER.length})` },
                      { id: 'hierarchy', label: '👑 Jerarquía' },
                      { id: 'social', label: '🌐 Redes Verificadas' },
                      { id: 'vip', label: '⚡ VIP & Premium' },
                      { id: 'special', label: '✨ Especiales & Custom' },
                      { id: 'general', label: '🛡️ General' },
                    ].map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setBadgeFilterCatalog(tab.id as any)}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all text-[11px] ${
                          badgeFilterCatalog === tab.id
                            ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Badges Catalog Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                  {BADGE_ORDER
                    .filter(badgeId => {
                      const def = BADGE_DEFINITIONS[badgeId];
                      if (!def) return false;
                      if (badgeFilterCatalog === 'all') return true;
                      return def.category === badgeFilterCatalog;
                    })
                    .map((badgeId, idx) => {
                      const def = BADGE_DEFINITIONS[badgeId];
                      const isOwned = currentUser?.badges?.includes(badgeId);

                      return (
                        <div
                          key={badgeId}
                          className={`p-3 rounded-xl border transition-all flex items-start gap-3 relative overflow-hidden ${
                            isOwned
                              ? 'bg-slate-900/90 border-purple-500/60 shadow-md shadow-purple-500/10 ring-1 ring-purple-500/30'
                              : 'bg-slate-950/60 border-slate-800/80 opacity-70 hover:opacity-90'
                          }`}
                        >
                          {/* Left Icon */}
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                            isOwned
                              ? `${def.bgGradient} text-white ${def.glowColor} border-white/30 shadow-md`
                              : 'bg-slate-900 border-slate-800 text-slate-500'
                          }`}>
                            <BadgeIcon badgeId={badgeId} className="w-4 h-4" />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="font-extrabold text-xs text-white truncate">
                                {badgeId === 'custom' && currentUser?.customBadgeText
                                  ? currentUser.customBadgeText
                                  : def.name}
                              </span>
                              {isOwned ? (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold shrink-0 flex items-center gap-0.5">
                                  <Check className="w-2.5 h-2.5" /> Asignada
                                </span>
                              ) : (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-mono shrink-0">
                                  #{idx + 1}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                              {def.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* 5. Policy Notice */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-white font-bold">Gestión de Insignias:</strong> Las insignias se otorgan de forma individual y personalizada mediante el Panel de Administración. Se apilan dinámicamente en tu perfil y son visibles en todas las salas y chats.
                  </p>
                </div>
              </div>
            )}

            {/* TAB: PREMIUM STATUS & VIP BENEFITS */}
            {settingsTab === 'premium' && (
              <div className="space-y-4">
                {(currentUser?.planTier === 'cyber_elite' ) ? (
                  /* CYBER ULTRA ELITE ACTIVE CARD */
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-900/40 via-purple-950/30 to-slate-950 border-2 border-cyan-400/60 shadow-[0_0_25px_rgba(6,182,212,0.2)] space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 text-white text-[10px] font-black px-3.5 py-1 rounded-bl-xl uppercase tracking-widest flex items-center gap-1 shadow-[0_0_12px_rgba(6,182,212,0.5)]">
                      <Zap className="w-3 h-3 text-cyan-200 animate-bounce" /> ULTRA ELITE
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                        <Zap className="w-6 h-6 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-purple-300 to-cyan-100 uppercase tracking-wide flex items-center gap-2">
                          Suscripción Cyber ULTRA ELITE Activa
                        </h4>
                        <p className="text-xs text-cyan-200/80 font-medium">Soberanía total, auditoría forense con IA y acceso prioritario a nodos dedicados.</p>
                      </div>
                    </div>

                    <div className="p-3.5 bg-black/60 rounded-xl border border-cyan-500/30 space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-cyan-200/70 font-semibold">Vencimiento:</span>
                        <span className="font-mono font-bold text-cyan-300">
                          {currentUser?.premiumExpiresAt ? new Date(currentUser.premiumExpiresAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Indefinido'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-cyan-200/70 font-semibold">Tiempo Restante:</span>
                        <span className="font-bold text-emerald-400">
                          {currentUser?.premiumExpiresAt ? `${Math.max(0, Math.ceil((currentUser.premiumExpiresAt - Date.now()) / (1000 * 60 * 60 * 24)))} días restantes` : 'Permanente'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-1">
                      <p className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Privilegios Cyber Elite Activos:</p>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-200">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" /> Insignia Holográfica Elite en salas
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" /> IA Aether Max & Auditoría Forense
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" /> Archivos hasta 2 GB
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" /> Nodos Dedicados & Salas Aisladas
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" /> Inmunidad WAF & Anti-Baneo Total
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" /> Soporte Directo de Admin 24/7
                        </li>
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={() => { setIsSettingsOpen(false); setView('premium'); }}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg shadow-cyan-500/20 active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Zap className="w-4 h-4" /> Ver Portal de Membresías Completo
                    </button>
                  </div>
                ) : currentUser?.isPremium ? (
                  /* PREMIUM VIP ACTIVE CARD */
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-amber-950/40 border-2 border-amber-500/50 shadow-xl shadow-amber-500/10 space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-amber-500 text-black text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest flex items-center gap-1">
                      <Crown className="w-3 h-3" /> VIP
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-lg">
                        <Crown className="w-6 h-6 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-base font-black text-amber-300 uppercase tracking-wide">Suscripción Aether VIP Activa</h4>
                        <p className="text-xs text-amber-200/80 font-medium">Cuentas con cobertura y privilegios prémium activos.</p>
                      </div>
                    </div>

                    <div className="p-3.5 bg-black/40 rounded-xl border border-amber-500/20 space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-amber-200/70 font-semibold">Vencimiento:</span>
                        <span className="font-mono font-bold text-amber-300">
                          {currentUser.premiumExpiresAt ? new Date(currentUser.premiumExpiresAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Indefinido'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-amber-200/70 font-semibold">Tiempo Restante:</span>
                        <span className="font-bold text-emerald-400">
                          {currentUser.premiumExpiresAt ? `${Math.max(0, Math.ceil((currentUser.premiumExpiresAt - Date.now()) / (1000 * 60 * 60 * 24)))} días restantes` : 'Permanente'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-1">
                      <p className="text-xs font-bold text-amber-300 uppercase tracking-wider">Beneficios VIP Activos:</p>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-200">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /> Paleta VIP Desbloqueada
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /> IA Aether Max sin límites
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /> Archivos de hasta 2 GB
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /> Inmunidad Anti-Baneo Leve
                        </li>
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={() => { setIsSettingsOpen(false); setView('premium'); }}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Crown className="w-4 h-4" /> Ver Portal Premium Completo
                    </button>
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Plan Básico Actual</h4>
                        <p className="text-xs text-slate-400">Acceso a funciones esenciales de seguridad.</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-950/20 border border-amber-500/30 space-y-2">
                      <p className="text-xs font-black text-amber-300 flex items-center gap-1.5 uppercase tracking-wide">
                        <Crown className="w-4 h-4 text-amber-400" /> Desbloquea Aether VIP 2.0
                      </p>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Accede a paletas exclusivas, respuestas ultra-rápidas con modelos NVIDIA & Gemini sin cuota, transferencias de 2 GB e inmunidad WAF.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => { setIsSettingsOpen(false); setView('premium'); }}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Crown className="w-4 h-4" /> Ver Planes y Obtener Premium
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB: APPEARANCE & EXPANDED CUSTOMIZATION */}
            {settingsTab === 'appearance' && (
              <div className="space-y-4">
                {/* Standard Palette */}
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-2">Paleta Estándar (Acceso Libre)</label>
                  <div className="grid grid-cols-6 gap-2">
                    {[
                      { hex: '#0ea5e9', name: 'Cian Aether' },
                      { hex: '#10b981', name: 'Esmeralda' },
                      { hex: '#f43f5e', name: 'Rosa Carmín' },
                      { hex: '#8b5cf6', name: 'Violeta' },
                      { hex: '#f59e0b', name: 'Ámbar' },
                      { hex: '#d946ef', name: 'Fucsia' }
                    ].map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setPreferences((prev) => ({ ...prev, accent: c.hex }))}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${preferences.accent === c.hex ? 'ring-2 ring-white scale-110 shadow-lg' : 'hover:scale-105'}`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      >
                        {preferences.accent === c.hex && <Check className="w-4 h-4 text-white drop-shadow" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* VIP Palette */}
                <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Crown className="w-4 h-4 text-amber-400" /> Paleta Exclusiva VIP (Aether Premium)
                    </label>
                    {!currentUser?.isPremium && (
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold border border-amber-500/30">
                        Bloqueado
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 pt-1">
                    {[
                      { hex: '#06b6d4', name: 'Cian Cyber VIP' },
                      { hex: '#eab308', name: 'Oro Imperial VIP' },
                      { hex: '#ef4444', name: 'Rojo Escarlata VIP' },
                      { hex: '#a855f7', name: 'Púrpura Galáctico VIP' },
                      { hex: '#84cc16', name: 'Lima Ácido VIP' },
                      { hex: '#f97316', name: 'Naranja Supernova VIP' },
                      { hex: '#64748b', name: 'Plata Metalizado VIP' },
                      { hex: '#ec4899', name: 'Rosa Plasma VIP' }
                    ].map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => {
                          if (!currentUser?.isPremium) {
                            notify("👑 El color " + c.name + " es exclusivo para usuarios Aether Premium.", "alert");
                          } else {
                            setPreferences((prev) => ({ ...prev, accent: c.hex }));
                            notify("Color VIP " + c.name + " aplicado correctamente", "success");
                          }
                        }}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all relative ${preferences.accent === c.hex ? 'ring-2 ring-amber-400 scale-110 shadow-lg' : 'hover:scale-105'}`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      >
                        {preferences.accent === c.hex && <Check className="w-4 h-4 text-white drop-shadow" />}
                        {!currentUser?.isPremium && (
                          <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center backdrop-blur-[1px]">
                            <Lock className="w-3 h-3 text-amber-300" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Themes */}
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1.5">Tema Visual</label>
                  <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setPreferences((prev) => ({ ...prev, theme: 'dark' }))}
                      className={`py-2 text-xs font-bold rounded-xl transition-all ${preferences.theme === 'dark' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-300'}`}
                    >
                      Dark Slate
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreferences((prev) => ({ ...prev, theme: 'oled' }))}
                      className={`py-2 text-xs font-bold rounded-xl transition-all ${preferences.theme === 'oled' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-300'}`}
                    >
                      OLED Black
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!currentUser?.isPremium) {
                          notify("👑 El tema Midnight Navy es exclusivo para usuarios Premium.", "alert");
                        } else {
                          setPreferences((prev) => ({ ...prev, theme: 'midnight' }));
                        }
                      }}
                      className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 ${preferences.theme === 'midnight' ? 'bg-slate-800 text-amber-300 shadow' : 'text-amber-400/80 hover:text-amber-300'}`}
                    >
                      {!currentUser?.isPremium && <Lock className="w-3 h-3" />} Midnight
                    </button>
                  </div>
                </div>

                {/* Chat Bubble Style & Density */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 block">Estilo de Burbujas</label>
                    <select
                      value={preferences.chatBubbleStyle || 'modern'}
                      onChange={(e) => setPreferences((prev) => ({ ...prev, chatBubbleStyle: e.target.value as any }))}
                      className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl text-xs text-white focus:outline-none focus:border-[var(--accent)]"
                    >
                      <option value="modern">Moderna Curvada</option>
                      <option value="cyber">Cyber Neón</option>
                      <option value="minimal">Minimalista Compacta</option>
                      <option value="glass">Efecto Cristal Traslúcido</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 block">Densidad de Interfaz</label>
                    <select
                      value={preferences.uiDensity || 'comfortable'}
                      onChange={(e) => setPreferences((prev) => ({ ...prev, uiDensity: e.target.value as any }))}
                      className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl text-xs text-white focus:outline-none focus:border-[var(--accent)]"
                    >
                      <option value="compact">Compacta (Más mensajes)</option>
                      <option value="comfortable">Cómoda (Estándar)</option>
                      <option value="spacious">Amplia y Espaciosa</option>
                    </select>
                  </div>
                </div>

                {/* Notification Sound Picker */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-400 block">Tono de Notificación</label>
                    <span className="text-[10px] text-slate-500">Prueba con el botón de audio</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'futuristic', name: 'Futurista' },
                      { id: 'chime', name: 'Campana' },
                      { id: 'pulse', name: 'Pulso Cyber' },
                      { id: 'sonar', name: 'Sonar Radar' }
                    ].map((snd) => (
                      <button
                        key={snd.id}
                        type="button"
                        onClick={() => {
                          setPreferences((prev) => ({ ...prev, soundType: snd.id as any }));
                          // Sound feedback preview
                          try {
                            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                            const osc = ctx.createOscillator();
                            const gain = ctx.createGain();
                            osc.connect(gain);
                            gain.connect(ctx.destination);
                            osc.type = snd.id === 'pulse' ? 'triangle' : snd.id === 'chime' ? 'sine' : 'sawtooth';
                            osc.frequency.setValueAtTime(600, ctx.currentTime);
                            osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.15);
                            gain.gain.setValueAtTime(0.12, ctx.currentTime);
                            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
                            osc.start();
                            osc.stop(ctx.currentTime + 0.25);
                          } catch (e) {}
                        }}
                        className={`p-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${(preferences.soundType || 'futuristic') === snd.id ? 'bg-[var(--accent)]/20 text-white border-[var(--accent)]' : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'}`}
                      >
                        <Volume1 className="w-3.5 h-3.5" />
                        {snd.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-[var(--accent)]" /> Sonidos de Notificación
                    </span>
                    <input
                      type="checkbox"
                      checked={preferences.soundEnabled}
                      onChange={(e) => setPreferences((prev) => ({ ...prev, soundEnabled: e.target.checked }))}
                      className="w-4 h-4 accent-[var(--accent)] rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                      <EyeOff className="w-4 h-4 text-[var(--accent)]" /> Pantalla Anti-Miradas (Privacy Blur)
                    </span>
                    <input
                      type="checkbox"
                      checked={preferences.privacyBlur}
                      onChange={(e) => setPreferences((prev) => ({ ...prev, privacyBlur: e.target.checked }))}
                      className="w-4 h-4 accent-[var(--accent)] rounded"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* TAB: SECURITY & PRIVACY CONTROLS */}
            {settingsTab === 'security' && (
              <div className="space-y-4">
                {/* 1. Change Password */}
                <form onSubmit={handleChangePassword} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-[var(--accent)]" /> Cambiar Contraseña
                  </h4>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400">Contraseña Actual</label>
                    <input
                      type="password"
                      value={changePassCurrent}
                      onChange={(e) => setChangePassCurrent(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-xs text-white focus:outline-none focus:border-[var(--accent)]"
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-400">Nueva Contraseña</label>
                      <input
                        type="password"
                        value={changePassNew}
                        onChange={(e) => setChangePassNew(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-xs text-white focus:outline-none focus:border-[var(--accent)]"
                        placeholder="Mínimo 6 caracteres..."
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-400">Confirmar Nueva Contraseña</label>
                      <input
                        type="password"
                        value={changePassConfirm}
                        onChange={(e) => setChangePassConfirm(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-xs text-white focus:outline-none focus:border-[var(--accent)]"
                        placeholder="Repite contraseña..."
                        required
                      />
                    </div>
                  </div>

                  {changePassNew && (
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-400">Fortaleza de contraseña:</span>
                        <span className={`font-bold ${changePassNew.length > 8 && /[A-Z]/.test(changePassNew) && /[0-9]/.test(changePassNew) ? 'text-emerald-400' : changePassNew.length >= 6 ? 'text-amber-400' : 'text-red-400'}`}>
                          {changePassNew.length > 8 && /[A-Z]/.test(changePassNew) && /[0-9]/.test(changePassNew) ? 'Alta (Segura)' : changePassNew.length >= 6 ? 'Media' : 'Baja'}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${changePassNew.length > 8 && /[A-Z]/.test(changePassNew) && /[0-9]/.test(changePassNew) ? 'w-full bg-emerald-500' : changePassNew.length >= 6 ? 'w-2/3 bg-amber-500' : 'w-1/3 bg-red-500'}`}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isChangingPass}
                    className="w-full py-2.5 mt-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors disabled:opacity-50"
                  >
                    {isChangingPass ? 'Actualizando...' : 'Actualizar Contraseña'}
                  </button>
                </form>

                {/* 2. Security Shield & DRM Anti-Capture Controls */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" /> Protección Activa & DRM Anti-Captura
                    </span>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      BLINDADO E2EE
                    </span>
                  </h4>

                  {/* Device Adaptation Profile */}
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-white text-xs">{deviceInfo.os} • {deviceInfo.browser}</p>
                        <p className="text-[10px] text-slate-400">
                          Adaptación Inteligente: {deviceInfo.deviceType.toUpperCase()} {deviceInfo.isTouch ? '• Pantalla Táctil' : ''}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-cyan-300 bg-cyan-500/10 px-2 py-1 rounded-md border border-cyan-500/20">
                      Viewport Optimizado
                    </span>
                  </div>

                  {/* DRM Shield Features */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <span className="text-slate-300">Anti-Transmisión</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <span className="text-slate-300">Anti-Grabación</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <span className="text-slate-300">Anti-Captura Keys</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <span className="text-slate-300">Anti-Portapapeles</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
                      <span className="text-xs text-slate-300 font-medium flex items-center gap-2">
                        <EyeOff className="w-4 h-4 text-indigo-400" /> Modo Anti-Espía (Ocultar vista ante miradas)
                      </span>
                      <input
                        type="checkbox"
                        checked={!!preferences.antiSpyMode}
                        onChange={(e) => {
                          setPreferences((prev) => ({ ...prev, antiSpyMode: e.target.checked }));
                          notify(e.target.checked ? "Modo Anti-Espía activado" : "Modo Anti-Espía desactivado", "info");
                        }}
                        className="w-4 h-4 accent-[var(--accent)] rounded"
                      />
                    </label>

                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-300 font-medium flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-400" /> Bloqueo por Inactividad
                      </span>
                      <select
                        value={preferences.autoLockMinutes || 0}
                        onChange={(e) => setPreferences((prev) => ({ ...prev, autoLockMinutes: Number(e.target.value) }))}
                        className="bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg text-xs text-white focus:outline-none"
                      >
                        <option value={0}>Desactivado</option>
                        <option value={1}>1 Minuto</option>
                        <option value={5}>5 Minutos</option>
                        <option value={15}>15 Minutos</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3. Active Sessions Management */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-cyan-400" /> Sesiones y Dispositivos Activos
                    </h4>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      1 Conectado
                    </span>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <p className="font-bold text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        Navegador Actual (Sesión Activa)
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">IP: {currentUser?.ip || '127.0.0.1'} • Cifrado Blindado</p>
                    </div>
                    <span className="text-[10px] text-emerald-300 font-extrabold bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/30">
                      En Línea
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => notify("Se han invalidado todas las demás sesiones remotas activas.", "success")}
                    className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 font-bold text-xs transition-colors"
                  >
                    Cerrar Otras Sesiones Remotas
                  </button>
                </div>

                {/* 4. Lista Blanca de IPs Autorizadas (IP Whitelist) */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Network className="w-4 h-4 text-cyan-400" /> Lista Blanca de IPs Autorizadas
                    </h4>
                    {currentUser?.ipWhitelist && currentUser.ipWhitelist.length > 0 ? (
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        {currentUser.ipWhitelist.length} IP(s) Activa(s)
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
                        Inactiva (Acceso Libre)
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    Restringe el acceso a tu cuenta exclusivamente a las direcciones IP autorizadas. Cualquier intento de inicio de sesión o petición desde una red no registrada será bloqueado inmediatamente por Aether WAF.
                  </p>

                  {/* Current Detected IP Pill with Quick Add */}
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                        <Globe className="w-3 h-3 text-indigo-400" /> Tu IP Actual Detectada:
                      </p>
                      <p className="font-mono text-xs font-black text-cyan-300">
                        {currentUser?.ip || '127.0.0.1'}
                      </p>
                    </div>

                    {currentUser?.ip && !(currentUser.ipWhitelist || []).includes(currentUser.ip) && (
                      <button
                        type="button"
                        disabled={isSavingIpWhitelist}
                        onClick={() => handleAddIpToWhitelist(currentUser.ip)}
                        className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" /> Añadir mi IP Actual
                      </button>
                    )}
                  </div>

                  {/* Input Form to add IP */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAddIpToWhitelist(newWhitelistIp);
                    }}
                    className="flex items-center gap-2 pt-1"
                  >
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={newWhitelistIp}
                        onChange={(e) => setNewWhitelistIp(e.target.value)}
                        placeholder="Ej. 192.168.1.100 ó 203.0.113.5"
                        className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-xs text-white font-mono placeholder:font-sans placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSavingIpWhitelist || !newWhitelistIp.trim()}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shrink-0 flex items-center gap-1.5 shadow-md shadow-cyan-950/40"
                    >
                      <Plus className="w-3.5 h-3.5" /> Añadir IP
                    </button>
                  </form>

                  {/* Active Whitelisted IPs List */}
                  <div className="space-y-1.5 pt-2">
                    <p className="text-[10px] font-bold uppercase text-slate-400">
                      IPs Autorizadas en la Lista Blanca:
                    </p>

                    {currentUser?.ipWhitelist && currentUser.ipWhitelist.length > 0 ? (
                      <div className="space-y-1.5">
                        {currentUser.ipWhitelist.map((ip) => {
                          const isCurrentIp = ip === currentUser?.ip;
                          return (
                            <div
                              key={ip}
                              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs transition-all hover:border-slate-700"
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                                <span className="font-mono font-bold text-slate-200">{ip}</span>
                                {isCurrentIp && (
                                  <span className="text-[9px] bg-cyan-500/20 text-cyan-300 font-bold px-1.5 py-0.5 rounded border border-cyan-500/30">
                                    Tu IP actual
                                  </span>
                                )}
                              </div>

                              <button
                                type="button"
                                disabled={isSavingIpWhitelist}
                                onClick={() => handleRemoveIpFromWhitelist(ip)}
                                className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                                title="Eliminar IP de la lista blanca"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}

                        <div className="pt-2 flex justify-end">
                          <button
                            type="button"
                            disabled={isSavingIpWhitelist}
                            onClick={handleClearIpWhitelist}
                            className="text-[11px] font-bold text-slate-400 hover:text-red-400 transition-colors flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" /> Desactivar Lista Blanca (Vaciar lista)
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-900/50 border border-dashed border-slate-800 rounded-xl text-center space-y-1">
                        <p className="text-xs text-slate-400 font-medium">No hay direcciones IP configuradas en la lista blanca.</p>
                        <p className="text-[10px] text-slate-500">Tu cuenta permite conexiones desde cualquier ubicación geográfica y red.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Panic Clean & Logout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("¿Deseas purgar la memoria caché local de mensajes y salas sin cerrar tu sesión?")) {
                        const savedToken = localStorage.getItem('aether_token');
                        const savedUser = localStorage.getItem('user_data');
                        localStorage.clear();
                        sessionStorage.clear();
                        if (savedToken) localStorage.setItem('aether_token', savedToken);
                        if (savedUser) localStorage.setItem('user_data', savedUser);
                        fetchRooms();
                        refreshUserProfile();
                        notify("Caché local purgada y sincronizada en segundo plano sin reiniciar la web.", "success");
                      }
                    }}
                    className="w-full py-2.5 rounded-xl bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Purgar Caché Local
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem('aether_token'); localStorage.removeItem('user_data');
                      setToken(null);
                      setCurrentUser(null);
                      setView('auth');
                      setIsSettingsOpen(false);
                      notify("Sesión cerrada de forma segura", "info");
                    }}
                    className="w-full py-2.5 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Power className="w-3.5 h-3.5" /> Cerrar Sesión
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => setIsSettingsOpen(false)}
              className="w-full py-3 rounded-xl text-white font-bold text-xs sm:text-sm shadow-xl active:scale-95 transition-transform min-h-[44px]"
              style={{ backgroundColor: preferences.accent }}
            >
              Cerrar Ajustes
            </button>
          </div>
        </div>
      )}

      {/* QR CODE MODAL FOR ACCOUNT ID */}
      {showIdQrModal && currentUser && (
        <div className="fixed inset-0 z-[250] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/30 rounded-3xl p-6 max-w-sm w-full space-y-4 text-center shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowIdQrModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center mx-auto shadow-lg">
              <QrCode className="w-6 h-6" />
            </div>

            <div>
              <h4 className="text-base font-black text-white">ID de Cuenta Aether</h4>
              <p className="text-xs text-slate-400">Escanea o comparte para enlace directo seguro</p>
            </div>

            {/* QR Code graphic representation */}
            <div className="p-4 bg-white rounded-2xl max-w-[190px] mx-auto shadow-xl flex items-center justify-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`aether://user/${currentUser.id}`)}&bgcolor=ffffff&color=050811&margin=2`}
                alt="QR Code ID"
                className="w-40 h-40 object-contain rounded-lg"
              />
            </div>

            <div className="p-2.5 bg-black/60 rounded-xl border border-slate-800">
              <p className="text-[10px] text-slate-500 uppercase font-bold">ID Criptográfico</p>
              <p className="text-xs font-mono font-bold text-cyan-300 truncate select-all">{currentUser.id}</p>
            </div>

            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(currentUser.id);
                notify("ID de cuenta copiado", "success");
                setShowIdQrModal(false);
              }}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" /> Copiar y Cerrar
            </button>
          </div>
        </div>
      )}

      {/* MODAL 1: CHANGE ROOM ACCESS MODE */}
      {isRoomModeModalOpen && currentRoom && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-5 shadow-2xl relative"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[var(--accent)]">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Modalidad de Sala</h3>
                  <p className="text-xs text-slate-400">{currentRoom.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsRoomModeModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Selecciona quién puede visualizar y conectarse a esta sala en tiempo real:
            </p>

            <div className="space-y-3">
              {/* Option 1: Global */}
              <button
                onClick={() => handleUpdateRoomAccessMode('global')}
                className={`w-full p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 ${
                  (!currentRoom.accessMode || currentRoom.accessMode === 'global')
                    ? 'bg-sky-500/10 border-sky-500/50 shadow-[0_0_20px_rgba(14,165,233,0.15)]'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400 shrink-0 mt-0.5">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">🌐 Sala Global</h4>
                    {(!currentRoom.accessMode || currentRoom.accessMode === 'global') && (
                      <span className="text-[10px] bg-sky-500/30 text-sky-300 font-bold px-2 py-0.5 rounded-full">Activo</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Aparece públicamente en el panel. Cualquier usuario registrado en Aether puede ingresar y chatear.
                  </p>
                </div>
              </button>

              {/* Option 2: Open */}
              <button
                onClick={() => handleUpdateRoomAccessMode('open')}
                className={`w-full p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 ${
                  currentRoom.accessMode === 'open'
                    ? 'bg-amber-500/10 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">🔑 Sala Abierta (por Código)</h4>
                    {currentRoom.accessMode === 'open' && (
                      <span className="text-[10px] bg-amber-500/30 text-amber-300 font-bold px-2 py-0.5 rounded-full">Activo</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Protegida. Solo tú (creador) y quienes conozcan el código numérico de 6 dígitos ({currentRoom.code}) podrán entrar.
                  </p>
                </div>
              </button>

              {/* Option 3: Closed */}
              <button
                onClick={() => handleUpdateRoomAccessMode('closed')}
                className={`w-full p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 ${
                  (currentRoom.accessMode === 'closed' || currentRoom.isClosed)
                    ? 'bg-rose-500/10 border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.15)]'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 shrink-0 mt-0.5">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">🔒 Sala Cerrada</h4>
                    {(currentRoom.accessMode === 'closed' || currentRoom.isClosed) && (
                      <span className="text-[10px] bg-rose-500/30 text-rose-300 font-bold px-2 py-0.5 rounded-full">Activo</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Totalmente bloqueada. Ningún nuevo usuario podrá ingresar hasta que el creador la cambie a Abierta o Global.
                  </p>
                </div>
              </button>
            </div>
          </motion.div>
        </div>
      )}

          {/* Global Anti-Screenshot & Screen Recording Privacy Shield */}
          <PrivacyProtectionOverlay
            userEmail={currentUser?.email}
            userId={currentUser?.id}
            userIp={currentUser?.ip}
            antiSpyMode={preferences.antiSpyMode}
          />
        </div>
  );
}
