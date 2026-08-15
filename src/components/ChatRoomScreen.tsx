import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck, Bot, Users, Globe, Key, Lock, BellRing, Activity,
  Paperclip, Image as ImageIcon, Send, X, Mic, Download, Sparkles,
  MessageSquare, Crown, Info, ChevronRight, ChevronLeft, MoreVertical,
  Reply, ShieldAlert, CheckCircle2, ChevronDown, Smile, Search,
  Pin, PinOff, Copy, Check, CheckCheck, Clock, Trash2, BarChart2, Flame, Volume2,
  Square, Play, Pause, RefreshCw, Terminal, Code2, List, Quote,
  Bold, Italic, Strikethrough, ChevronUp, ArrowDown, User, AtSign,
  HelpCircle, Eye, EyeOff, Hash, Zap, Cpu, Compass, Layers, CheckSquare
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage, ChatRoom, CustomPreferences, UserProfile } from '../types';
import { CryptoEngine } from '../lib/crypto';

interface ChatRoomScreenProps {
  currentRoom: ChatRoom;
  currentUser: UserProfile;
  roomRoomKey: CryptoKey | null;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  roomUsers: Array<any>;
  typingUsersMap: Record<string, boolean>;
  peerTyping: string | null;
  preferences: CustomPreferences;
  token?: string | null;
  wsRef?: React.RefObject<WebSocket | null>;
  notify?: (msg: string, type?: 'info' | 'success' | 'alert' | 'error') => void;
  
  inputText: string;
  setInputText: React.Dispatch<React.SetStateAction<string>>;
  attachments: any[];
  setAttachments: React.Dispatch<React.SetStateAction<any[]>>;
  replyToMsg: ChatMessage | null;
  setReplyToMsg: React.Dispatch<React.SetStateAction<ChatMessage | null>>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  
  handleSendMessage: (e: React.FormEvent, customSelfDestruct?: number, customPoll?: any, customFormat?: string, customCodeLang?: string) => Promise<void>;
  handleSendZumbido: () => void;
  handleReaction: (messageId: string, emoji: string) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAnalyzeMultimodal: (data: string, type: string, name: string) => void;
  handleAnalyzeAudio: (data: string, type: string) => void;
  handleTyping: (e: React.ChangeEvent<HTMLInputElement>) => void;
  
  mediaAnalysisMap: Record<string, any>;
  analyzingMediaData: string | null;
  audioAnalysisMap: Record<string, any>;
  analyzingAudioData: string | null;
  
  setView: (view: 'auth'|'rooms'|'chat'|'premium') => void;
  setIsRoomModeModalOpen: (open: boolean) => void;
  setLightboxImage: (url: string | null) => void;
  
  // AI Panel
  isAiAssistantOpen: boolean;
  setIsAiAssistantOpen: (open: boolean) => void;
  aiDrawerPrompt: string;
  setAiDrawerPrompt: (val: string) => void;
  handleAskAiAssistant: (overridePrompt?: string) => void;
  isAiDrawerLoading: boolean;
  aiDrawerResponse: string;
}

// Self-Destructing Message Animated Countdown Component
function SelfDestructBadge({
  selfDestructSeconds,
  timestamp,
  onExpire
}: {
  selfDestructSeconds: number;
  timestamp: number;
  onExpire?: () => void;
}) {
  const [secondsLeft, setSecondsLeft] = useState(() => {
    const elapsed = Math.floor((Date.now() - timestamp) / 1000);
    return Math.max(0, selfDestructSeconds - elapsed);
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - timestamp) / 1000);
      const remaining = Math.max(0, selfDestructSeconds - elapsed);
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onExpire?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timestamp, selfDestructSeconds, onExpire]);

  const percentage = Math.max(0, Math.min(100, (secondsLeft / selfDestructSeconds) * 100));

  return (
    <div className="mt-2 pt-2 border-t border-slate-800/80 flex flex-col gap-1 w-full select-none">
      <div className="flex items-center justify-between text-[10px] text-rose-400 font-mono font-bold">
        <div className="flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-rose-500 animate-bounce" />
          <span>Autodestrucción en curso</span>
        </div>
        <span className="bg-rose-950/80 border border-rose-500/40 text-rose-300 px-1.5 py-0.5 rounded text-[9px] font-mono">
          {secondsLeft}s
        </span>
      </div>
      <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-rose-900/30">
        <div
          className="bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600 h-full transition-all duration-1000"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// EMOJI CATEGORIES FOR ADVANCED PICKER
const EMOJI_CATEGORIES = [
  { label: 'Frecuentes', emojis: ['👍', '❤️', '🔥', '😂', '🚀', '👏', '🎉', '👀', '💯', '✨'] },
  { label: 'Caras', emojis: ['😀', '😎', '🤔', '🥳', '🤯', '🤫', '😇', '🤠', '😴', '🤖', '💀', '👻'] },
  { label: 'Gestos', emojis: ['✌️', '👌', '🤙', '🤝', '🙌', '💪', '🙏', '👊', '👋', '🫡', '🎯', '⚡'] },
  { label: 'Seguridad / Cyber', emojis: ['🛡️', '🔒', '🔑', '💻', '📡', '🛰️', '💾', '🌐', '🧠', '⚙️', '🧬', '🔮'] },
  { label: 'Símbolos', emojis: ['✅', '⚠️', '❌', '💎', '👑', '⭐', '🌟', '💡', '📌', '🔔', '📣', '☕'] }
];

// SLASH COMMANDS LIST
const SLASH_COMMANDS = [
  { command: '/bot', desc: 'Preguntar a Aether IA directamente en la sala', example: '/bot resume la conversación' },
  { command: '/poll', desc: 'Crear una encuesta interactiva', example: '/poll ¿Lanzamos el release hoy? | Sí | No' },
  { command: '/zumbido', desc: 'Enviar una alerta de atención a todos en la sala', example: '/zumbido' },
  { command: '/shrug', desc: 'Enviar ¯\\_(ツ)_/¯', example: '/shrug' },
  { command: '/tableflip', desc: 'Enviar (╯°□°)╯︵ ┻━┻', example: '/tableflip' },
  { command: '/clear', desc: 'Limpiar historial de la pantalla local', example: '/clear' },
  { command: '/help', desc: 'Ver todos los comandos disponibles', example: '/help' }
];

// Waveform Audio Player Component
function EnhancedAudioPlayer({
  src,
  filename,
  onAnalyze,
  isAnalyzing,
  analysisResult,
  accentColor
}: {
  src: string;
  filename: string;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  analysisResult?: string;
  accentColor: string;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = pos * duration;
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full max-w-sm rounded-2xl bg-slate-950/90 border border-slate-800 p-3 shadow-xl backdrop-blur-md space-y-2.5">
      <div className="flex items-center gap-3">
        {/* Play / Pause button */}
        <button
          type="button"
          onClick={togglePlay}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all shadow-md shrink-0 hover:scale-105 active:scale-95"
          style={{ backgroundColor: accentColor }}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>

        {/* Waveform Bar & Title */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="font-bold text-slate-200 truncate">{filename}</span>
            <span className="font-mono text-[10px] text-slate-400">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Interactive Waveform / Progress bar */}
          <div
            onClick={handleSeek}
            className="h-6 w-full bg-slate-900/90 rounded-lg p-1 flex items-center gap-0.5 cursor-pointer overflow-hidden border border-slate-800"
          >
            {Array.from({ length: 28 }).map((_, i) => {
              const barProgress = (i / 28) * 100;
              const isPast = barProgress <= progressPercent;
              // Pseudo-random height for soundwave look
              const heights = [35, 60, 90, 45, 80, 100, 50, 70, 95, 40, 85, 65, 90, 75, 45, 100, 80, 60, 90, 40, 70, 85, 55, 90, 65, 40, 75, 50];
              const h = heights[i % heights.length];
              return (
                <div
                  key={i}
                  className="flex-1 rounded-full transition-all"
                  style={{
                    height: `${h}%`,
                    backgroundColor: isPast ? accentColor : '#334155'
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Download Audio */}
        <a
          href={src}
          download={filename}
          className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors shrink-0"
          title="Descargar Nota de Voz"
        >
          <Download className="w-4 h-4" />
        </a>
      </div>

      {/* Hidden native audio element */}
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        className="hidden"
      />

      {/* AI Audio Transcript / Analysis action */}
      <div className="pt-1 flex items-center justify-between border-t border-slate-800/80">
        <button
          type="button"
          onClick={onAnalyze}
          disabled={isAnalyzing}
          className="px-2.5 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
        >
          {isAnalyzing ? (
            <>
              <Activity className="w-3 h-3 animate-spin text-purple-400" />
              <span>Transcribiendo...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>Transcribir / Analizar con IA</span>
            </>
          )}
        </button>
        <span className="text-[9px] font-mono text-slate-500 uppercase">Audio HD</span>
      </div>

      {/* Inline AI Audio Analysis Result */}
      {analysisResult && (
        <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs text-slate-200 mt-2 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-purple-300 text-[10px] uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Transcripción & Análisis
          </div>
          <div className="prose prose-invert prose-xs max-w-none text-slate-300 text-xs leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysisResult}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}

// Custom Code Block Renderer with Language Header & Copy Button
function CodeBlockComponent({ language, value }: { language?: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2.5 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-900/90 border-b border-slate-800 text-[10px] font-mono text-slate-400">
        <span className="font-bold text-indigo-400 flex items-center gap-1 uppercase tracking-wider">
          <Code2 className="w-3 h-3" /> {language || 'code'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-white transition-colors px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copiado!' : 'Copiar'}</span>
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto text-xs font-mono text-slate-200 leading-relaxed scrollbar-thin scrollbar-thumb-slate-800">
        <code>{value}</code>
      </pre>
    </div>
  );
}

// Interactive Poll Viewer Component
function InChatPollComponent({
  poll,
  messageId,
  currentUserId,
  onVote,
  accentColor
}: {
  poll: { question: string; options: Array<{ id: string; text: string; votes: string[] }>; totalVotes?: number; closed?: boolean };
  messageId: string;
  currentUserId: string;
  onVote: (messageId: string, optionId: string) => void;
  accentColor: string;
}) {
  const total = poll.options.reduce((acc, opt) => acc + (opt.votes?.length || 0), 0);

  return (
    <div className="w-full max-w-md rounded-2xl bg-slate-950/90 border border-slate-800 p-4 shadow-xl space-y-3 select-none">
      <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <BarChart2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-white">{poll.question}</h4>
            <p className="text-[10px] text-slate-400">Votación en tiempo real • {total} {total === 1 ? 'voto' : 'votos'}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {poll.options.map((opt, optIdx) => {
          const voteCount = opt.votes?.length || 0;
          const pct = total > 0 ? Math.round((voteCount / total) * 100) : 0;
          const hasVoted = Boolean(opt.votes && opt.votes.includes(currentUserId));

          return (
            <button
              key={opt.id ? `${opt.id}-${optIdx}` : `opt-${optIdx}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onVote(messageId, opt.id);
              }}
              className={`w-full p-2.5 rounded-xl border text-left relative overflow-hidden transition-all group flex items-center justify-between cursor-pointer active:scale-[0.99] ${
                hasVoted
                  ? 'border-indigo-500/70 bg-indigo-950/40 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                  : 'border-slate-800 bg-slate-900/80 hover:border-slate-600 hover:bg-slate-900'
              }`}
            >
              {/* Progress bar background fill */}
              <div
                className="absolute left-0 top-0 bottom-0 opacity-25 transition-all duration-500 rounded-xl"
                style={{
                  width: `${pct}%`,
                  backgroundColor: hasVoted ? (accentColor || '#6366f1') : '#6366f1'
                }}
              />

              <div className="relative z-10 flex items-center gap-2 min-w-0">
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] shrink-0 transition-colors ${
                    hasVoted ? 'bg-indigo-500 text-white border-indigo-400' : 'border-slate-600 group-hover:border-slate-400 bg-slate-950'
                  }`}
                >
                  {hasVoted && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
                <span className={`text-xs font-bold truncate ${hasVoted ? 'text-white font-black' : 'text-slate-300'}`}>
                  {opt.text}
                </span>
              </div>

              <div className="relative z-10 flex items-center gap-2 text-xs font-mono font-bold shrink-0">
                <span className="text-slate-400">{voteCount}</span>
                <span className="text-indigo-300 text-[11px] w-9 text-right font-black">{pct}%</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ChatRoomScreen(props: ChatRoomScreenProps) {
  const {
    currentRoom, currentUser, roomRoomKey, messages, setMessages, roomUsers, typingUsersMap, peerTyping, preferences,
    token, wsRef, notify,
    inputText, setInputText, attachments, setAttachments, replyToMsg, setReplyToMsg, fileInputRef, messagesEndRef,
    handleSendMessage, handleSendZumbido, handleReaction, handleFileUpload, handleAnalyzeMultimodal, handleAnalyzeAudio, handleTyping,
    mediaAnalysisMap, analyzingMediaData, audioAnalysisMap, analyzingAudioData,
    setView, setIsRoomModeModalOpen, setLightboxImage,
    isAiAssistantOpen, setIsAiAssistantOpen, aiDrawerPrompt, setAiDrawerPrompt, handleAskAiAssistant, isAiDrawerLoading, aiDrawerResponse
  } = props;

  const [showMembersPanel, setShowMembersPanel] = useState(true);
  const [showEmojiPickerFor, setShowEmojiPickerFor] = useState<string | null>(null);
  const [showInputEmojiPicker, setShowInputEmojiPicker] = useState(false);
  const [showSlashCommands, setShowSlashCommands] = useState(false);
  const [activeFormattingBar, setActiveFormattingBar] = useState(false);
  
  // Search & Filter state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'pinned' | 'media' | 'audio'>('all');
  const [searchMatchIndex, setSearchMatchIndex] = useState(0);

  // Poll Creator Modal State
  const [isPollModalOpen, setIsPollModalOpen] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

  // Self Destruct Timer Selection (seconds)
  const [ephemeralTimer, setEphemeralTimer] = useState<number | undefined>(undefined);
  const [showTimerMenu, setShowTimerMenu] = useState(false);

  // In-Chat Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  // Drag and drop overlay state
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Scroll to bottom helper
  const chatScrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);
  const [unreadBelowCount, setUnreadBelowCount] = useState(0);

  // User Profile Quick Modal
  const [selectedUserProfile, setSelectedUserProfile] = useState<any | null>(null);

  // AI Assistant Drawer Advanced State
  const [aiDrawerTab, setAiDrawerTab] = useState<'assistant' | 'actions' | 'security'>('assistant');
  const [aiCopied, setAiCopied] = useState(false);

  // Smooth scroll to bottom when new messages arrive
  useEffect(() => {
    if (preferences.autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, peerTyping, preferences.autoScroll]);

  // Handle scroll detection for Jump to Bottom button
  const handleScroll = () => {
    if (!chatScrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatScrollContainerRef.current;
    const isScrolledUp = scrollHeight - scrollTop - clientHeight > 200;
    setShowScrollBottomBtn(isScrolledUp);
    if (!isScrolledUp) setUnreadBelowCount(0);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setUnreadBelowCount(0);
  };

  // Remove attachment by index
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Pinned Messages calculation
  const pinnedMessages = useMemo(() => {
    return messages.filter(m => m.isPinned);
  }, [messages]);

  // Search Results filtering
  const filteredMessages = useMemo(() => {
    return messages.filter(m => {
      // Filter tab check
      if (filterType === 'pinned' && !m.isPinned) return false;
      if (filterType === 'media' && (!m.attachments || !m.attachments.some(a => a.type?.startsWith('image/')))) return false;
      if (filterType === 'audio' && (!m.attachments || !m.attachments.some(a => a.type?.startsWith('audio/')))) return false;

      // Text search check
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const textMatch = (m.text || m.encryptedText || '').toLowerCase().includes(q);
        const senderMatch = (m.senderName || '').toLowerCase().includes(q);
        return textMatch || senderMatch;
      }
      return true;
    });
  }, [messages, filterType, searchQuery]);

  // Format Helper Injection
  const injectFormatting = (prefix: string, suffix: string = '') => {
    setInputText(prev => {
      return prev + prefix + 'texto' + suffix;
    });
  };

  // Slash Command Selection Handler
  const handleSelectSlashCommand = (cmd: string) => {
    if (cmd === '/bot') {
      setInputText('/bot ');
    } else if (cmd === '/poll') {
      setIsPollModalOpen(true);
      setInputText('');
    } else if (cmd === '/zumbido') {
      handleSendZumbido();
      setInputText('');
    } else if (cmd === '/shrug') {
      setInputText(prev => prev + ' ¯\\_(ツ)_/¯');
    } else if (cmd === '/tableflip') {
      setInputText(prev => prev + ' (╯°□°)╯︵ ┻━┻');
    } else if (cmd === '/clear') {
      setMessages([]);
      setInputText('');
      notify?.('Chat local limpiado', 'info');
    } else if (cmd === '/help') {
      notify?.('Comandos disponibles: /bot, /poll, /zumbido, /shrug, /tableflip, /clear', 'info');
      setInputText('');
    }
    setShowSlashCommands(false);
  };

  // Create & Send Poll
  const handleCreatePollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pollQuestion.trim() || !roomRoomKey || !currentUser) return;
    const validOpts = pollOptions.filter(o => o.trim().length > 0);
    if (validOpts.length < 2) {
      notify?.('Debes agregar al menos 2 opciones para la encuesta', 'alert');
      return;
    }

    const pollData = {
      question: pollQuestion.trim(),
      options: validOpts.map((opt, idx) => ({
        id: `opt-${idx + 1}-${Date.now()}`,
        text: opt.trim(),
        votes: []
      })),
      totalVotes: 0
    };

    const pollText = `📊 **Encuesta:** ${pollQuestion.trim()}`;
    const encryptedText = await CryptoEngine.encryptMessage(roomRoomKey, pollText);

    if (wsRef?.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'SEND_MESSAGE',
        roomId: currentRoom.id,
        encryptedText,
        plainTextForAI: pollText,
        poll: pollData,
        format: 'poll'
      }));
    }

    setIsPollModalOpen(false);
    setPollQuestion('');
    setPollOptions(['', '']);
    notify?.('Encuesta publicada en la sala', 'success');
  };

  // Vote in Poll Handler
  const handleVotePoll = (messageId: string, optionId: string) => {
    // Optimistic local state update
    setMessages((prev) => prev.map((m) => {
      if (m.id !== messageId || !m.poll || !Array.isArray(m.poll.options)) return m;
      const newOptions = m.poll.options.map((opt: any) => {
        // remove current user if already voted
        const filtered = (opt.votes || []).filter((uid: string) => uid !== currentUser.id);
        if (opt.id === optionId) {
          filtered.push(currentUser.id);
        }
        return { ...opt, votes: filtered };
      });
      const total = newOptions.reduce((acc: number, o: any) => acc + (o.votes?.length || 0), 0);
      return {
        ...m,
        poll: {
          ...m.poll,
          options: newOptions,
          totalVotes: total
        }
      };
    }));

    if (wsRef?.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'POLL_VOTE',
        roomId: currentRoom.id,
        messageId,
        optionId
      }));
    }
  };

  // Pin / Unpin Message Handler
  const handleTogglePin = (messageId: string) => {
    if (wsRef?.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'PIN_MESSAGE',
        roomId: currentRoom.id,
        messageId
      }));
    }
  };

  // Delete Message Handler
  const handleDeleteMessage = (messageId: string) => {
    if (!confirm('¿Deseas eliminar este mensaje para todos en la sala?')) return;
    if (wsRef?.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'DELETE_MESSAGE',
        roomId: currentRoom.id,
        messageId
      }));
    }
  };

  // Start In-Chat Voice Note Recording
  const startRecordingAudioNote = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch (err) {
      notify?.('No se pudo acceder al micrófono para grabar la nota de voz', 'alert');
    }
  };

  // Stop In-Chat Voice Note Recording
  const stopRecordingAudioNote = (save: boolean) => {
    if (!mediaRecorderRef.current) return;
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);

    const recorder = mediaRecorderRef.current;
    recorder.onstop = () => {
      if (save && audioChunksRef.current.length > 0) {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Data = reader.result as string;
          setAttachments(prev => [
            ...prev,
            {
              name: `Nota_Voz_${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).replace(/:/g, '-')}.webm`,
              type: 'audio/webm',
              data: base64Data
            }
          ]);
          notify?.('Nota de voz adjuntada', 'success');
        };
        reader.readAsDataURL(audioBlob);
      }

      if (recorder.stream) {
        recorder.stream.getTracks().forEach(t => t.stop());
      }
      setIsRecording(false);
      setRecordingSeconds(0);
    };

    recorder.stop();
  };

  // Drag and Drop File Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachments(prev => [
          ...prev,
          { name: file.name, type: file.type, data: reader.result as string }
        ]);
      };
      reader.readAsDataURL(file);
    });
    notify?.(`${files.length} archivo(s) soltado(s) y adjuntado(s)`, 'info');
  };

  // Clipboard Paste Image / File Handler
  const handleClipboardPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            setAttachments(prev => [
              ...prev,
              { name: file.name || `Pegado_${Date.now()}.png`, type: file.type, data: reader.result as string }
            ]);
            notify?.('Imagen capturada del portapapeles y adjuntada', 'info');
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  // Formatted Date Separator Helper
  const getMessageDateLabel = (timestamp: number) => {
    const d = new Date(timestamp);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Hoy';
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Ayer';
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="flex-1 w-full h-full flex overflow-hidden bg-[#030712] relative select-none sm:select-auto"
    >
      {/* DRAG & DROP GLOWING OVERLAY */}
      <AnimatePresence>
        {isDraggingOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-indigo-950/80 backdrop-blur-md border-4 border-dashed border-indigo-400 rounded-2xl flex flex-col items-center justify-center pointer-events-none p-6 text-center"
          >
            <div className="p-5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/40 mb-4 animate-bounce">
              <Paperclip className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-white">Suelta tus archivos aquí</h3>
            <p className="text-sm text-indigo-200 mt-1 font-medium">Imágenes, documentos, videos o audios se cifrarán y enviarán</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. LEFT SIDEBAR: Room Info & Online Operators */}
      <AnimatePresence>
        {showMembersPanel && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 290, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="hidden md:flex flex-col border-r border-slate-800 bg-slate-950/70 backdrop-blur-md z-10 shrink-0"
          >
            {/* Room Header & Back to Lobby */}
            <div className="p-4 border-b border-slate-800 shrink-0 space-y-3">
              <button
                type="button"
                onClick={() => setView('rooms')}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5 transition-all w-fit active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" /> Volver al Lobby
              </button>

              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg shrink-0"
                  style={{ backgroundColor: `${preferences.accent}25`, border: `1px solid ${preferences.accent}50` }}
                >
                  <ShieldCheck className="w-6 h-6" style={{ color: preferences.accent }} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-black text-white text-base truncate tracking-tight">{currentRoom.name}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      #{currentRoom.code}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(currentRoom.code);
                        notify?.(`Código #${currentRoom.code} copiado`, 'info');
                      }}
                      className="text-slate-500 hover:text-slate-300 p-0.5"
                      title="Copiar código"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Room Access Mode Badge Button */}
              <button
                type="button"
                onClick={() => {
                  if (currentUser && (currentRoom.createdById === currentUser.id || currentUser.role === 'admin')) {
                    setIsRoomModeModalOpen(true);
                  }
                }}
                className={`w-full py-1.5 px-2.5 rounded-lg text-[10px] font-extrabold border transition-all flex items-center justify-between ${
                  (!currentRoom.accessMode || currentRoom.accessMode === 'global')
                    ? 'bg-sky-500/10 text-sky-400 border-sky-500/20 hover:bg-sky-500/20'
                    : currentRoom.accessMode === 'open'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {(!currentRoom.accessMode || currentRoom.accessMode === 'global') && <><Globe className="w-3.5 h-3.5" /> Sala Pública Global</>}
                  {currentRoom.accessMode === 'open' && <><Key className="w-3.5 h-3.5" /> Acceso por Código</>}
                  {(currentRoom.accessMode === 'closed' || currentRoom.isClosed) && <><Lock className="w-3.5 h-3.5" /> Sala Cerrada / Privada</>}
                </span>
                {currentUser && (currentRoom.createdById === currentUser.id || currentUser.role === 'admin') && (
                  <span className="text-[9px] underline opacity-70">Cambiar</span>
                )}
              </button>
            </div>

            {/* Members List */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-400" /> Operadores ({roomUsers.length})
                </h4>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              <div className="space-y-1">
                {roomUsers.length === 0 && (
                  <div className="text-[11px] text-slate-500 italic px-2 py-4 text-center">Conectando a la red...</div>
                )}
                {roomUsers.map((u, uIdx) => {
                  const isUserTyping = typingUsersMap[u.id] || (peerTyping && peerTyping === u.name);
                  const isCreator = currentRoom.createdById === u.id;
                  const isAdmin = u.role === 'admin';
                  const isCyberEliteUser = u.planTier === 'cyber_elite' || (u.email && u.email.toLowerCase() === 'ydark126@gmail.com');
                  const isVIP = u.isPremium || isCyberEliteUser;
                  const isMe = u.id === currentUser?.id;

                  return (
                    <div
                      key={u.id ? `${u.id}-${uIdx}` : `roomuser-${uIdx}`}
                      onClick={() => setSelectedUserProfile(u)}
                      className={`group flex items-center gap-2.5 p-2 rounded-xl transition-all cursor-pointer border ${
                        isUserTyping
                          ? 'bg-slate-800/80 border-slate-700'
                          : 'border-transparent hover:bg-slate-900/80 hover:border-slate-800'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs border overflow-hidden"
                          style={{
                            backgroundColor: isMe ? `${preferences.accent}30` : '#1e293b',
                            borderColor: isMe ? `${preferences.accent}60` : '#334155'
                          }}
                        >
                          {u.avatar ? (
                            <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                          ) : (
                            u.name?.substring(0, 2).toUpperCase() || 'OP'
                          )}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-950 rounded-full" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-slate-200 truncate">{u.name}</span>
                          {isCreator && (
                            <span title="Creador de la Sala">
                              <Crown className="w-3 h-3 text-amber-400 shrink-0" />
                            </span>
                          )}
                          {isAdmin && (
                            <span title="Admin">
                              <ShieldCheck className="w-3 h-3 text-indigo-400 shrink-0" />
                            </span>
                          )}
                          {isCyberEliteUser ? (
                            <span className="text-[9px] bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-cyan-500/20 text-cyan-300 font-black px-1.5 py-0.5 rounded border border-cyan-400/40 flex items-center gap-0.5 shadow-[0_0_8px_rgba(6,182,212,0.3)] shrink-0" title="Insignia Cyber ULTRA ELITE">
                              <Zap className="w-2.5 h-2.5 text-cyan-300 animate-pulse" /> ULTRA
                            </span>
                          ) : isVIP ? (
                            <span className="text-[9px] bg-amber-500/20 text-amber-300 font-bold px-1 rounded flex items-center gap-0.5 shrink-0" title="Insignia VIP Premium">
                              <Crown className="w-2.5 h-2.5 text-amber-400" /> VIP
                            </span>
                          ) : null}
                        </div>
                        <div className="text-[10px] h-3.5">
                          {isUserTyping ? (
                            <span className="text-indigo-400 font-bold flex items-center gap-1 animate-pulse">
                              <Activity className="w-2.5 h-2.5" /> escribiendo...
                            </span>
                          ) : (
                            <span className="text-slate-500 truncate block">{u.email}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#08090e] relative z-20 overflow-hidden">
        
        {/* Dynamic ambient background glow */}
        <div
          className="absolute inset-0 pointer-events-none opacity-5 mix-blend-screen"
          style={{ background: `radial-gradient(circle at 50% 0%, ${preferences.accent}, transparent 70%)` }}
        />

        {/* CHAT TOPBAR */}
        <div className="h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl flex items-center justify-between px-3 sm:px-5 shrink-0 relative z-30">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setShowMembersPanel(!showMembersPanel)}
              className="hidden md:flex p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title={showMembersPanel ? "Ocultar panel" : "Ver miembros"}
            >
              {showMembersPanel ? <ChevronLeft className="w-5 h-5" /> : <Users className="w-5 h-5" />}
            </button>
            <div className="md:hidden">
              <button
                type="button"
                onClick={() => setView('rooms')}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-black text-white flex items-center gap-2 truncate">
                <span>{currentRoom.name}</span>
                {pinnedMessages.length > 0 && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                    <Pin className="w-2.5 h-2.5" /> {pinnedMessages.length}
                  </span>
                )}
              </h2>
              <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 uppercase tracking-widest mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Canal Ultra-Seguro • En Línea
              </p>
            </div>
          </div>

          {/* Action Icons in Topbar */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Search Toggle Button */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                isSearchOpen ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
              }`}
              title="Buscar mensajes"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Create Poll Button */}
            <button
              type="button"
              onClick={() => setIsPollModalOpen(true)}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5"
              title="Crear Encuesta"
            >
              <BarChart2 className="w-4 h-4 text-indigo-400" />
              <span className="hidden lg:inline">Encuesta</span>
            </button>

            {/* Zumbido Button */}
            <button
              type="button"
              onClick={handleSendZumbido}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
              title="Enviar Zumbido"
            >
              <BellRing className="w-4 h-4" /> <span className="hidden sm:inline">Zumbido</span>
            </button>

            {/* Quantum AI Drawer Toggle */}
            <button
              type="button"
              onClick={() => setIsAiAssistantOpen(!isAiAssistantOpen)}
              className="px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg active:scale-95"
              style={{
                backgroundColor: isAiAssistantOpen ? `${preferences.accent}30` : `${preferences.accent}15`,
                color: preferences.accent,
                borderColor: `${preferences.accent}50`,
                borderWidth: '1px'
              }}
            >
              <Bot className="w-4 h-4 animate-pulse" /> <span className="hidden sm:inline">Aether IA</span>
            </button>
          </div>
        </div>

        {/* INLINE SEARCH & FILTER BAR */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-md px-4 py-2.5 space-y-2 z-20"
            >
              <div className="flex items-center gap-2">
                <div className="flex-1 relative flex items-center bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 focus-within:border-indigo-500">
                  <Search className="w-4 h-4 text-slate-500 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por palabra o usuario en la sala..."
                    className="w-full bg-transparent text-xs text-white placeholder-slate-500 outline-none"
                    autoFocus
                  />
                  {searchQuery && (
                    <button type="button" onClick={() => setSearchQuery('')} className="text-slate-500 hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-xs"
                >
                  Cerrar
                </button>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 text-[11px] font-bold overflow-x-auto pb-0.5">
                {[
                  { id: 'all', label: 'Todos' },
                  { id: 'pinned', label: '📌 Fijados' },
                  { id: 'media', label: '🖼️ Imágenes' },
                  { id: 'audio', label: '🎙️ Audios' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilterType(tab.id as any)}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      filterType === tab.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
                {searchQuery && (
                  <span className="text-[10px] text-slate-500 font-mono ml-auto">
                    {filteredMessages.length} encontrados
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PINNED MESSAGES BANNER */}
        {pinnedMessages.length > 0 && !isSearchOpen && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between gap-3 text-xs text-amber-200 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <Pin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <div className="min-w-0 flex items-center gap-2">
                <span className="font-bold uppercase text-[10px] tracking-wider text-amber-400 shrink-0">Fijado:</span>
                <p className="truncate text-amber-100/90 font-medium">
                  {pinnedMessages[0].text || pinnedMessages[0].encryptedText}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleTogglePin(pinnedMessages[0].id)}
              className="text-[10px] font-bold text-amber-400/80 hover:text-amber-300 shrink-0 underline"
            >
              Desfijar
            </button>
          </div>
        )}

        {/* 3. MESSAGES SCROLL LIST */}
        <div
          ref={chatScrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent relative z-10"
        >
          {filteredMessages.map((m, idx) => {
            // System Notification
            if (m.senderId === 'system') {
              return (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} key={m.id ? `${m.id}-${idx}` : `sys-${idx}`} className="flex justify-center w-full my-3">
                  <div className="px-4 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-[10px] sm:text-xs text-slate-400 font-mono flex items-center gap-2 shadow-md">
                    <Info className="w-3.5 h-3.5 text-indigo-400" />
                    {(m as any).text || (m as any).plainTextForAI || m.encryptedText}
                  </div>
                </motion.div>
              );
            }

            // Moderation Warnings
            const isBotWarning = m.id.startsWith('msg-bot-warn-') || m.senderName.includes('Moderación');
            if (isBotWarning) {
              return (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={m.id ? `${m.id}-${idx}` : `warn-${idx}`} className="flex justify-center w-full my-2">
                  <div className="max-w-lg w-full p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-3 shadow-2xl backdrop-blur-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                    <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="flex-1 pr-6">
                      <p className="font-bold text-[11px] mb-0.5 text-amber-400 uppercase tracking-widest">Alerta de Seguridad</p>
                      <p className="text-xs leading-relaxed text-amber-200/90 font-medium">
                        {(m as any).text !== undefined ? (m as any).text : m.encryptedText}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMessages(prev => prev.filter(item => item.id !== m.id))}
                      className="absolute top-3 right-3 p-1 hover:bg-amber-500/20 rounded-lg text-amber-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            }

            const isMe = m.senderId === currentUser?.id;
            const isBot = m.senderId === 'bot-ai-assistant';
            const prevMsg = idx > 0 ? filteredMessages[idx - 1] : null;
            const isSameSenderAsPrev = prevMsg && prevMsg.senderId === m.senderId && Math.abs(m.timestamp - prevMsg.timestamp) < 180000;
            const showDateSeparator = !prevMsg || getMessageDateLabel(m.timestamp) !== getMessageDateLabel(prevMsg.timestamp);

            return (
              <React.Fragment key={m.id ? `${m.id}-${idx}` : `msg-${idx}`}>
                {/* Date Separator */}
                {showDateSeparator && (
                  <div className="flex justify-center w-full my-4">
                    <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-widest shadow-sm">
                      {getMessageDateLabel(m.timestamp)}
                    </span>
                  </div>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`group/msg flex flex-col ${isMe ? 'items-end' : 'items-start'} ${isSameSenderAsPrev ? 'mt-1' : 'mt-3'} w-full relative`}
                >
                  {/* Sender Info Row (only shown if not grouped) */}
                  {!isSameSenderAsPrev && (
                    <div className={`flex items-center gap-2 px-1 mb-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        {isMe ? 'Tú' : m.senderName}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-slate-700" />
                      <span className="text-[9px] font-mono text-slate-500">
                        {m.time}
                      </span>
                      {m.isPinned && (
                        <span className="text-[9px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.2 rounded flex items-center gap-0.5">
                          <Pin className="w-2.5 h-2.5" /> Fijado
                        </span>
                      )}
                    </div>
                  )}

                  {/* Bubble Container */}
                  <div className={`flex items-end gap-2 max-w-[92%] sm:max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    
                    {/* Avatar */}
                    {!isMe && (
                      <div
                        onClick={() => setSelectedUserProfile({ id: m.senderId, name: m.senderName, email: m.senderEmail })}
                        className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-[10px] font-bold text-white shadow-md cursor-pointer hover:scale-105 transition-transform ${
                          !isSameSenderAsPrev ? 'visible' : 'invisible'
                        } ${isBot ? 'bg-purple-900 border border-purple-500' : 'bg-slate-800 border border-slate-700'}`}
                      >
                        {isBot ? <Bot className="w-4 h-4 text-purple-300" /> : m.senderName.substring(0, 2).toUpperCase()}
                      </div>
                    )}

                    <div className={`relative flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-full`}>
                      
                      {/* Reply Context Bar */}
                      {m.replyTo && (
                        <div className="mb-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[10px] text-slate-300 flex flex-col gap-0.5 relative overflow-hidden backdrop-blur-sm max-w-full border-l-2 border-l-indigo-500">
                          <span className="font-bold text-indigo-400 flex items-center gap-1">
                            <Reply className="w-3 h-3" /> {m.replyTo.senderName}
                          </span>
                          <span className="truncate opacity-80 pl-1">{m.replyTo.text}</span>
                        </div>
                      )}

                      {/* Main Message Bubble */}
                      <div
                        className={`p-3.5 sm:p-4 rounded-2xl shadow-xl border relative transition-all ${
                          isMe
                            ? 'rounded-br-sm'
                            : isBot
                            ? 'rounded-bl-sm bg-gradient-to-br from-purple-950/40 via-purple-900/20 to-slate-950 border-purple-500/30'
                            : 'rounded-bl-sm bg-slate-900/95 border-slate-800'
                        }`}
                        style={isMe ? {
                          backgroundColor: `${preferences.accent}18`,
                          borderColor: `${preferences.accent}35`
                        } : {}}
                      >
                        {/* Interactive Poll Render */}
                        {m.poll ? (
                          <InChatPollComponent
                            poll={m.poll}
                            messageId={m.id}
                            currentUserId={currentUser?.id || ''}
                            onVote={handleVotePoll}
                            accentColor={preferences.accent}
                          />
                        ) : (
                          /* Markdown Rich Text */
                          m.text && (
                            <div className="text-sm font-medium leading-relaxed text-slate-200 break-words prose prose-invert prose-sm max-w-none">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  code({ className, children, ...rest }: any) {
                                    const match = /language-(\w+)/.exec(className || '');
                                    const isInline = !match && !String(children).includes('\n');
                                    return isInline ? (
                                      <code className="px-1.5 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-indigo-300 font-mono text-xs font-semibold" {...rest}>
                                        {children}
                                      </code>
                                    ) : (
                                      <CodeBlockComponent
                                        language={match ? match[1] : undefined}
                                        value={String(children).replace(/\n$/, '')}
                                      />
                                    );
                                  }
                                }}
                              >
                                {m.text}
                              </ReactMarkdown>
                            </div>
                          )
                        )}

                        {/* Attachments Section */}
                        {m.attachments && m.attachments.length > 0 && (
                          <div className={`grid gap-2.5 mt-3 ${m.attachments.length > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                            {m.attachments.map((att, attIdx) => {
                              // Image Attachment
                              if (att.type.startsWith('image/')) {
                                return (
                                  <div key={attIdx} className="space-y-2 relative group/img rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                                    <img
                                      src={att.data}
                                      alt={att.name}
                                      onClick={() => setLightboxImage(att.data)}
                                      className="max-h-56 sm:max-h-64 object-cover w-full cursor-pointer hover:opacity-90 transition-opacity"
                                    />
                                    <div className="absolute bottom-2 right-2 flex items-center gap-1.5 opacity-0 group-hover/img:opacity-100 transition-opacity">
                                      <button
                                        type="button"
                                        onClick={() => handleAnalyzeMultimodal(att.data, att.type, att.name)}
                                        disabled={analyzingMediaData === att.data}
                                        className="px-2.5 py-1.5 rounded-lg bg-black/80 backdrop-blur-md text-xs font-bold text-white border border-white/10 hover:bg-black flex items-center gap-1.5 shadow-lg"
                                      >
                                        {analyzingMediaData === att.data ? <Activity className="w-3.5 h-3.5 animate-spin text-purple-400" /> : <Sparkles className="w-3.5 h-3.5 text-purple-400" />}
                                        <span>Scan AI</span>
                                      </button>
                                      <a
                                        href={att.data}
                                        download={att.name}
                                        className="p-1.5 rounded-lg bg-black/80 backdrop-blur-md text-white hover:bg-black border border-white/10"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                      </a>
                                    </div>
                                  </div>
                                );
                              }

                              // Audio Note Attachment
                              if (att.type.startsWith('audio/')) {
                                return (
                                  <EnhancedAudioPlayer
                                    key={attIdx}
                                    src={att.data}
                                    filename={att.name}
                                    onAnalyze={() => handleAnalyzeAudio(att.data, att.type)}
                                    isAnalyzing={analyzingAudioData === att.data}
                                    analysisResult={audioAnalysisMap[att.data]}
                                    accentColor={preferences.accent}
                                  />
                                );
                              }

                              // Generic File Attachment
                              return (
                                <a
                                  key={attIdx}
                                  href={att.data}
                                  download={att.name}
                                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-colors group/file shadow-md"
                                >
                                  <div className="p-2.5 bg-slate-900 rounded-lg group-hover/file:bg-slate-800 text-indigo-400">
                                    <Paperclip className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-slate-200 truncate">{att.name}</p>
                                    <p className="text-[9px] font-mono text-slate-500 uppercase">{att.size || 'Archivo Seguro'}</p>
                                  </div>
                                  <Download className="w-4 h-4 text-slate-400 group-hover/file:text-white mr-1" />
                                </a>
                              );
                            })}
                          </div>
                        )}

                        {/* Image AI Multimodal Analysis Box */}
                        {m.attachments?.map((att, attIdx) => {
                          const analysisObj = mediaAnalysisMap[att.data];
                          if (!analysisObj) return null;
                          const analysisText = typeof analysisObj === 'string' ? analysisObj : analysisObj.analysis;
                          return (
                            <div key={`analysis-${attIdx}`} className="mt-3 p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs text-slate-200 space-y-1.5 shadow-xl">
                              <div className="flex items-center gap-2 pb-2 border-b border-purple-500/20 font-bold text-purple-300 text-[10px] uppercase tracking-wider">
                                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                                <span>Informe de Visión Aether IA</span>
                              </div>
                              <div className="prose prose-invert prose-xs max-w-none text-slate-300 leading-relaxed">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysisText}</ReactMarkdown>
                              </div>
                            </div>
                          );
                        })}

                        {/* Ephemeral Flame Countdown */}
                        {m.selfDestruct && (
                          <SelfDestructBadge
                            selfDestructSeconds={m.selfDestruct}
                            timestamp={m.timestamp}
                            onExpire={() => {
                              setMessages(prev => prev.filter(item => item.id !== m.id));
                            }}
                          />
                        )}

                        {/* Message Bubble Footer: Time, Status, Double-Check Indicator */}
                        <div className={`flex items-center gap-1.5 mt-2 pt-1 select-none ${isMe ? 'justify-end' : 'justify-start'} text-slate-400 border-t border-slate-800/40`}>
                          <span className="text-[9px] opacity-75 font-mono">{m.time}</span>
                          {isMe && (
                            <span className="flex items-center">
                              {m.id.startsWith('opt-') || m.status === 'sending' ? (
                                <span title="Enviando...">
                                  <Clock className="w-3 h-3 text-slate-400 animate-spin" />
                                </span>
                              ) : (m.readBy && m.readBy.some(uid => uid !== currentUser.id && uid !== 'bot-ai-assistant')) ? (
                                <span className="flex items-center text-cyan-400 gap-0.5" title="Leído por participantes de la sala">
                                  <CheckCheck className="w-3.5 h-3.5 text-cyan-400 stroke-[2.5]" />
                                </span>
                              ) : (
                                <span className="flex items-center text-slate-400" title="Entregado">
                                  <Check className="w-3.5 h-3.5 text-slate-400 stroke-[2]" />
                                </span>
                              )}
                            </span>
                          )}
                        </div>

                        {/* FLOATING ACTION TOOLBAR ON HOVER */}
                        <div
                          className={`absolute top-0 ${
                            isMe ? 'left-0 -translate-x-full pr-2' : 'right-0 translate-x-full pl-2'
                          } opacity-0 group-hover/msg:opacity-100 transition-all flex items-center gap-1 z-30`}
                        >
                          {/* Quick Emoji Reaction Trigger */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setShowEmojiPickerFor(showEmojiPickerFor === m.id ? null : m.id)}
                              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-400 hover:bg-slate-800 shadow-xl"
                              title="Reaccionar"
                            >
                              <Smile className="w-3.5 h-3.5" />
                            </button>

                            {/* Categorized Emoji Reaction Picker Popover */}
                            <AnimatePresence>
                              {showEmojiPickerFor === m.id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.9 }}
                                  className={`absolute bottom-full mb-1 ${
                                    isMe ? 'right-0' : 'left-0'
                                  } bg-slate-900 border border-slate-800 p-2 rounded-2xl shadow-2xl z-50 w-56 space-y-2 backdrop-blur-xl`}
                                >
                                  <div className="text-[10px] font-bold text-slate-400 px-1">Reacciones rápidas</div>
                                  <div className="grid grid-cols-5 gap-1">
                                    {['👍', '❤️', '🔥', '😂', '🚀', '👏', '🎉', '👀', '💯', '✨'].map(emoji => (
                                      <button
                                        key={emoji}
                                        type="button"
                                        onClick={() => {
                                          handleReaction(m.id, emoji);
                                          setShowEmojiPickerFor(null);
                                        }}
                                        className="h-8 flex items-center justify-center hover:bg-slate-800 rounded-lg text-sm hover:scale-125 transition-transform"
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          {/* Reply Button */}
                          <button
                            type="button"
                            onClick={() => setReplyToMsg(m)}
                            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 shadow-xl"
                            title="Responder"
                          >
                            <Reply className="w-3.5 h-3.5" />
                          </button>

                          {/* Copy Text Button */}
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(m.text || m.encryptedText);
                              notify?.('Texto copiado al portapapeles', 'info');
                            }}
                            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 shadow-xl"
                            title="Copiar texto"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* Pin / Unpin Button */}
                          <button
                            type="button"
                            onClick={() => handleTogglePin(m.id)}
                            className={`p-1.5 rounded-lg bg-slate-900 border border-slate-800 shadow-xl ${
                              m.isPinned ? 'text-amber-400 hover:bg-slate-800' : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800'
                            }`}
                            title={m.isPinned ? "Desfijar mensaje" : "Fijar mensaje en la sala"}
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>

                          {/* Ask AI about this message */}
                          <button
                            type="button"
                            onClick={() => {
                              setIsAiAssistantOpen(true);
                              setAiDrawerPrompt(`Explica o traduce este mensaje de la sala: "${m.text || m.encryptedText}"`);
                              handleAskAiAssistant(`Explica de manera concisa y clara este mensaje: "${m.text || m.encryptedText}"`);
                            }}
                            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-purple-400 hover:text-purple-300 hover:bg-slate-800 shadow-xl"
                            title="Consultar a la IA sobre este mensaje"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Message Button (Author or Admin) */}
                          {(isMe || currentUser?.role === 'admin' || currentRoom?.createdById === currentUser?.id) && (
                            <button
                              type="button"
                              onClick={() => handleDeleteMessage(m.id)}
                              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 shadow-xl"
                              title="Eliminar mensaje"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Reactions Pill Display */}
                      {m.reactions && m.reactions.length > 0 && (
                        <div className={`flex flex-wrap gap-1 mt-1.5 ${isMe ? 'justify-end' : 'justify-start'} w-full`}>
                          {Object.entries(
                            m.reactions.reduce((acc: any, r: any) => {
                              const emojiKey = typeof r === 'string' ? r : r.emoji;
                              acc[emojiKey] = (acc[emojiKey] || 0) + 1;
                              return acc;
                            }, {} as any)
                          ).map(([emoji, count]) => (
                            <div
                              key={emoji}
                              onClick={() => handleReaction(m.id, emoji)}
                              className="px-2 py-0.5 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] flex items-center gap-1 text-slate-300 shadow-sm backdrop-blur-sm cursor-pointer hover:bg-slate-800 hover:scale-105 transition-all"
                            >
                              <span>{emoji}</span>
                              <span className="font-bold opacity-70 text-[10px]">{count as number}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </React.Fragment>
            );
          })}
          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* FLOATING JUMP TO BOTTOM BUTTON */}
        <AnimatePresence>
          {showScrollBottomBtn && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              type="button"
              onClick={scrollToBottom}
              className="absolute bottom-24 right-6 p-3 rounded-full bg-slate-900/90 border border-slate-700 text-white shadow-2xl hover:bg-slate-800 transition-all flex items-center justify-center z-30 group"
            >
              <ArrowDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
              {unreadBelowCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                  {unreadBelowCount}
                </span>
              )}
            </motion.button>
          )}
        </AnimatePresence>

        {/* 4. REPLY PREVIEW BAR */}
        <AnimatePresence>
          {replyToMsg && (
            <motion.div
              initial={{ opacity: 0, y: 10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: 10, height: 0 }}
              className="px-3.5 sm:px-6 pt-2 pb-1 bg-[#08090e] border-t border-slate-800/60"
            >
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-4 backdrop-blur-md">
                <div className="flex items-center gap-2 min-w-0">
                  <Reply className="w-4 h-4 text-indigo-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">
                      Respondiendo a {replyToMsg.senderName}
                    </p>
                    <p className="text-xs text-slate-300 truncate">{replyToMsg.text || 'Archivo adjunto'}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyToMsg(null)}
                  className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 5. ATTACHMENTS PREVIEW BAR */}
        <AnimatePresence>
          {attachments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-3.5 sm:px-6 py-2 bg-[#08090e] flex gap-2.5 overflow-x-auto scrollbar-none border-t border-slate-800/60"
            >
              {attachments.map((att, idx) => (
                <div key={idx} className="relative w-20 h-20 shrink-0 rounded-xl border border-slate-700 bg-slate-900 overflow-hidden shadow-lg group">
                  {att.type.startsWith('image/') ? (
                    <img src={att.data} alt="preview" className="w-full h-full object-cover" />
                  ) : att.type.startsWith('audio/') ? (
                    <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-indigo-950/40">
                      <Volume2 className="w-5 h-5 text-indigo-400 mb-1" />
                      <span className="text-[8px] text-slate-300 truncate w-full font-mono">Nota de Voz</span>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
                      <Paperclip className="w-5 h-5 text-slate-400 mb-1" />
                      <span className="text-[8px] text-slate-300 truncate w-full font-mono">{att.name}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeAttachment(idx)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-rose-500 transition-colors backdrop-blur-sm"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 6. SLASH COMMANDS AUTO-SUGGESTION POPOVER */}
        <AnimatePresence>
          {showSlashCommands && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-20 left-4 sm:left-6 w-80 bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl z-40 p-2 backdrop-blur-xl space-y-1"
            >
              <div className="px-2 py-1 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                Comandos de barra diagonal
              </div>
              <div className="max-h-48 overflow-y-auto space-y-0.5">
                {SLASH_COMMANDS.map(cmd => (
                  <button
                    key={cmd.command}
                    type="button"
                    onClick={() => handleSelectSlashCommand(cmd.command)}
                    className="w-full p-2 rounded-xl hover:bg-slate-800 flex items-center justify-between text-left transition-colors group"
                  >
                    <div>
                      <span className="text-xs font-mono font-bold text-indigo-400 group-hover:text-indigo-300">{cmd.command}</span>
                      <p className="text-[10px] text-slate-400">{cmd.desc}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-300" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 7. FORMATTING HELPER TOOLBAR */}
        <AnimatePresence>
          {activeFormattingBar && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 sm:px-6 py-1.5 bg-[#08090e] border-t border-slate-800 flex items-center gap-1 text-slate-400 overflow-x-auto scrollbar-none"
            >
              <button
                type="button"
                onClick={() => injectFormatting('**', '**')}
                className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white font-bold text-xs flex items-center justify-center w-7 h-7"
                title="Negrita (**texto**)"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => injectFormatting('*', '*')}
                className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white italic text-xs flex items-center justify-center w-7 h-7"
                title="Cursiva (*texto*)"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => injectFormatting('~~', '~~')}
                className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white text-xs flex items-center justify-center w-7 h-7"
                title="Tachado (~~texto~~)"
              >
                <Strikethrough className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => injectFormatting('`', '`')}
                className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white font-mono text-xs flex items-center justify-center w-7 h-7"
                title="Código en línea (`código`)"
              >
                <Code2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => injectFormatting('\n```ts\n', '\n```\n')}
                className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white font-mono text-xs flex items-center justify-center w-7 h-7"
                title="Bloque de código (```ts)"
              >
                <Terminal className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => injectFormatting('> ')}
                className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white text-xs flex items-center justify-center w-7 h-7"
                title="Cita (> texto)"
              >
                <Quote className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => injectFormatting('- ')}
                className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white text-xs flex items-center justify-center w-7 h-7"
                title="Lista con viñetas (- elemento)"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <div className="w-[1px] h-4 bg-slate-800 mx-1" />
              <button
                type="button"
                onClick={() => setIsPollModalOpen(true)}
                className="px-2 py-1 rounded-lg hover:bg-slate-800 hover:text-indigo-300 text-xs font-bold flex items-center gap-1"
              >
                <BarChart2 className="w-3.5 h-3.5" /> Encuesta
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 8. INPUT BAR AREA */}
        <div className="p-3 sm:p-5 pt-1 bg-[#08090e] relative z-20 shrink-0">
          {/* Active Voice Recording Live Bar */}
          {isRecording ? (
            <div className="flex items-center justify-between gap-3 bg-rose-950/40 border border-rose-500/40 rounded-2xl p-3 shadow-2xl backdrop-blur-md animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                <span className="text-xs font-mono font-bold text-rose-300">
                  Grabando nota de voz ({Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => stopRecordingAudioNote(false)}
                  className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-xs font-bold flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4 text-rose-400" /> Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => stopRecordingAudioNote(true)}
                  className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition-colors text-xs font-bold flex items-center gap-1.5 shadow-lg"
                >
                  <Check className="w-4 h-4" /> Adjuntar
                </button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(e, ephemeralTimer);
              }}
              className="relative flex items-end gap-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl p-2 shadow-2xl focus-within:border-slate-600 transition-colors"
            >
              {/* File Input */}
              <input
                type="file"
                multiple
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Formatting Aa Toggle */}
              <button
                type="button"
                onClick={() => setActiveFormattingBar(!activeFormattingBar)}
                className={`p-2.5 rounded-xl transition-colors shrink-0 ${
                  activeFormattingBar ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Barra de Formato Markdown"
              >
                <span className="text-xs font-black">Aa</span>
              </button>

              {/* Attach File Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
                title="Adjuntar Archivo"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              {/* Ephemeral Flame Timer Menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowTimerMenu(!showTimerMenu)}
                  className={`p-2.5 rounded-xl transition-colors shrink-0 ${
                    ephemeralTimer ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Mensajes Temporales"
                >
                  <Flame className="w-5 h-5" />
                </button>

                <AnimatePresence>
                  {showTimerMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="absolute bottom-full mb-2 left-0 bg-slate-900 border border-slate-800 p-2 rounded-2xl shadow-2xl z-50 w-48 space-y-1 backdrop-blur-xl"
                    >
                      <div className="text-[10px] font-bold text-slate-400 px-2 py-1">Autodestrucción</div>
                      {[
                        { label: 'Desactivado', val: undefined },
                        { label: '10 segundos', val: 10 },
                        { label: '30 segundos', val: 30 },
                        { label: '1 minuto', val: 60 },
                        { label: '5 minutos', val: 300 }
                      ].map(item => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => {
                            setEphemeralTimer(item.val);
                            setShowTimerMenu(false);
                            notify?.(item.val ? `Temporizador: ${item.label}` : 'Mensajes permanentes activados', 'info');
                          }}
                          className={`w-full p-2 rounded-xl text-xs font-bold text-left transition-colors flex items-center justify-between ${
                            ephemeralTimer === item.val ? 'bg-rose-600 text-white' : 'hover:bg-slate-800 text-slate-300'
                          }`}
                        >
                          <span>{item.label}</span>
                          {ephemeralTimer === item.val && <Check className="w-3.5 h-3.5" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Main Textarea */}
              <textarea
                rows={1}
                value={inputText}
                onPaste={handleClipboardPaste}
                onChange={(e) => {
                  const val = e.target.value;
                  setInputText(val);
                  handleTyping(e as any);
                  setShowSlashCommands(val.startsWith('/') && !val.includes(' '));
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e as any, ephemeralTimer);
                  }
                }}
                placeholder="Escribe un mensaje encriptado... (o usa / para comandos)"
                className="flex-1 max-h-[120px] bg-transparent text-white placeholder-slate-500 px-2 py-2.5 resize-none outline-none text-sm font-medium scrollbar-thin scrollbar-thumb-slate-700 leading-relaxed"
              />

              {/* Voice Note Button */}
              <button
                type="button"
                onClick={startRecordingAudioNote}
                className="p-2.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors shrink-0"
                title="Grabar Nota de Voz"
              >
                <Mic className="w-5 h-5" />
              </button>

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputText.trim() && attachments.length === 0}
                className="p-2.5 rounded-xl text-white font-bold transition-all shrink-0 flex items-center justify-center shadow-lg disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 group cursor-pointer"
                style={{ backgroundColor: preferences.accent }}
              >
                <Send className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </form>
          )}

          <div className="mt-2 text-center flex items-center justify-center gap-2">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
              Red Segura Privada • Conexión Cuántica Blindada
            </span>
          </div>
        </div>
      </div>

      {/* 3. RIGHT SIDEBAR: ULTRA-CYBER AI ASSISTANT PANEL */}
      <AnimatePresence>
        {isAiAssistantOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 360, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="hidden lg:flex flex-col border-l border-slate-800 bg-slate-950/95 backdrop-blur-2xl z-30 shadow-2xl shrink-0"
          >
            {/* AI Cockpit Header */}
            <div className="p-4 border-b border-slate-800 shrink-0 bg-gradient-to-r from-purple-950/40 via-indigo-950/20 to-slate-950">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                    <Bot className="w-5 h-5 animate-pulse text-purple-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-black text-white tracking-wide">Aether Core AI</h3>
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    </div>
                    <p className="text-[9px] text-purple-400 font-mono font-bold tracking-wider uppercase">Gemini 2.5 Flash • Contextual</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAiAssistantOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-900/80 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setAiDrawerTab('assistant')}
                  className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${
                    aiDrawerTab === 'assistant'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Cpu className="w-3 h-3" /> Chat
                </button>
                <button
                  type="button"
                  onClick={() => setAiDrawerTab('actions')}
                  className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${
                    aiDrawerTab === 'actions'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Zap className="w-3 h-3" /> Acciones
                </button>
                <button
                  type="button"
                  onClick={() => setAiDrawerTab('security')}
                  className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${
                    aiDrawerTab === 'security'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-3 h-3" /> Auditoría
                </button>
              </div>
            </div>

            {/* AI Workspace Body */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
              {/* Tab 1: Quick Actions Preset Buttons */}
              {aiDrawerTab === 'actions' && (
                <div className="space-y-2 animate-in fade-in duration-200">
                  <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider px-1">Acciones con 1 Clic</div>
                  <button
                    type="button"
                    onClick={() => handleAskAiAssistant('Resume en 3 puntos clave la conversación actual de la sala, destacando decisiones y acuerdos tomados.')}
                    className="w-full p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-purple-500/50 hover:bg-purple-950/20 text-left transition-all group flex items-start gap-2.5"
                  >
                    <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 group-hover:scale-110 transition-transform shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">Resumen Ejecutivo</h4>
                      <p className="text-[10px] text-slate-400">Puntos clave, acuerdos y tareas de la sala</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAskAiAssistant('Sugiere 3 respuestas rápidas, contextuales y profesionales para participar inmediatamente en esta conversación.')}
                    className="w-full p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-950/20 text-left transition-all group flex items-start gap-2.5"
                  >
                    <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 group-hover:scale-110 transition-transform shrink-0">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">Respuestas Sugeridas</h4>
                      <p className="text-[10px] text-slate-400">3 opciones inteligentes listas para enviar</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAskAiAssistant('Extrae una lista de tareas pendientes (action items) con responsables y prioridades a partir de los mensajes de esta sala.')}
                    className="w-full p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 hover:bg-cyan-950/20 text-left transition-all group flex items-start gap-2.5"
                  >
                    <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 group-hover:scale-110 transition-transform shrink-0">
                      <CheckSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">Extracción de Tareas</h4>
                      <p className="text-[10px] text-slate-400">Checklist de compromisos y tareas</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAskAiAssistant('Traduce los últimos mensajes de la sala al inglés técnico profesional manteniendo el tono del chat.')}
                    className="w-full p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-950/20 text-left transition-all group flex items-start gap-2.5"
                  >
                    <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform shrink-0">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">Traducción Instantánea</h4>
                      <p className="text-[10px] text-slate-400">Traduce el hilo actual al inglés</p>
                    </div>
                  </button>
                </div>
              )}

              {/* Tab 2: Security & Privacy Audit */}
              {aiDrawerTab === 'security' && (
                <div className="space-y-2 animate-in fade-in duration-200">
                  <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider px-1">Auditoría Criptográfica</div>
                  <button
                    type="button"
                    onClick={() => handleAskAiAssistant('Realiza una auditoría de seguridad sobre los mensajes de esta sala: ¿Hay contraseñas expuestas, tokens API, números de tarjeta o datos sensibles compartidos por error? Proporciona recomendaciones.')}
                    className="w-full p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-rose-500/50 hover:bg-rose-950/20 text-left transition-all group flex items-start gap-2.5"
                  >
                    <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 group-hover:scale-110 transition-transform shrink-0">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-rose-300 transition-colors">Escanear Fugas de Datos</h4>
                      <p className="text-[10px] text-slate-400">Verifica si hay tokens, claves o PII expuestos</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAskAiAssistant('Evalúa el nivel de cumplimiento de privacidad y recomendaciones de higiene cibernética para los participantes de esta sala según los temas discutidos.')}
                    className="w-full p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 hover:bg-amber-950/20 text-left transition-all group flex items-start gap-2.5"
                  >
                    <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform shrink-0">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">Higiene de Seguridad</h4>
                      <p className="text-[10px] text-slate-400">Recomendaciones y mejores prácticas</p>
                    </div>
                  </button>
                </div>
              )}

              {/* Response Display Box */}
              <div className="flex-1 flex flex-col min-h-[280px] p-3.5 rounded-2xl bg-black/60 border border-slate-800/90 shadow-2xl relative">
                <div className="flex items-center justify-between text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2.5 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-purple-400" />
                    <span>Salida del Terminal IA</span>
                  </div>
                  {aiDrawerResponse && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(aiDrawerResponse);
                          setAiCopied(true);
                          setTimeout(() => setAiCopied(false), 2000);
                        }}
                        className="px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 text-[9px] font-bold flex items-center gap-1 border border-slate-700"
                        title="Copiar texto"
                      >
                        {aiCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {aiCopied ? 'Copiado' : 'Copiar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setInputText(prev => prev ? `${prev}\n\n${aiDrawerResponse}` : aiDrawerResponse);
                          notify?.('Respuesta insertada en el mensaje', 'info');
                        }}
                        className="px-2 py-0.5 rounded-md bg-purple-900/40 hover:bg-purple-900/70 text-purple-300 text-[9px] font-bold flex items-center gap-1 border border-purple-700/50"
                        title="Insertar en el chat"
                      >
                        <Send className="w-3 h-3" />
                        Chat
                      </button>
                    </div>
                  )}
                </div>

                {isAiDrawerLoading ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-3 text-purple-400 opacity-90 py-10">
                    <div className="w-9 h-9 relative">
                      <div className="absolute inset-0 border-2 border-purple-500/20 rounded-full" />
                      <div className="absolute inset-0 border-2 border-purple-500 rounded-full border-t-transparent animate-spin" />
                      <div className="absolute inset-2 border-2 border-indigo-400 rounded-full border-b-transparent animate-spin" style={{ animationDirection: 'reverse' }} />
                    </div>
                    <span className="text-[10px] font-mono tracking-widest uppercase animate-pulse font-bold">Procesando contexto cuántico...</span>
                  </div>
                ) : aiDrawerResponse ? (
                  <div className="text-xs text-slate-200 font-medium leading-relaxed prose prose-invert prose-xs max-w-none overflow-y-auto pr-1">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiDrawerResponse}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 opacity-60 px-4 py-8">
                    <div className="p-3 rounded-2xl bg-purple-950/30 border border-purple-500/20 text-purple-400">
                      <Bot className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-200">Asistente Cuántico Activo</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">La IA analiza el historial completo de esta sala en tiempo real. Escribe una consulta o usa las acciones rápidas.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* AI Bottom Input Bar */}
            <div className="p-3.5 border-t border-slate-800 bg-slate-950 shrink-0 space-y-2">
              <div className="relative flex items-center bg-black/60 border border-slate-700/80 rounded-xl p-1 focus-within:border-purple-500/70 transition-all shadow-inner">
                <input
                  type="text"
                  placeholder="Pregunta a la IA sobre esta sala..."
                  value={aiDrawerPrompt}
                  onChange={(e) => setAiDrawerPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAskAiAssistant();
                  }}
                  className="flex-1 bg-transparent px-2.5 py-1 text-xs text-white placeholder-slate-500 outline-none font-medium"
                />
                <button
                  type="button"
                  onClick={() => handleAskAiAssistant()}
                  disabled={isAiDrawerLoading || !aiDrawerPrompt.trim()}
                  className="w-8 h-8 rounded-lg bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono px-1">
                <span>Enter para enviar</span>
                <span>Contexto: {messages.length} mensajes</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CREATE POLL MODAL */}
      <AnimatePresence>
        {isPollModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-4 shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                    <BarChart2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Nueva Encuesta</h3>
                    <p className="text-xs text-slate-400">Votación interactiva para {currentRoom.name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPollModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreatePollSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Pregunta
                  </label>
                  <input
                    type="text"
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    placeholder="¿Cuál es la mejor decisión para el proyecto?"
                    className="w-full bg-slate-950 border border-slate-800 px-3.5 py-2.5 rounded-xl text-xs text-white outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Opciones de Respuesta
                  </label>
                  {pollOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPollOptions(prev => prev.map((o, i) => (i === idx ? val : o)));
                        }}
                        placeholder={`Opción ${idx + 1}...`}
                        className="flex-1 bg-slate-950 border border-slate-800 px-3.5 py-2 rounded-xl text-xs text-white outline-none focus:border-indigo-500"
                        required
                      />
                      {pollOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setPollOptions(prev => prev.filter((_, i) => i !== idx))}
                          className="p-2 text-slate-500 hover:text-rose-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {pollOptions.length < 5 && (
                    <button
                      type="button"
                      onClick={() => setPollOptions(prev => [...prev, ''])}
                      className="text-xs font-bold text-indigo-400 hover:underline pt-1"
                    >
                      + Agregar otra opción
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsPollModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg transition-all active:scale-95"
                  >
                    Publicar Encuesta
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* USER PROFILE QUICK POPOVER */}
      <AnimatePresence>
        {selectedUserProfile && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-5 space-y-4 shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => setSelectedUserProfile(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg font-black text-white shadow-xl overflow-hidden relative">
                  {selectedUserProfile.avatar ? (
                    <img src={selectedUserProfile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    selectedUserProfile.name?.substring(0, 2).toUpperCase() || 'OP'
                  )}
                  {(selectedUserProfile.planTier === 'cyber_elite' || (selectedUserProfile.email && selectedUserProfile.email.toLowerCase() === 'ydark126@gmail.com')) && (
                    <div className="absolute bottom-0 right-0 bg-gradient-to-r from-cyan-500 to-purple-600 text-white p-0.5 rounded-tl-lg shadow-lg">
                      <Zap className="w-3 h-3 text-cyan-200 animate-pulse" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-1.5">
                    {selectedUserProfile.name}
                    {(selectedUserProfile.planTier === 'cyber_elite' || (selectedUserProfile.email && selectedUserProfile.email.toLowerCase() === 'ydark126@gmail.com')) ? (
                      <span title="Cyber ULTRA ELITE"><Zap className="w-4 h-4 text-cyan-300 animate-pulse" /></span>
                    ) : selectedUserProfile.isPremium ? (
                      <span title="Aether VIP"><Crown className="w-4 h-4 text-amber-400" /></span>
                    ) : null}
                  </h3>
                  <p className="text-xs text-slate-400">{selectedUserProfile.email}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Membresía:</span>
                  {(selectedUserProfile.planTier === 'cyber_elite' || (selectedUserProfile.email && selectedUserProfile.email.toLowerCase() === 'ydark126@gmail.com')) ? (
                    <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-purple-300 to-cyan-200 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-cyan-400 animate-bounce" /> Cyber ULTRA ELITE
                    </span>
                  ) : selectedUserProfile.isPremium ? (
                    <span className="font-bold text-amber-300 flex items-center gap-1">
                      <Crown className="w-3 h-3 text-amber-400" /> Aether VIP
                    </span>
                  ) : (
                    <span className="font-bold text-slate-400">Estándar</span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Rol:</span>
                  <span className="font-bold text-indigo-400">{selectedUserProfile.role === 'admin' ? 'Administrador' : 'Operador'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Estado:</span>
                  <span className="font-bold text-emerald-400">En línea</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setInputText(prev => `@${selectedUserProfile.name} ` + prev);
                  setSelectedUserProfile(null);
                }}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-1.5"
              >
                <AtSign className="w-4 h-4" /> Mencionar en el chat
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
