import React, { useState, useEffect, useRef, useCallback } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, Zap, Lock, Users, Power, Send, Paperclip, 
  Settings2, X, PlusCircle, ScanLine, Sun, Moon,
  EyeOff, CheckCircle2, FileText, Download, 
  Hourglass, AlertTriangle, Trash2, Radar, 
  Info, ShieldCheck, Check, CheckCheck, Network, Activity,
  Fingerprint, Heart, BellRing, MessageSquare, PenTool, Reply,
  Palette, Paintbrush, Sparkles, LogIn, UserPlus, ShieldAlert, Cpu,
  Mail, KeyRound, BadgeCheck, Globe, CheckSquare, Layers, Wifi, UserCheck, ArrowRight, Clock,
  Key, Sliders, Volume2, VolumeX, Eye, UserCog, Award, RefreshCw,
  Mic, MicOff, Square, Bot, Crown, Radio, Server, Terminal, Plus,
  Edit3, Search, Copy
} from 'lucide-react';
import { CryptoEngine } from './lib/crypto';
import { authService, roomService, adminService, aiService } from './services';
import { AdminDashboard } from './components/AdminDashboard';
import { AudioPlayer } from './components/AudioPlayer';
import { UserProfile, SystemStats, ThreatLog, SecurityAccessLog, ChatRoom, ChatMessage, CustomPreferences } from './types';

export default function App() {
  // Theme & Personalization
  const [preferences, setPreferences] = useState<CustomPreferences>({
    theme: 'dark',
    accent: '#0ea5e9', // Cyan
    fontFam: 'font-jakarta',
    privacyBlur: true,
    soundEnabled: true,
    autoScroll: true,
    highContrast: false
  });

  // App UI State
  const [view, setView] = useState<'auth' | 'rooms' | 'chat' | 'premium'>('auth');
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'profile' | 'premium' | 'appearance' | 'security'>('profile');
  const [editProfileName, setEditProfileName] = useState('');
  const [editProfileAvatarSeed, setEditProfileAvatarSeed] = useState('');
  const [changePassCurrent, setChangePassCurrent] = useState('');
  const [changePassNew, setChangePassNew] = useState('');
  const [changePassConfirm, setChangePassConfirm] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [isAdmin2FAModalOpen, setIsAdmin2FAModalOpen] = useState(false);
  const [isPrivacyScreenActive, setIsPrivacyScreenActive] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; msg: string; type: string }>>([]);

  // Auth & Email OTP Verification State
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAdmin2FAVerified, setIsAdmin2FAVerified] = useState(false);

  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Admin 2FA Re-authentication State
  const [admin2faEmail, setAdmin2faEmail] = useState('');
  const [admin2faPassword, setAdmin2faPassword] = useState('');
  const [admin2faCode, setAdmin2faCode] = useState('');
  const [admin2faStep, setAdmin2faStep] = useState<'creds' | 'code'>('creds');
  const [admin2faError, setAdmin2faError] = useState<string | null>(null);
  const [isSendingAdminCode, setIsSendingAdminCode] = useState(false);
  const [isVerifyingAdmin2FA, setIsVerifyingAdmin2FA] = useState(false);

  // Gmail Signup Verification Step State
  const [verificationStep, setVerificationStep] = useState<'form' | 'otp'>('form');
  const [otpCode, setOtpCode] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);

  // Forgot Password State
  const [forgotStep, setForgotStep] = useState<'request' | 'verify'>('request');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [isSendingForgotCode, setIsSendingForgotCode] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Chat Disappearing Messages State (0 = off, 10s, 30s, 60s)
  const [selfDestructTime, setSelfDestructTime] = useState<number>(0);

  // Rooms & WebSockets
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
  const [roomUsers, setRoomUsers] = useState<Array<{ id: string; name: string; email: string; role?: string; avatar?: string; isPremium?: boolean; ip?: string; status?: string }>>([]);
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
  const currentUserRef = useRef<UserProfile | null>(currentUser);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

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
    if (!savedToken) return;
    try {
      const data = await authService.getMe(savedToken);
      if (data.user) {
        setCurrentUser(data.user);
      }
    } catch (err) {
      console.error("Error refreshing profile:", err);
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
    }
  }, [currentUser, isSettingsOpen]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await authService.updateProfile({ name: editProfileName, avatar: editProfileAvatarSeed }, token || undefined);
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

  // Handle Token Check on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('aether_token');
    if (savedToken) {
      authService.getMe(savedToken)
        .then((data) => {
          if (data.user) {
            setToken(savedToken);
            setCurrentUser(data.user);
            setIsAdmin2FAVerified(!!data.admin2FAVerified);
            setView('rooms');
            initWebSocket(savedToken);
          } else {
            localStorage.removeItem('aether_token');
          }
        })
        .catch(() => localStorage.removeItem('aether_token'));
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
      
      pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'PING' }));
        }
      }, 30000);
    };

    ws.onclose = () => {
      clearInterval(pingInterval);
      // Try to reconnect if token is still valid
      if (token) {
        setTimeout(() => {
          if (token) initWebSocket(token);
        }, 5000);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket Error:', error);
      ws.close();
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);

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
               }
             }
             if (currentRoomRef.current?.id) {
               localStorage.setItem(`room_cache_${currentRoomRef.current.id}`, JSON.stringify(newMsgs.slice(-50)));
             }
             return newMsgs;
          });
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

  // Handle Login Flow
  // Forgot Password - Send Code
  const handleForgotCodeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);

    if (!forgotEmail.includes('@')) {
      setForgotError('Ingresa un correo de Gmail válido.');
      return;
    }

    setIsSendingForgotCode(true);

    try {
      const data = await authService.forgotPassword(forgotEmail);
      setForgotSuccess(data.message);
      setForgotStep('verify');
      if (data.devCode) {
        setForgotCode(data.devCode);
        notify(`Código de recuperación generado: ${data.devCode}`, 'info');
      } else {
        notify(`Código enviado a ${forgotEmail}. Revisa tu bandeja de entrada o SPAM.`, 'success');
      }
    } catch (err: any) {
      setForgotError(err.message);
    } finally {
      setIsSendingForgotCode(false);
    }
  };

  // Forgot Password - Verify Code and Reset
  const handleForgotReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);

    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('Las contraseñas no coinciden.');
      return;
    }

    setIsResettingPassword(true);

    try {
      const data = await authService.resetPassword(forgotEmail, forgotCode, forgotNewPassword);
      setForgotSuccess(data.message);
      notify('Contraseña restablecida con éxito', 'success');
      
      // Go back to login after short delay
      setTimeout(() => {
        setAuthMode('login');
        setForgotStep('request');
        setForgotEmail('');
        setForgotCode('');
        setForgotNewPassword('');
        setForgotConfirmPassword('');
        setForgotSuccess(null);
      }, 2000);
      
    } catch (err: any) {
      setForgotError(err.message);
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    try {
      const data = await authService.login(authEmail, authPassword);
      localStorage.setItem('aether_token', data.token);
      setToken(data.token);
      setCurrentUser(data.user);
      setView('rooms');
      initWebSocket(data.token);
      notify('Conexión Segura e Inicio de Sesión exitoso', 'success');
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  // Request OTP Verification Code for Signup
  const handleRequestVerificationCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!authEmail.includes('@')) {
      setAuthError('Por favor ingresa un correo Gmail válido.');
      return;
    }

    setIsSendingCode(true);

    try {
      const data = await authService.sendVerificationCode(authEmail);
      setVerificationStep('otp');

      if (data.devCode) {
        setOtpCode(data.devCode);
        notify(`Código de verificación: ${data.devCode}`, 'info');
      } else if (data.emailSuccess === false) {
        setAuthError(`Aviso de entrega SMTP: (${data.emailError || 'Error de autenticación'}). Usa el código de seguridad o verifica tu servidor SMTP.`);
        notify(`Aviso de entrega por correo.`, 'alert');
      } else {
        notify(`Código de verificación enviado a ${authEmail}. Revisa tu bandeja de entrada o SPAM.`, 'success');
      }
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setIsSendingCode(false);
    }
  };

  // Complete OTP Signup
  const handleVerifyCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsVerifyingCode(true);

    try {
      const data = await authService.registerVerify({
        name: authName,
        email: authEmail,
        password: authPassword,
        code: otpCode
      });

      localStorage.setItem('aether_token', data.token);
      setToken(data.token);
      setCurrentUser(data.user);
      setView('rooms');
      initWebSocket(data.token);
      notify('Correo verificado y usuario registrado en InstantDB', 'success');
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('aether_token');
    setToken(null);
    setCurrentUser(null);
    setIsAdmin2FAVerified(false);
    setView('auth');
    setVerificationStep('form');
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
  const handleSendMessage = async (e: React.FormEvent) => {
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
          plainTextForAI: plainText
        })
      );
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

      {/* Floating Notifications */}
      <div className="fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[92%] max-w-md pointer-events-none">
        {notifications.map((n) => (
          <div
            key={n.id}
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
      <div className="flex flex-col h-full w-full max-w-6xl mx-auto overflow-hidden aether-app-bg">
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
              <span className="text-[8px] sm:text-[10px] font-mono font-bold flex items-center gap-1 truncate text-emerald-400">
                <Wifi className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" style={{ color: preferences.accent }} /> <span className="hidden sm:inline">Conexión Segura</span><span className="inline sm:hidden">Cifrado OK</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
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
          {view === 'premium' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 scrollbar-none relative overflow-hidden">
              {/* Premium Background Animations - Aurora Dorada */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-amber-400 rounded-[100%] mix-blend-multiply filter blur-[100px] opacity-20 animate-aurora"></div>
                <div className="absolute top-[10%] right-[-20%] w-[70%] h-[70%] bg-yellow-300 rounded-[100%] mix-blend-multiply filter blur-[120px] opacity-20 animate-aurora animation-delay-aurora-1"></div>
                <div className="absolute bottom-[-20%] left-[10%] w-[80%] h-[60%] bg-orange-500 rounded-[100%] mix-blend-multiply filter blur-[100px] opacity-15 animate-aurora animation-delay-aurora-2"></div>
              </div>
              
              <button
                onClick={() => setView(token ? 'rooms' : 'auth')}
                className="absolute top-4 left-4 sm:top-8 sm:left-8 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors z-20 flex items-center gap-2 font-medium shadow-lg backdrop-blur-sm"
              >
                <ArrowRight className="w-5 h-5 rotate-180" />
                <span className="hidden sm:inline">Volver</span>
              </button>

              <div className="max-w-4xl mx-auto space-y-8 pb-12 mt-12 sm:mt-0 relative z-10">
                <div className="text-center space-y-4 pt-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-tr from-amber-500 to-amber-300 rounded-3xl mx-auto flex items-center justify-center shadow-lg shadow-amber-500/20 mb-4 transform -rotate-3">
                    <Crown className="w-8 h-8 sm:w-10 sm:h-10 text-slate-950" />
                  </div>
                  <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                    Aether <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">Premium</span>
                  </h2>
                  <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto font-medium">
                    Eleva tu seguridad y privacidad al máximo nivel. Desbloquea herramientas avanzadas de IA, salas persistentes y acceso ilimitado.
                  </p>
                </div>

                {currentUser?.isPremium && (
                  <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-center space-y-2 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
                    <Crown className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                    <h3 className="text-xl font-bold text-white">Eres usuario Premium Activo</h3>
                    <p className="text-slate-300 text-sm">
                      Tu suscripción finaliza el <span className="font-mono text-amber-400 font-bold">{currentUser.premiumExpiresAt ? new Date(currentUser.premiumExpiresAt).toLocaleString() : 'N/A'}</span>
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mt-8">
                  {/* Plan Gratuito */}
                  <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col h-full relative group hover:border-slate-700 transition-colors">
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-white mb-2">Plan Básico</h3>
                      <div className="text-3xl font-black text-slate-300">$0.00 <span className="text-sm font-bold text-slate-500">/ mes</span></div>
                      <p className="text-xs text-slate-400 mt-3 font-medium">Para mensajería segura esencial.</p>
                    </div>
                    
                    <ul className="space-y-4 flex-1">
                      {[
                        'Cifrado End-to-End E2EE',
                        'Salas de chat públicas y privadas',
                        'Protección WAF básica',
                        'Límites de IA: Aether Security AI Base',
                        'Envío de archivos hasta 20 MB',
                        'Soporte comunitario'
                      ].map((feat, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                          <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
                          <span className="leading-tight">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Plan Premium */}
                  <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border-2 border-amber-500/50 shadow-2xl shadow-amber-500/10 flex flex-col h-full relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-amber-500 text-black text-[10px] font-black px-4 py-1 rounded-bl-xl uppercase tracking-widest shadow-md">
                      Recomendado
                    </div>
                    
                    <div className="mb-6 relative z-10">
                      <h3 className="text-xl font-bold text-amber-400 mb-2 flex items-center gap-2">Plan Premium <Crown className="w-4 h-4" /></h3>
                      <div className="text-3xl font-black text-white">$9.99 <span className="text-sm font-bold text-slate-500">/ mes</span></div>
                      <p className="text-xs text-slate-400 mt-3 font-medium">Para usuarios que exigen el máximo poder.</p>
                    </div>
                    
                    <ul className="space-y-4 flex-1 relative z-10">
                      {[
                        'Acceso prioritario a Aether Security AI Max (Modelos Avanzados de NVIDIA y Gemini)',
                        'Análisis de archivos complejos sin límite (hasta 200 MB)',
                        'Generación ilimitada de código y markdown enriquecido',
                        'Audios y Voice Notes ultra rápidos sin cuotas',
                        'Soporte Prioritario 24/7 (Contactar Administrador)',
                        'Inmunidad Anti-Baneo Leve (Advertencias sin bloqueo inmediato)',
                        'Reconocimiento de Perfil: Insignia Premium en tu usuario'
                      ].map((feat, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm font-medium text-slate-200">
                          <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
                          <span className="leading-tight">{feat}</span>
                        </li>
                      ))}
                    </ul>

                    {!currentUser?.isPremium && (
                      <button className="mt-8 w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black uppercase tracking-wider text-sm transition-all shadow-lg active:scale-95"
                        onClick={() => alert("Para adquirir Premium, contacta al Administrador de tu servidor y solicita la asignación a tu cuenta (" + (currentUser?.email || "tu correo") + ").")}
                      >
                        Contactar Administrador
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 1: AUTH & GMAIL OTP VERIFICATION */}
          {view === 'auth' && (
            <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto min-h-0 scrollbar-none">
              <div className="w-full max-w-md bg-slate-900 border border-slate-800/90 p-5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-2xl space-y-4 sm:space-y-6 my-auto">
                <div className="text-center space-y-2">
                  <div
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mx-auto text-white shadow-xl ring-4 ring-[var(--accent)]/20"
                    style={{ backgroundColor: preferences.accent }}
                  >
                    <Lock className="w-7 h-7 sm:w-8 sm:h-8" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white flex items-center justify-center gap-2">
                    {authMode === 'login' ? 'Acceso a Aether Security' : authMode === 'forgot' ? 'Recuperar Contraseña' : 'Registro de Usuario Gmail'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {authMode === 'login'
                      ? 'Inicia sesión con tus credenciales registradas en el sistema seguro'
                      : authMode === 'forgot' 
                      ? 'Ingresa tu Gmail para recibir un código de recuperación'
                      : 'Verifica tu dirección Gmail con un código OTP para registrar tu usuario'}
                  </p>
                </div>

                {authError && (
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-start gap-2.5">
                    <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400" />
                    <span>{authError}</span>
                  </div>
                )}

                {/* LOGIN FORM */}
                {authMode === 'login' && (
                  <form onSubmit={handleLoginSubmit} className="space-y-3.5 sm:space-y-4">
                    <div>
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[var(--accent)]" /> Correo Electrónico (Gmail)
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="tugmail@gmail.com"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 p-3 sm:p-3.5 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-[var(--accent)] transition-colors font-medium min-h-[44px]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-[var(--accent)]" /> Contraseña
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••••••"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 p-3 sm:p-3.5 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-[var(--accent)] transition-colors font-medium min-h-[44px]"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 sm:py-4 rounded-xl text-white font-bold text-xs sm:text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 min-h-[48px]"
                      style={{ backgroundColor: preferences.accent }}
                    >
                      <LogIn className="w-5 h-5" /> Entrar a la Plataforma
                    </button>
                    <div className="flex justify-end pt-2">
                      <button 
                        type="button" 
                        onClick={() => setAuthMode('forgot')}
                        className="flex items-center gap-1.5 text-xs font-bold text-[var(--accent)] hover:text-[var(--accent)] transition-colors"><Key className="w-3.5 h-3.5" /> ¿Olvidé mi contraseña?</button>
                    </div>
                  </form>
                )}

                {/* REGISTER FORM WITH GMAIL OTP STEP */}
                {authMode === 'register' && (
                  <>
                    {verificationStep === 'form' && (
                      <form onSubmit={handleRequestVerificationCode} className="space-y-3.5 sm:space-y-4">
                        <div>
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-[var(--accent)]" /> Nombre Completo
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Ej. Carlos Mendoza"
                            value={authName}
                            onChange={(e) => setAuthName(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 p-3 sm:p-3.5 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-[var(--accent)] font-medium min-h-[44px]"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-[var(--accent)]" /> Correo Gmail Único
                          </label>
                          <input
                            type="email"
                            required
                            placeholder="tugmail@gmail.com"
                            value={authEmail}
                            onChange={(e) => setAuthEmail(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 p-3 sm:p-3.5 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-[var(--accent)] font-medium min-h-[44px]"
                          />
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            * Cada correo Gmail solo puede registrarse en una única cuenta.
                          </span>
                        </div>

                        <div>
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                            <KeyRound className="w-3.5 h-3.5 text-[var(--accent)]" /> Contraseña
                          </label>
                          <input
                            type="password"
                            required
                            placeholder="Crear contraseña"
                            value={authPassword}
                            onChange={(e) => setAuthPassword(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 p-3 sm:p-3.5 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-[var(--accent)] font-medium min-h-[44px]"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isSendingCode}
                          className="w-full py-3.5 sm:py-4 rounded-xl text-white font-bold text-xs sm:text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 min-h-[48px]"
                          style={{ backgroundColor: preferences.accent }}
                        >
                          <Mail className="w-5 h-5" /> Enviar Código de Verificación a Gmail
                        </button>
                      </form>
                    )}

                    {verificationStep === 'otp' && (
                      <form onSubmit={handleVerifyCodeSubmit} className="space-y-3.5 sm:space-y-4">
                        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-[var(--accent)]/30 text-xs text-[var(--accent)] space-y-1">
                          <span className="font-bold block flex items-center gap-1.5">
                            <BadgeCheck className="w-4 h-4 text-[var(--accent)]" /> Código enviado a tu Gmail:
                          </span>
                          <p className="font-mono text-[var(--accent)] font-bold break-all">{authEmail}</p>
                          <p className="text-[11px] text-[var(--accent)]/80 mt-1">Revisa tu bandeja de entrada o la carpeta de SPAM e ingresa el código de 6 dígitos enviado por correo electrónico.</p>
                        </div>

                        <div>
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                            <KeyRound className="w-3.5 h-3.5 text-[var(--accent)]" /> Ingresa el Código de 6 Dígitos
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={6}
                            placeholder="123456"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 p-3.5 sm:p-4 rounded-xl text-center text-xl sm:text-2xl tracking-[0.3em] sm:tracking-[0.5em] font-mono text-[var(--accent)] focus:outline-none focus:border-[var(--accent)] min-h-[50px]"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isVerifyingCode || otpCode.length < 6}
                          className="w-full py-3.5 sm:py-4 rounded-xl text-white font-bold text-xs sm:text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 min-h-[48px]"
                          style={{ backgroundColor: preferences.accent }}
                        >
                          <CheckCircle2 className="w-5 h-5" /> Verificar e Ingresar a Base de Datos
                        </button>

                        <button
                          type="button"
                          onClick={() => setVerificationStep('form')}
                          className="w-full py-2 text-xs font-bold text-slate-400 hover:text-white"
                        >
                          ← Cambiar correo o datos
                        </button>
                      </form>
                    )}
                  </>
                )}

                {/* FORGOT PASSWORD FORM */}
                {authMode === 'forgot' && (
                  <>
                    {forgotSuccess ? (
                      <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-medium mb-4 flex gap-2">
                        <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                        <p>{forgotSuccess}</p>
                      </div>
                    ) : null}
                    
                    {forgotError ? (
                      <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold mb-4 flex gap-2">
                        <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400" />
                        <p>{forgotError}</p>
                      </div>
                    ) : null}

                    {forgotStep === 'request' && (
                      <form onSubmit={handleForgotCodeRequest} className="space-y-3.5 sm:space-y-4">
                        <div>
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-[var(--accent)]" /> Correo Electrónico (Gmail)
                          </label>
                          <input
                            type="email"
                            required
                            placeholder="tugmail@gmail.com"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 p-3 sm:p-3.5 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-[var(--accent)] transition-colors font-medium min-h-[44px]"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={isSendingForgotCode}
                          className="w-full py-3.5 sm:py-4 rounded-xl text-white font-bold text-xs sm:text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 min-h-[48px] disabled:opacity-50"
                          style={{ backgroundColor: preferences.accent }}
                        >
                          <Mail className="w-5 h-5" /> {isSendingForgotCode ? 'Enviando...' : 'Enviar Código al Correo'}
                        </button>
                      </form>
                    )}

                    {forgotStep === 'verify' && (
                      <form onSubmit={handleForgotReset} className="space-y-3.5 sm:space-y-4">
                        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-[var(--accent)]/30 text-xs text-[var(--accent)] space-y-1">
                          <span className="font-bold block flex items-center gap-1.5">
                            <BadgeCheck className="w-4 h-4 text-[var(--accent)]" /> Código enviado a:
                          </span>
                          <p className="font-mono text-[var(--accent)] font-bold break-all">{forgotEmail}</p>
                        </div>
                        
                        <div>
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                            <KeyRound className="w-3.5 h-3.5 text-[var(--accent)]" /> Código de 6 Dígitos
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={6}
                            placeholder="123456"
                            value={forgotCode}
                            onChange={(e) => setForgotCode(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 p-3.5 sm:p-4 rounded-xl text-center text-xl sm:text-2xl tracking-[0.3em] sm:tracking-[0.5em] font-mono text-[var(--accent)] focus:outline-none focus:border-[var(--accent)] min-h-[50px]"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5 text-[var(--accent)]" /> Cambiar contraseña
                          </label>
                          <input
                            type="password"
                            required
                            minLength={6}
                            placeholder="Nueva contraseña"
                            value={forgotNewPassword}
                            onChange={(e) => setForgotNewPassword(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 p-3 sm:p-3.5 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-[var(--accent)] transition-colors font-medium min-h-[44px]"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent)]" /> Confirmar contraseña
                          </label>
                          <input
                            type="password"
                            required
                            minLength={6}
                            placeholder="Repita la nueva contraseña"
                            value={forgotConfirmPassword}
                            onChange={(e) => setForgotConfirmPassword(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 p-3 sm:p-3.5 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-[var(--accent)] transition-colors font-medium min-h-[44px]"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isResettingPassword || forgotCode.length < 6}
                          className="w-full py-3.5 sm:py-4 rounded-xl text-white font-bold text-xs sm:text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 min-h-[48px]"
                          style={{ backgroundColor: preferences.accent }}
                        >
                          <KeyRound className="w-5 h-5" /> {isResettingPassword ? 'Cambiando...' : 'Guardar Nueva Contraseña'}
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => setForgotStep('request')}
                          className="w-full py-2 text-xs font-bold text-slate-400 hover:text-white"
                        >
                          ← Volver
                        </button>
                      </form>
                    )}
                  </>
                )}

                <div className="text-center pt-1">
                  <button
                    onClick={() => {
                      setAuthMode(authMode === 'login' ? 'register' : 'login');
                      setVerificationStep('form');
                      setAuthError(null);
                      setForgotError(null);
                      setForgotSuccess(null);
                      setForgotStep('request');
                    }}
                    className="text-xs font-bold text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-1.5 mx-auto"
                  >
                    {authMode === 'login' || authMode === 'forgot' ? (
                      <>
                        <UserPlus className="w-4 h-4 text-[var(--accent)]" /> ¿No tienes cuenta? Registrate con Gmail
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4 text-[var(--accent)]" /> ¿Ya tienes cuenta? Inicia Sesión
                      </>
                    )}
                  </button>
                  {authMode === 'forgot' && (
                    <button
                      onClick={() => setAuthMode('login')}
                      className="text-xs font-bold text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-1.5 mx-auto mt-3"
                    >
                      <LogIn className="w-4 h-4 text-[var(--accent)]" /> Regresar al Inicio de Sesión
                    </button>
                  )}
                </div>
              </div>
            </div>
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
                      {currentUser?.isPremium && (
                        <div className="absolute -bottom-2 -right-2 bg-amber-500 text-slate-950 p-1 rounded-lg border border-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                           <Crown className="w-3.5 h-3.5" />
                        </div>
                      )}
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
                      { icon: Shield, label: "Cifrado", value: "AES-256", color: "text-[var(--accent)]", bg: "bg-[var(--accent)]/10", border: "border-[var(--accent)]/20" },
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
                              key={r.id}
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
          {view === 'chat' && currentRoom && (
            <div className="flex-1 flex flex-col h-full overflow-hidden min-h-0">
              {/* Chat Top Bar */}
              <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between gap-2 shrink-0 shadow-lg">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <button
                    onClick={() => setView('rooms')}
                    className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold flex items-center gap-1 shrink-0 min-h-[38px]"
                  >
                    ← <span className="hidden sm:inline">Volver</span>
                  </button>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-xs sm:text-base text-white flex items-center gap-1.5 truncate">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" /> {currentRoom.name}
                      </h3>

                      {/* Access Mode Badge */}
                      <button
                        onClick={() => {
                          if (currentUser && (currentRoom.createdById === currentUser.id || currentUser.role === 'admin')) {
                            setIsRoomModeModalOpen(true);
                          }
                        }}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border transition-all flex items-center gap-1 ${
                          (!currentRoom.accessMode || currentRoom.accessMode === 'global')
                            ? 'bg-sky-500/20 text-sky-400 border-sky-500/30 hover:bg-sky-500/30'
                            : currentRoom.accessMode === 'open'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30'
                            : 'bg-rose-500/20 text-rose-400 border-rose-500/30 hover:bg-rose-500/30'
                        }`}
                        title="Cambiar Modalidad de Sala"
                      >
                        {(!currentRoom.accessMode || currentRoom.accessMode === 'global') && <><Globe className="w-3 h-3" /> 🌐 Global</>}
                        {currentRoom.accessMode === 'open' && <><Key className="w-3 h-3" /> 🔑 Abierta</>}
                        {(currentRoom.accessMode === 'closed' || currentRoom.isClosed) && <><Lock className="w-3 h-3" /> 🔒 Cerrada</>}
                      </button>
                    </div>

                    <span className="text-[10px] font-mono text-[var(--accent)] block truncate">
                      Código: {currentRoom.code}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setIsAiAssistantOpen(true)}
                    className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold text-xs hover:bg-purple-500/30 transition-colors flex items-center gap-1.5 min-h-[38px]"
                  >
                    <Bot className="w-4 h-4 text-purple-400 shrink-0 animate-pulse" />
                    <span className="hidden sm:inline">Asistente IA</span>
                  </button>

                  <button
                    onClick={handleSendZumbido}
                    className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold text-xs hover:bg-amber-500/30 transition-colors flex items-center gap-1.5 min-h-[38px]"
                  >
                    <BellRing className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden sm:inline">Zumbido</span>
                  </button>
                </div>
              </div>

              {/* CONNECTED USERS BAR */}
              <div className="px-3 sm:px-4 py-2 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none shrink-0">
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setIsRoomUsersModalOpen(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-emerald-400 hover:border-emerald-500/40 hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span>Ver Usuarios ({roomUsers.length})</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
                  {roomUsers.length === 0 && (
                    <span className="text-[11px] text-slate-500 italic">Conectando usuarios...</span>
                  )}
                  {roomUsers.map((u) => {
                    const isUserTyping = typingUsersMap[u.id] || (peerTyping && peerTyping === u.name);
                    return (
                      <div
                        key={u.id}
                        onClick={() => {
                          setInputText((prev) => `@${u.name} ` + prev);
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium border transition-all shrink-0 cursor-pointer hover:border-slate-600 ${
                          isUserTyping
                            ? 'bg-slate-900/80 border-[var(--accent)]/60 text-[var(--accent)] animate-pulse shadow-lg'
                            : 'bg-slate-900 border-slate-800 text-slate-300'
                        }`}
                        title={`Haz clic para mencionar a @${u.name}`}
                      >
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="font-bold text-white text-[11px]">{u.name}</span>
                        {u.role === 'admin' && (
                          <span className="bg-indigo-500/30 text-indigo-300 text-[9px] px-1 rounded font-bold uppercase">Admin</span>
                        )}
                        {isUserTyping && (
                          <span className="text-[10px] text-[var(--accent)] font-extrabold flex items-center gap-1 ml-1">
                            <Activity className="w-3 h-3 animate-spin" /> escribiendo...
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 p-3 sm:p-6 space-y-3 sm:space-y-4 overflow-y-auto min-h-0 scrollbar-none">
                {messages.map((m) => {
                  if (m.senderId === 'system') {
                    return (
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} key={m.id} className="flex justify-center w-full py-2">
                        <span className="text-center px-4 py-1.5 rounded-full bg-slate-800/50 text-[10px] sm:text-xs text-slate-400 font-mono border border-slate-700/50 shadow-sm">
                          { (m as any).text || (m as any).plainTextForAI || m.encryptedText }
                        </span>
                      </motion.div>
                    );
                  }
                  
                  // Discrete Bot Moderation Warning
                  const isBotWarning = m.id.startsWith('msg-bot-warn-') || m.senderName.includes('Moderación');
                  if (isBotWarning) {
                    return (
                      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} key={m.id} className="flex justify-center w-full my-1.5">
                        <div className="max-w-md w-full px-3.5 py-2 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between gap-2 shadow-lg backdrop-blur-md">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                            <p className="truncate text-[11px] font-medium text-amber-200/90">
                              {(m as any).text !== undefined ? (m as any).text : m.encryptedText}
                            </p>
                          </div>
                          <button
                            onClick={() => setMessages(prev => prev.filter(item => item.id !== m.id))}
                            className="p-1 hover:bg-amber-500/20 rounded-lg text-amber-400 transition-colors shrink-0"
                            title="Descartar aviso"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  }

                  const isBot = m.senderId === 'bot-ai-assistant';
                  const isMe = m.senderId === currentUser?.id;
                  return (
                    <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} key={m.id} className={`group flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
                    >
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        {isBot ? (
                          <span className="flex items-center gap-1 text-purple-400 font-bold">
                            <Bot className="w-3.5 h-3.5 text-purple-400" /> {m.senderName}
                          </span>
                        ) : (
                          <>
                            <UserCheck className="w-3 h-3 text-[var(--accent)]" /> {m.senderName}
                          </>
                        )}
                      </span>
                      <div
                        className={`p-3.5 sm:p-4 max-w-[85%] sm:max-w-md rounded-2xl text-xs sm:text-sm ${
                          isMe
                            ? 'bg-[var(--accent)] text-white rounded-br-none shadow-md'
                            : isBot
                            ? 'bg-slate-900/90 text-purple-100 rounded-bl-none border border-purple-500/30 shadow-xl'
                            : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700/50'
                        }`}
                        style={isMe ? { backgroundColor: preferences.accent } : {}}
                      >
                        {m.replyTo && (
                          <div className="p-2 mb-2 rounded-lg bg-black/20 text-xs border-l-2 border-white/50">
                            <span className="font-bold block text-[10px]">{m.replyTo.senderName}</span>
                            <p className="truncate text-[11px] opacity-80">{m.replyTo.text}</p>
                          </div>
                        )}

                        {isBot ? (
                          <div className="prose prose-invert prose-sm max-w-none break-words leading-relaxed">
                            <Markdown remarkPlugins={[remarkGfm]}>{(m as any).text !== undefined ? String((m as any).text) : String(m.encryptedText)}</Markdown>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap font-medium break-words leading-relaxed">{(m as any).text !== undefined ? (m as any).text : m.encryptedText}</p>
                        )}

                        {m.attachments && m.attachments.length > 0 && (
                          <div className="mt-2 space-y-2">
                             {m.attachments.map((att, idx) => (
                              <div key={idx} className="rounded-xl overflow-hidden bg-black/30 p-2 space-y-2">
                                {att.type.startsWith('image/') ? (
                                  <div className="space-y-2">
                                    <img
                                      src={att.data}
                                      alt={att.name}
                                      onClick={() => setLightboxImage(att.data)}
                                      className="max-h-36 sm:max-h-48 rounded-lg cursor-pointer hover:opacity-90 transition-opacity object-cover w-full"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleAnalyzeMultimodal(att.data, att.type, att.name)}
                                      disabled={analyzingMediaData === att.data}
                                      className="w-full px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50"
                                    >
                                      {analyzingMediaData === att.data ? (
                                        <>
                                          <Activity className="w-3.5 h-3.5 animate-spin text-purple-300" />
                                          <span>Analizando visión con NVIDIA NIM + Gemini...</span>
                                        </>
                                      ) : (
                                        <>
                                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                          <span>{mediaAnalysisMap[att.data] ? 'Re-analizar Imagen con IA' : 'Analizar Imagen con IA Multimodal'}</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                ) : att.type.startsWith('video/') ? (
                                  <div className="space-y-2">
                                    <video src={att.data} controls className="max-h-48 w-full rounded-lg" />
                                    <button
                                      type="button"
                                      onClick={() => handleAnalyzeMultimodal(att.data, att.type, att.name)}
                                      disabled={analyzingMediaData === att.data}
                                      className="w-full px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50"
                                    >
                                      {analyzingMediaData === att.data ? (
                                        <>
                                          <Activity className="w-3.5 h-3.5 animate-spin text-purple-300" />
                                          <span>Analizando video con NVIDIA NIM + Gemini...</span>
                                        </>
                                      ) : (
                                        <>
                                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                          <span>{mediaAnalysisMap[att.data] ? 'Re-analizar Video con IA' : 'Analizar Video con IA Multimodal'}</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                ) : att.type.startsWith('audio/') ? (
                                  <div className="space-y-2">
                                    <AudioPlayer src={att.data} mimeType={att.type} filename={att.name} />
                                    <button
                                      type="button"
                                      onClick={() => handleAnalyzeAudio(att.data, att.type)}
                                      disabled={analyzingAudioData === att.data}
                                      className="w-full px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50"
                                    >
                                      {analyzingAudioData === att.data ? (
                                        <>
                                          <Activity className="w-3.5 h-3.5 animate-spin text-indigo-300" />
                                          <span>Analizando audio con NVIDIA NIM + Gemini...</span>
                                        </>
                                      ) : (
                                        <>
                                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                          <span>{audioAnalysisMap[att.data] ? 'Re-analizar Audio con IA' : 'Analizar Audio con IA Multimodal'}</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <a
                                      href={att.data}
                                      download={att.name}
                                      className="text-xs font-bold text-[var(--accent)] flex items-center gap-1.5 underline break-all"
                                    >
                                      <Download className="w-4 h-4 shrink-0" /> {att.name}
                                    </a>
                                    <button
                                      type="button"
                                      onClick={() => handleAnalyzeMultimodal(att.data, att.type, att.name)}
                                      disabled={analyzingMediaData === att.data}
                                      className="w-full px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50"
                                    >
                                      {analyzingMediaData === att.data ? (
                                        <>
                                          <Activity className="w-3.5 h-3.5 animate-spin text-purple-300" />
                                          <span>Analizando documento con IA Multimodal...</span>
                                        </>
                                      ) : (
                                        <>
                                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                          <span>{mediaAnalysisMap[att.data] ? 'Re-analizar Documento' : 'Analizar Documento con IA'}</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                )}

                                {/* Media Analysis Result Display */}
                                {mediaAnalysisMap[att.data] && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-3 rounded-xl bg-slate-950/95 border border-purple-500/40 text-xs text-slate-200 space-y-1.5 mt-1 shadow-2xl"
                                  >
                                    <div className="flex justify-between items-center border-b border-purple-500/20 pb-1 text-[11px] font-bold text-purple-300">
                                      <span className="flex items-center gap-1.5">
                                        <Bot className="w-3.5 h-3.5 text-purple-400" />
                                        Análisis Multimodal {mediaAnalysisMap[att.data].provider ? `(${mediaAnalysisMap[att.data].provider})` : ''}
                                      </span>
                                      <button
                                        onClick={() => setMediaAnalysisMap(prev => {
                                          const copy = { ...prev };
                                          delete copy[att.data];
                                          return copy;
                                        })}
                                        className="hover:text-rose-400 p-0.5"
                                        title="Cerrar análisis"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                    <p className="whitespace-pre-wrap text-[11px] text-slate-300 leading-relaxed font-sans">
                                      {mediaAnalysisMap[att.data].analysis}
                                    </p>
                                  </motion.div>
                                )}

                                {/* Audio Analysis Result Display */}
                                {att.type.startsWith('audio/') && audioAnalysisMap[att.data] && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-3 rounded-xl bg-slate-950/90 border border-indigo-500/40 text-xs text-slate-200 space-y-1.5 mt-1 shadow-xl"
                                  >
                                    <div className="flex justify-between items-center border-b border-indigo-500/20 pb-1 text-[11px] font-bold text-indigo-300">
                                      <span className="flex items-center gap-1.5">
                                        <Bot className="w-3.5 h-3.5 text-indigo-400" />
                                        Análisis de Voz (NVIDIA NIM + Gemini)
                                      </span>
                                      <button
                                        onClick={() => setAudioAnalysisMap(prev => {
                                          const copy = { ...prev };
                                          delete copy[att.data];
                                          return copy;
                                        })}
                                        className="hover:text-rose-400 p-0.5"
                                        title="Cerrar análisis"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                    <p className="whitespace-pre-wrap text-[11px] text-slate-300 leading-relaxed font-sans">
                                      {audioAnalysisMap[att.data]}
                                    </p>
                                  </motion.div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {m.reactions && m.reactions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {m.reactions.map((r, i) => (
                              <span key={i} className="px-1.5 py-0.5 bg-black/20 rounded-full text-[10px]" title={r.senderName}>
                                {r.emoji}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className={`flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? 'mr-1' : 'ml-1'}`}>
                        <button onClick={() => setReplyToMsg(m as any)} className="p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-200" title="Responder">
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleReaction(m.id, '👍')} className="p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-200" title="Me gusta">
                          👍
                        </button>
                        <button onClick={() => handleReaction(m.id, '❤️')} className="p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-200" title="Me encanta">
                          ❤️
                        </button>
                        <button onClick={() => handleReaction(m.id, '😂')} className="p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-200" title="Jaja">
                          😂
                        </button>
                      </div>
                    </motion.div>
                  );
                })}

                {peerTyping && (
                  <div className="text-xs font-bold text-[var(--accent)] animate-pulse flex items-center gap-2 p-2 bg-slate-900/40 rounded-xl border border-[var(--accent)]/20 w-fit">
                    <Activity className="w-4 h-4 text-[var(--accent)] animate-spin" /> {peerTyping} está escribiendo...
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-900 shrink-0 space-y-2">
                {/* Limits & Counter Header */}
                <div className="flex flex-wrap justify-between items-center text-[10px] font-mono text-slate-400 px-1 gap-1">
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="bg-slate-800 px-2 py-0.5 rounded text-[9px] border border-slate-700">
                      Límites: 📷 5 fotos | 🎥 5 vids | 📄 5 docs | 🎙️ 5 audios
                    </span>
                  </div>
                  <span className={`font-bold ${inputText.length > 2000 ? "text-rose-400 animate-pulse" : inputText.length > 1800 ? "text-amber-400" : "text-slate-400"}`}>
                    {inputText.length} / 2000 car.
                  </span>
                </div>

                {attachments.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {attachments.map((att, idx) => (
                      <div key={idx} className="relative p-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white flex items-center gap-2 shrink-0">
                        {att.type.startsWith('audio/') ? (
                          <Mic className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : att.type.startsWith('image/') ? (
                          <Eye className="w-4 h-4 text-sky-400 shrink-0" />
                        ) : (
                          <FileText className="w-4 h-4 text-[var(--accent)] shrink-0" />
                        )}
                        <span className="truncate max-w-[120px]">{att.name}</span>
                        <button
                          type="button"
                          onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                          className="p-1 hover:bg-slate-700 rounded-full"
                        >
                          <X className="w-3.5 h-3.5 text-rose-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {isRecordingAudio ? (
                  <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-rose-950/60 border border-rose-500/60 text-xs text-rose-200 animate-pulse w-full">
                    <div className="flex items-center gap-2.5">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                      </span>
                      <span className="font-bold text-xs sm:text-sm">
                        Grabar Nota de Voz ({String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:{String(recordingSeconds % 60).padStart(2, '0')})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => stopAudioRecording(false)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1 shadow-md"
                      >
                        <X className="w-3.5 h-3.5 text-rose-400" /> Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => stopAudioRecording(true)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-lg active:scale-95 transition-all"
                      >
                        <Check className="w-3.5 h-3.5" /> Adjuntar Audio
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                      multiple
                      accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-3 sm:p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
                      title="Adjuntar archivos (Imágenes, Videos, Docs, Audios)"
                    >
                      <Paperclip className="w-5 h-5 text-[var(--accent)]" />
                    </button>

                    <button
                      type="button"
                      onClick={startAudioRecording}
                      className="p-3 sm:p-3.5 rounded-2xl bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-500/30 min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0 transition-colors"
                      title="Grabar nota de voz"
                    >
                      <Mic className="w-5 h-5" />
                    </button>

                    <input
                      type="text"
                      maxLength={2000}
                      placeholder="Escribe tu mensaje seguro (máx. 2000 car)..."
                      value={inputText}
                      onChange={(e) => {
                        setInputText(e.target.value);
                        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                          wsRef.current.send(JSON.stringify({ type: 'TYPING' }));
                        }
                      }}
                      className="flex-1 bg-slate-950 border border-slate-800 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm text-white focus:outline-none focus:border-[var(--accent)] min-h-[44px]"
                    />
                    <button
                      type="submit"
                      disabled={inputText.length > 2000}
                      className="p-3 sm:p-3.5 rounded-2xl text-white font-bold shadow-lg active:scale-95 transition-transform flex items-center justify-center min-h-[44px] min-w-[44px] shrink-0 disabled:opacity-50"
                      style={{ backgroundColor: preferences.accent }}
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </form>
                )}
              </div>

            </div>
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
          <div className="aether-modal border border-slate-800/80 p-5 sm:p-7 rounded-2xl sm:rounded-3xl w-full max-w-lg sm:max-w-xl space-y-5 text-slate-200 shadow-2xl my-auto max-h-[92dvh] overflow-y-auto scrollbar-thin">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-[var(--accent)]" /> Ajustes & Perfil de Usuario
              </h3>
              <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="grid grid-cols-4 bg-slate-950 p-1 rounded-2xl border border-slate-800 gap-1 text-center">
              <button
                onClick={() => setSettingsTab('profile')}
                className={`py-2 px-1 text-[11px] sm:text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 ${settingsTab === 'profile' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-300'}`}
              >
                <UserCheck className="w-3.5 h-3.5 shrink-0" /> Perfil
              </button>
              <button
                onClick={() => setSettingsTab('premium')}
                className={`py-2 px-1 text-[11px] sm:text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 ${settingsTab === 'premium' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow' : 'text-amber-400/70 hover:text-amber-300'}`}
              >
                <Crown className="w-3.5 h-3.5 shrink-0 text-amber-400" /> VIP
              </button>
              <button
                onClick={() => setSettingsTab('appearance')}
                className={`py-2 px-1 text-[11px] sm:text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 ${settingsTab === 'appearance' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-300'}`}
              >
                <Palette className="w-3.5 h-3.5 shrink-0" /> Diseño
              </button>
              <button
                onClick={() => setSettingsTab('security')}
                className={`py-2 px-1 text-[11px] sm:text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 ${settingsTab === 'security' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-300'}`}
              >
                <Lock className="w-3.5 h-3.5 shrink-0" /> Seguridad
              </button>
            </div>

            {/* TAB: PROFILE */}
            {settingsTab === 'profile' && (
              <form onSubmit={handleUpdateProfile} className="space-y-5">
                {/* Avatar Section */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative group shrink-0">
                    <img 
                      src={`https://api.dicebear.com/7.x/identicon/svg?seed=${editProfileAvatarSeed}&backgroundColor=transparent`} 
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
                    <p className="text-[10px] text-slate-500">Avatar único generado algorítmicamente vía Identicon.</p>
                  </div>
                </div>

                {/* Edit Username */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 block">Nombre de Usuario</label>
                  <input
                    type="text"
                    value={editProfileName}
                    onChange={(e) => setEditProfileName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 px-4 py-3 rounded-xl text-sm text-white focus:outline-none focus:border-[var(--accent)] transition-colors shadow-inner"
                    placeholder="Tu nombre..."
                    required
                  />
                </div>

                {/* Account Details Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <p className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-indigo-400" /> Correo Gmail
                    </p>
                    <p className="text-xs font-bold text-slate-200 truncate">{currentUser?.email || 'N/A'}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-cyan-400" /> ID de Cuenta
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          if (currentUser?.id) {
                            navigator.clipboard.writeText(currentUser.id);
                            notify("ID de cuenta copiado al portapapeles", "success");
                          }
                        }}
                        className="text-[10px] font-bold text-[var(--accent)] hover:underline"
                      >
                        Copiar
                      </button>
                    </div>
                    <p className="text-xs font-mono font-bold text-slate-300 truncate">{currentUser?.id || 'N/A'}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <p className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-emerald-400" /> Rol en la Red
                    </p>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-extrabold ${currentUser?.role === 'admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'}`}>
                      {currentUser?.role === 'admin' ? 'Administrador Master' : 'Usuario Verificado'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <p className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1.5">
                      <Network className="w-3.5 h-3.5 text-amber-400" /> IP Registrada
                    </p>
                    <p className="text-xs font-mono font-bold text-slate-300">{currentUser?.ip || '0.0.0.0'}</p>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl text-white font-bold text-xs sm:text-sm shadow-xl active:scale-95 transition-transform min-h-[44px]"
                  style={{ backgroundColor: preferences.accent }}
                >
                  Guardar Perfil
                </button>
              </form>
            )}

            {/* TAB: PREMIUM STATUS & VIP BENEFITS */}
            {settingsTab === 'premium' && (
              <div className="space-y-5">
                {currentUser?.isPremium ? (
                  <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-amber-950/40 border-2 border-amber-500/50 shadow-xl shadow-amber-500/10 space-y-4 relative overflow-hidden">
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

                    <div className="space-y-2 pt-2">
                      <p className="text-xs font-bold text-amber-300 uppercase tracking-wider">Beneficios VIP Desbloqueados:</p>
                      <ul className="grid grid-cols-1 gap-2 text-xs text-slate-200">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /> Paleta de Colores Exclusiva VIP Desbloqueada
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /> IA Aether Max de Respuesta Ultrarrápida
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /> Transferencia de Archivos hasta 200 MB
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /> Inmunidad Anti-Baneo Leve Automática
                        </li>
                      </ul>
                    </div>

                    <button
                      onClick={() => alert("Tu membresía VIP está totalmente activa. Si necesitas extender la duración o cambiar tu plan, contacta al administrador del sistema (" + currentUser.email + ").")}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95"
                    >
                      Contactar Administrador / Consultar Plan
                    </button>
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Suscripción Báltica / Plan Básico</h4>
                        <p className="text-xs text-slate-400">Acceso a funciones esenciales de seguridad.</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                      <p className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <Crown className="w-4 h-4" /> ¿Deseas desbloquear Aether Premium?
                      </p>
                      <p className="text-xs text-slate-300">
                        Obtén colores de diseño exclusivos, respuesta IA de máxima velocidad y soporte prioritario por solo <span className="font-bold text-amber-400">$9.99/mes</span>.
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

            {/* TAB: APPEARANCE & COLORS */}
            {settingsTab === 'appearance' && (
              <div className="space-y-5">
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
                  <label className="text-xs font-bold text-slate-400 block mb-2">Tema Visual</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
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

            {/* TAB: SECURITY & PASSWORD */}
            {settingsTab === 'security' && (
              <div className="space-y-5">
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
                      placeholder="Repite la nueva contraseña..."
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isChangingPass}
                    className="w-full py-2.5 mt-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors disabled:opacity-50"
                  >
                    {isChangingPass ? 'Actualizando...' : 'Actualizar Contraseña'}
                  </button>
                </form>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> Sesión Cifrada y Token Activo
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Tu sesión está protegida con cifrado AES-256 en cliente y servidor. Si sospechas de acceso no autorizado, puedes cerrar la sesión para invalidar el token actual.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem('aether_token');
                      setToken(null);
                      setCurrentUser(null);
                      setView('auth');
                      setIsSettingsOpen(false);
                      notify("Sesión cerrada correctamente", "info");
                    }}
                    className="w-full py-2.5 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30 font-bold text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <Power className="w-3.5 h-3.5" /> Cerrar Sesión Segura
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

      {/* MODAL 2: INTERACTIVE ROOM USERS LIST */}
      {isRoomUsersModalOpen && currentRoom && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-5 shadow-2xl relative max-h-[85vh] flex flex-col"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Usuarios Conectados</h3>
                  <p className="text-xs text-slate-400">{roomUsers.length} miembros activos en {currentRoom.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsRoomUsersModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Input */}
            <div className="relative shrink-0">
              <input
                type="text"
                placeholder="Buscar usuario por nombre o correo..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[var(--accent)]"
              />
            </div>

            {/* User Directory List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-none">
              {roomUsers
                .filter(u => u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) || u.email.toLowerCase().includes(userSearchTerm.toLowerCase()))
                .map((u) => {
                  const isCreator = currentRoom.createdById === u.id;
                  const isAdmin = u.role === 'admin';
                  return (
                    <div
                      key={u.id}
                      className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-sm">
                            {u.avatar ? (
                              <img src={u.avatar} alt={u.name} className="w-full h-full rounded-xl object-cover" />
                            ) : (
                              u.name.substring(0, 2).toUpperCase()
                            )}
                          </div>
                          <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-950 rounded-full"></span>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-xs font-bold text-white truncate">{u.name}</h4>
                            {isCreator && (
                              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] px-1.5 py-0.2 rounded font-extrabold flex items-center gap-0.5">
                                <Crown className="w-2.5 h-2.5" /> Creador
                              </span>
                            )}
                            {isAdmin && (
                              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] px-1.5 py-0.2 rounded font-extrabold">
                                Admin
                              </span>
                            )}
                            {u.isPremium && (
                              <span className="bg-amber-400 text-slate-950 text-[9px] px-1.5 py-0.2 rounded font-extrabold">
                                VIP
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">{u.email}</p>
                        </div>
                      </div>

                      {/* User Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => {
                            setInputText((prev) => `@${u.name} ` + prev);
                            setIsRoomUsersModalOpen(false);
                            notify(`Mención a @${u.name} lista en el chat`, 'info');
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold transition-all flex items-center gap-1"
                          title="Mencionar en el chat"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-[var(--accent)]" /> Mencionar
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL 3: AI ASSISTANT SIDE DRAWER */}
      {isAiAssistantOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full p-6 flex flex-col justify-between shadow-2xl relative"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    <Bot className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Asistente IA Aether</h3>
                    <p className="text-xs text-slate-400">Inteligencia Artificial Multimodal Integrada</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAiAssistantOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick AI Prompts */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleAskAiAssistant('Resume en 3 puntos clave la conversación actual de la sala.')}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500/40 text-left text-xs text-slate-300 font-medium transition-all"
                >
                  ✨ Resumir Conversación
                </button>
                <button
                  onClick={() => handleAskAiAssistant('Dame 3 sugerencias de respuesta inteligentes para responder amablemente en este chat.')}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500/40 text-left text-xs text-slate-300 font-medium transition-all"
                >
                  💡 Sugerir Respuesta
                </button>
              </div>

              {/* Response Display Box */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 min-h-[180px] max-h-[350px] overflow-y-auto space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-400">
                  <Sparkles className="w-4 h-4" /> Respuesta de la IA:
                </div>
                {isAiDrawerLoading ? (
                  <div className="flex items-center justify-center py-8 gap-2 text-xs text-purple-300 font-bold animate-pulse">
                    <Activity className="w-4 h-4 animate-spin" /> Procesando con Aether AI...
                  </div>
                ) : aiDrawerResponse ? (
                  <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {aiDrawerResponse}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic py-4">
                    Escribe una pregunta o haz clic en los botones superiores para interactuar con la IA.
                  </p>
                )}
              </div>
            </div>

            {/* AI Prompt Form */}
            <div className="space-y-2 pt-4 border-t border-slate-800">
              <div className="relative flex items-center bg-slate-950 border border-slate-800 rounded-2xl p-1.5">
                <input
                  type="text"
                  placeholder="Pregunta algo a la IA..."
                  value={aiDrawerPrompt}
                  onChange={(e) => setAiDrawerPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAskAiAssistant();
                  }}
                  className="flex-1 bg-transparent px-3 text-xs text-white placeholder-slate-500 outline-none"
                />
                <button
                  onClick={() => handleAskAiAssistant()}
                  disabled={isAiDrawerLoading}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all disabled:opacity-50"
                >
                  Consultar
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
