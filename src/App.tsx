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
  Mic, MicOff, Square, Bot, Crown
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
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [roomRoomKey, setRoomRoomKey] = useState<CryptoKey | null>(null);
  const roomKeyRef = useRef<CryptoKey | null>(null);
  const setRoomKey = (key: CryptoKey | null) => { setRoomRoomKey(key); roomKeyRef.current = key; };
  const [roomUsers, setRoomUsers] = useState<Array<{ id: string; name: string; email: string; role?: string }>>([]);
  const [typingUsersMap, setTypingUsersMap] = useState<Record<string, boolean>>({});

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

  const playSoundEffect = useCallback(() => {
    if (!preferences.soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
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
            text = await CryptoEngine.decryptMessage(roomKeyRef.current, data.message.encryptedText);
          }
          const msgObj = { ...data.message, text };
          setMessages((prev) => {
             if (prev.some(m => m.id === msgObj.id)) return prev;
             const newMsgs = [...prev, msgObj];
             if (currentRoomRef.current?.id) {
               localStorage.setItem(`room_cache_${currentRoomRef.current.id}`, JSON.stringify(newMsgs.slice(-50)));
             }
             return newMsgs;
          });
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
      const data = await roomService.createRoom(newRoomName, false, token);
      setNewRoomName('');
      fetchRooms();
      notify('Sala creada exitosamente. Código: ' + data.code, 'success');
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

  // Send Message with 2000 character limit validation
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && attachments.length === 0) || !currentRoom || !roomRoomKey) return;

    if (inputText.trim().length > 2000) {
      notify('El mensaje escrito excede el límite de 2000 caracteres.', 'alert');
      return;
    }

    const plainText = inputText.trim();
    const encryptedText = await CryptoEngine.encryptMessage(roomRoomKey, plainText);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'SEND_MESSAGE',
          roomId: currentRoom.id,
          encryptedText,
          attachments,
          replyTo: replyToMsg ? { id: replyToMsg.id, senderName: replyToMsg.senderName, text: (replyToMsg as any).text || 'Adjunto' } : undefined,
          plainTextForAI: plainText
        })
      );
    }

    setInputText('');
    setAttachments([]);
    setReplyToMsg(null);
  };


  const handleSendZumbido = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'ZUMBIDO' }));
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
    <div style={{ "--accent": preferences.accent } as React.CSSProperties} className={`fixed inset-0 w-full h-[100dvh] flex flex-col ${preferences.theme} ${preferences.fontFam} transition-colors duration-500 bg-slate-950 text-slate-100 overflow-hidden`}>
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
      <div className="flex flex-col h-full w-full max-w-6xl mx-auto overflow-hidden bg-slate-950 text-slate-100">
        {/* Navigation Header */}
        <header className="p-3 sm:p-4 md:p-5 border-b border-slate-800/80 flex items-center justify-between gap-2 bg-slate-900/90 backdrop-blur-md shrink-0 shadow-lg">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-lg ring-2 ring-white/10 shrink-0"
              style={{ backgroundColor: preferences.accent }}
            >
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h1 className="font-black text-base sm:text-xl leading-tight text-white flex items-center gap-1.5 truncate">
                Aether Security <BadgeCheck className="w-4 h-4 text-emerald-400 shrink-0 inline" />
              </h1>
              <span className="text-[9px] sm:text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1 truncate">
                <Wifi className="w-3 h-3 shrink-0" /> Conexión Segura
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {currentUser?.role === 'admin' && (
              <button
                onClick={handleOpenAdminClick}
                className="px-2.5 sm:px-3.5 py-2 rounded-xl bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600/50 border border-indigo-500/30 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-md min-h-[40px]"
              >
                <Cpu className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="hidden sm:inline">Panel Admin</span>
                <span className="inline sm:hidden text-[11px]">Admin</span>
                {isAdmin2FAVerified ? (
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <Key className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                )}
              </button>
            )}

            <button
              onClick={() => setView('premium')}
              className="p-2 sm:p-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 transition-colors border border-amber-500/30 min-h-[40px] min-w-[40px] flex items-center justify-center"
              title="Aether Premium"
            >
              <Crown className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/50 min-h-[40px] min-w-[40px] flex items-center justify-center"
              title="Personalización"
            >
              <Settings2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {token && (
              <button
                onClick={handleLogout}
                className="p-2 sm:p-2.5 rounded-xl bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors border border-rose-500/30 min-h-[40px] min-w-[40px] flex items-center justify-center"
                title="Cerrar Sesión"
              >
                <Power className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>
        </header>

        {/* Main Body */}
        <main className="flex-1 relative overflow-hidden flex flex-col min-h-0">
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
            <div className="flex-1 p-3 sm:p-6 space-y-5 sm:space-y-6 overflow-y-auto min-h-0">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-800 shadow-xl">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--accent)] shrink-0" /> Salas de Comunicación Protegidas
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1">Usuario: <strong className="text-white">{currentUser?.name}</strong> {currentUser?.isPremium && <span title="Usuario Premium"><Crown className="w-3 h-3 text-amber-400" /></span>}</span>
                    <span>| Rol: <strong className="text-[var(--accent)] font-bold">{currentUser?.role?.toUpperCase()}</strong></span>
                    <span className="text-emerald-400 font-bold">● {currentUser?.status || 'Activo'}</span>
                  </p>
                </div>
              </div>

              {/* 2 TARJETAS GRANDES: CREAR SALA Y UNIRSE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* TARJETA 1: CREAR SALA */}
                <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 hover:border-[var(--accent)]/50 transition-all shadow-2xl flex flex-col justify-between space-y-5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)]/10 rounded-full blur-2xl group-hover:bg-[var(--accent)]/20 transition-all"></div>
                  <div className="space-y-3 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/20 text-[var(--accent)] flex items-center justify-center font-bold shadow-inner">
                      <PlusCircle className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white">Crear Nueva Sala</h3>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                      Genera un nuevo canal de comunicación encriptado con código único de 6 dígitos para interactuar de forma segura.
                    </p>
                  </div>

                  <form onSubmit={handleCreateRoom} className="space-y-3 relative z-10 pt-2">
                    <input
                      type="text"
                      placeholder="Nombre de la nueva sala..."
                      value={newRoomName}
                      onChange={(e) => setNewRoomName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 px-4 py-3.5 rounded-xl text-sm text-white focus:outline-none focus:border-[var(--accent)] font-medium min-h-[48px]"
                    />
                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-xl text-white font-extrabold text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 min-h-[48px]"
                      style={{ backgroundColor: preferences.accent }}
                    >
                      <PlusCircle className="w-5 h-5" /> Crear y Entrar a la Sala
                    </button>
                  </form>
                </div>

                {/* TARJETA 2: UNIRSE A SALA */}
                <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-all shadow-2xl flex flex-col justify-between space-y-5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
                  <div className="space-y-3 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shadow-inner">
                      <LogIn className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white">Unirse a una Sala</h3>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                      Ingresa el código de acceso de 6 dígitos de una sala existente para conectarte al chat en tiempo real.
                    </p>
                  </div>

                  <form onSubmit={handleJoinByCode} className="space-y-3 relative z-10 pt-2">
                    <input
                      type="text"
                      placeholder="Código de 6 dígitos (ej. 123456)"
                      value={joinCodeInput}
                      onChange={(e) => setJoinCodeInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 px-4 py-3.5 rounded-xl text-sm font-mono text-center text-[var(--accent)] focus:outline-none focus:border-emerald-500 font-bold min-h-[48px] tracking-wider"
                    />
                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-xl text-white font-extrabold text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 min-h-[48px]"
                      style={{ backgroundColor: preferences.accent }}
                    >
                      <ArrowRight className="w-5 h-5" /> Unirse a la Sala
                    </button>
                  </form>
                </div>
              </div>

              {/* Active Rooms Grid */}
              <div className="space-y-3">
                <h3 className="text-sm font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[var(--accent)]" /> Mis Salas Creadas ({(Array.isArray(rooms) ? rooms : []).length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {(Array.isArray(rooms) ? rooms : []).map((r) => (
                    <div
                      key={r.id}
                      onClick={() => handleJoinRoom(r)}
                      className="p-4 sm:p-5 rounded-2xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 transition-all cursor-pointer flex justify-between items-center group shadow-xl"
                    >
                      <div className="space-y-1 min-w-0 pr-2">
                        <h4 className="font-bold text-sm sm:text-base text-white group-hover:text-[var(--accent)] transition-colors flex items-center gap-2 truncate">
                          <MessageSquare className="w-4 h-4 text-[var(--accent)] shrink-0" /> {r.name}
                        </h4>
                        <p className="text-[11px] font-mono text-slate-400 truncate">Código: {r.code}</p>
                        <span className="text-[10px] text-emerald-400 font-bold block">
                          ● {r.activeUsersCount} conexiones activas
                        </span>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {currentUser && (r.createdById === currentUser.id || currentUser.role === 'admin') && (
                          <button
                            onClick={(e) => handleDeleteRoom(e, r.id)}
                            className="px-2.5 py-2 rounded-xl text-xs font-bold text-white shrink-0 opacity-80 hover:opacity-100 flex items-center gap-1 shadow-md bg-rose-600/80 hover:bg-rose-600 transition-colors"
                            title="Eliminar Sala"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          className="px-3.5 py-2 rounded-xl text-xs font-bold text-white shrink-0 opacity-90 group-hover:opacity-100 flex items-center gap-1 shadow-md min-h-[38px]"
                          style={{ backgroundColor: preferences.accent }}
                        >
                          <LogIn className="w-3.5 h-3.5" /> Entrar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
                    <h3 className="font-bold text-xs sm:text-base text-white flex items-center gap-1.5 truncate">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" /> {currentRoom.name}
                    </h3>
                    <span className="text-[10px] font-mono text-[var(--accent)] block truncate">Código: {currentRoom.code}</span>
                    {currentRoom && currentUser && (currentRoom.createdById === currentUser.id || currentUser.role === 'admin') && (
                      <div className="inline-flex items-center gap-1.5 ml-2">
                        <button
                          onClick={async () => {
                            const res = await fetch('/api/rooms/toggle-closed', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                              body: JSON.stringify({ roomId: currentRoom.id, isClosed: !currentRoom.isClosed })
                            });
                            if (res.ok) {
                              updateCurrentRoom({ ...currentRoom, isClosed: !currentRoom.isClosed });
                            }
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${currentRoom.isClosed ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'}`}
                        >
                          {currentRoom.isClosed ? 'Sala Cerrada' : 'Sala Abierta'}
                        </button>
                        <button
                          onClick={(e) => handleDeleteRoom(e, currentRoom.id)}
                          className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600/80 hover:bg-rose-600 text-white border border-rose-500/50 transition-colors flex items-center gap-1"
                          title="Eliminar esta sala"
                        >
                          <Trash2 className="w-3 h-3" /> Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleSendZumbido}
                    className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold text-xs hover:bg-amber-500/30 transition-colors flex items-center gap-1.5 min-h-[38px]"
                  >
                    <BellRing className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden sm:inline">Enviar Zumbido</span>
                    <span className="inline sm:hidden">Zumbido</span>
                  </button>
                </div>
              </div>

              {/* CONNECTED USERS BAR */}
              <div className="px-3 sm:px-4 py-2 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none shrink-0">
                <div className="flex items-center gap-2 shrink-0">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-300 whitespace-nowrap">
                    Conectados ({roomUsers.length}):
                  </span>
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
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium border transition-all shrink-0 ${
                          isUserTyping
                            ? 'bg-slate-900/80 border-[var(--accent)]/60 text-[var(--accent)] animate-pulse shadow-lg'
                            : 'bg-slate-900 border-slate-800 text-slate-300'
                        }`}
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
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-2xl sm:rounded-3xl w-full max-w-md space-y-5 text-slate-200 shadow-2xl my-auto max-h-[90dvh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Palette className="w-5 h-5 text-[var(--accent)]" /> Personalización
              </h3>
              <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-slate-800 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-2">Color Acento</label>
                <div className="grid grid-cols-6 gap-2">
                  {['#0ea5e9', '#8b5cf6', '#f43f5e', '#10b981', '#f59e0b', '#d946ef'].map((c) => (
                    <button
                      key={c}
                      onClick={() => setPreferences((prev) => ({ ...prev, accent: c }))}
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-transform ${preferences.accent === c ? 'ring-2 ring-white scale-110 shadow-lg' : ''}`}
                      style={{ backgroundColor: c }}
                    >
                      {preferences.accent === c && <Check className="w-4 h-4 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-2">Tema Visual</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                  <button
                    onClick={() => setPreferences((prev) => ({ ...prev, theme: 'dark' }))}
                    className={`py-2 text-xs font-bold rounded-xl transition-all ${preferences.theme === 'dark' ? 'bg-slate-800 text-white shadow' : 'text-slate-400'}`}
                  >
                    Dark Slate
                  </button>
                  <button
                    onClick={() => setPreferences((prev) => ({ ...prev, theme: 'oled' }))}
                    className={`py-2 text-xs font-bold rounded-xl transition-all ${preferences.theme === 'oled' ? 'bg-slate-800 text-white shadow' : 'text-slate-400'}`}
                  >
                    OLED Black
                  </button>
                </div>
              </div>

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
                    <EyeOff className="w-4 h-4 text-[var(--accent)]" /> Pantalla Anti-Miradas
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

            <button
              onClick={() => setIsSettingsOpen(false)}
              className="w-full py-3.5 rounded-xl text-white font-bold text-xs sm:text-sm shadow-xl active:scale-95 transition-transform min-h-[44px]"
              style={{ backgroundColor: preferences.accent }}
            >
              Guardar Preferencias
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
