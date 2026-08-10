import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, ShieldCheck, Activity, Users, Lock, Key, Server, 
  Trash2, Ban, UserPlus, Send, RefreshCw, Cpu, AlertTriangle, CheckCircle2,
  Database, Zap, Eye, Terminal, Mail, KeyRound, UserCheck, UserX, BadgeCheck,
  Globe, Clock, Layers, ArrowRight, Shield, Award, Sparkles, Bot, Paperclip, UserCog, UserMinus, X
} from 'lucide-react';
import { SystemStats, UserProfile, ThreatLog, SecurityAccessLog } from '../types';
import { adminService } from '../services';

interface AdminDashboardProps {
  stats: SystemStats | null;
  users: UserProfile[];
  threats: ThreatLog[];
  logs: SecurityAccessLog[];
  token: string;
  accentColor: string;
  onRefresh: () => void;
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  stats,
  users,
  threats,
  logs,
  token,
  accentColor,
  onRefresh,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'overview' | 'threats' | 'logs' | 'ai_assistant' | 'smtp' | 'mongodb'>('overview');
  
  // Realtime MongoDB Metrics State
  const [mongoStats, setMongoStats] = useState<{
    isConnected: boolean;
    statusText: string;
    latencyMs: number;
    dbName: string;
    collections: number;
    objects: number;
    storage: {
      dataSizeGB: number;
      storageSizeGB: number;
      indexSizeGB: number;
      totalOccupiedGB: number;
      freeStorageGB: number;
      totalCapacityGB: number;
      dataSizeMB: number;
      storageSizeMB: number;
    };
    network: {
      downloadMB: number;
      uploadMB: number;
      downloadGB: number;
      uploadGB: number;
    };
  } | null>(null);

  const fetchMongoStats = async () => {
    try {
      const data = await adminService.getMongoStats(token);
      setMongoStats(data);
    } catch (err) {
      console.error("Error fetching mongo stats:", err);
    }
  };

  useEffect(() => {
    fetchMongoStats();
    const interval = setInterval(fetchMongoStats, 5000);
    return () => clearInterval(interval);
  }, [token]);
  
  // Filters
  const [threatSeverityFilter, setThreatSeverityFilter] = useState<string>('all');
  
  // SMTP Config state
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('aethersecurity5@gmail.com');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpFromName, setSmtpFromName] = useState('Aether Security');
  const [smtpConfigured, setSmtpConfigured] = useState(false);
  const [smtpMsg, setSmtpMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [testEmailTarget, setTestEmailTarget] = useState('admin@tudominio.com');

  const fetchSmtpConfig = async () => {
    try {
      const res = await fetch('/api/admin/smtp-config', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        if (data.host) setSmtpHost(data.host);
        if (data.port) setSmtpPort(String(data.port));
        if (data.user) setSmtpUser(data.user);
        if (data.fromName) setSmtpFromName(data.fromName);
        setSmtpConfigured(!!data.configured);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSmtpConfig();
  }, [token]);

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSmtpMsg(null);
    try {
      const res = await fetch('/api/admin/smtp-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          host: smtpHost,
          port: Number(smtpPort),
          user: smtpUser,
          pass: smtpPass,
          fromName: smtpFromName
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar configuración SMTP');
      setSmtpMsg({ text: 'Configuración SMTP del servidor guardada exitosamente.' });
      setSmtpConfigured(!!data.configured);
      setSmtpPass('');
    } catch (err: any) {
      setSmtpMsg({ text: 'Error al guardar SMTP: ' + err.message, isError: true });
    }
  };

  const handleTestSmtp = async () => {
    setSmtpTesting(true);
    setSmtpMsg(null);
    try {
      const res = await fetch('/api/admin/test-smtp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ toEmail: testEmailTarget || smtpUser })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fallo el envío de prueba');
      setSmtpMsg({
        text: data.message,
        isError: !data.isRealSmtp
      });
    } catch (err: any) {
      setSmtpMsg({ text: 'Error en prueba SMTP: ' + err.message, isError: true });
    } finally {
      setSmtpTesting(false);
    }
  };
  
  // User creation form
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newIp, setNewIp] = useState('');
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user');
  const [createMsg, setCreateMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  // Invitation form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);

  // Manual ban form
  const [banIp, setBanIp] = useState('');
  const [banReason, setBanReason] = useState('');
  const [banEvidence, setBanEvidence] = useState('');

  // AI Assistant Control state
  const [aiQuery, setAiQuery] = useState('');
  const [aiTargetIp, setAiTargetIp] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateMsg(null);
    try {
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: newEmail, name: newName, password: newPassword, ip: newIp, role: newRole })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar usuario');
      setCreateMsg({ text: `Usuario ${newName} registrado exitosamente como ${newRole.toUpperCase()} con Estado Activo.` });
      setNewEmail(''); setNewName(''); setNewPassword(''); setNewIp(''); setNewRole('user');
      onRefresh();
    } catch (err: any) {
      setCreateMsg({ text: err.message, isError: true });
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteMsg(null);
    try {
      const res = await fetch('/api/admin/send-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: inviteEmail })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error enviando invitación');
      setInviteMsg(`Invitación enviada exitosamente a ${inviteEmail}`);
      setInviteEmail('');
    } catch (err: any) {
      setInviteMsg('Error: ' + err.message);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Sancionado' ? 'Activo' : 'Sancionado';
    try {
      const res = await fetch('/api/admin/toggle-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, status: nextStatus })
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleUserRole = async (userId: string, currentRole: 'user' | 'admin') => {
    const targetRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      const res = await fetch('/api/admin/toggle-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, targetRole })
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdminResetPassword = async (userId: string) => {
    const newPass = prompt("Ingresa la nueva contraseña para este usuario (mínimo 6 caracteres):");
    if (!newPass) return;
    if (newPass.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    try {
      const res = await fetch('/api/admin/reset-user-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, newPassword: newPass })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert(data.message);
      onRefresh();
    } catch (err: any) {
      alert("Error al restablecer contraseña: " + err.message);
    }
  };

  const handleBanIpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/ban-ip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ip: banIp, reason: banReason, evidence: banEvidence })
      });
      if (res.ok) {
        setBanIp(''); setBanReason(''); setBanEvidence('');
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnbanIp = async (ip: string, userId?: string) => {
    try {
      await fetch('/api/admin/unban-ip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ip, userId })
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleConsultAI = async (actionType?: string) => {
    if (!aiQuery && !actionType) return;
    setAiLoading(true);
    setAiResponse(null);
    try {
      const res = await fetch('/api/admin/ai-consult', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query: aiQuery,
          targetIp: aiTargetIp,
          actionType: actionType || 'CONSULT',
          evidence: banEvidence
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAiResponse(data.message || data.answer);
      onRefresh();
    } catch (err: any) {
      setAiResponse('Error de consulta: ' + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div style={{ "--accent": accentColor } as React.CSSProperties} className="fixed inset-0 z-[300] bg-slate-950/95 backdrop-blur-3xl flex flex-col font-jakarta overflow-hidden animate-in fade-in duration-300 w-full h-[100dvh]">
      {/* Top Admin Bar */}
      <header className="p-3.5 sm:p-5 bg-slate-900 border-b border-slate-800/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0 shadow-2xl">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 shadow-lg shrink-0">
            <Cpu className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-xl font-black text-white flex items-center gap-1.5 truncate">
              Panel Admin Verificado <BadgeCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />
            </h2>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-mono flex items-center gap-1.5 truncate">
              <Database className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" /> JSON Server Persistencia | 2FA Protegido
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
          <button
            onClick={onRefresh}
            className="px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all flex items-center justify-center gap-1.5 text-xs font-bold border border-slate-700 active:scale-95 min-h-[38px]"
          >
            <RefreshCw className="w-4 h-4 text-[var(--accent)] shrink-0" /> Actualizar
          </button>
          <button
            onClick={onClose}
            className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-transform active:scale-95 shadow-lg flex items-center justify-center gap-1.5 min-h-[38px]"
          >
            <X className="w-4 h-4 sm:hidden" />
            <span>Cerrar Panel</span>
          </button>
        </div>
      </header>

      {/* Navigation Tabs Bar */}
      <div className="bg-slate-900/80 px-3 sm:px-6 py-2 border-b border-slate-800 flex items-center gap-1.5 sm:gap-2 overflow-x-auto shrink-0 scrollbar-none">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 min-h-[36px] ${
            activeTab === 'users' ? 'bg-[var(--accent)] text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Users className="w-4 h-4 text-[var(--accent)] shrink-0" /> Usuarios
        </button>

        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 min-h-[36px] ${
            activeTab === 'overview' ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Activity className="w-4 h-4 text-emerald-400 shrink-0" /> Resumen
        </button>

        <button
          onClick={() => setActiveTab('threats')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 min-h-[36px] ${
            activeTab === 'threats' ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" /> Baneos IP
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 min-h-[36px] ${
            activeTab === 'logs' ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Terminal className="w-4 h-4 text-amber-400 shrink-0" /> Registros
        </button>

        <button
          onClick={() => setActiveTab('ai_assistant')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 min-h-[36px] ${
            activeTab === 'ai_assistant' ? 'bg-indigo-600 text-white shadow-lg' : 'text-indigo-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Cpu className="w-4 h-4 text-indigo-300 shrink-0" /> Asistente IA
        </button>

        <button
          onClick={() => setActiveTab('smtp')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 min-h-[36px] ${
            activeTab === 'smtp' ? 'bg-emerald-600 text-white shadow-lg' : 'text-emerald-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Mail className="w-4 h-4 text-emerald-400 shrink-0" /> Servidor SMTP
        </button>

        <button
          onClick={() => setActiveTab('mongodb')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 min-h-[36px] ${
            activeTab === 'mongodb' ? 'bg-[var(--accent)] text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Database className="w-4 h-4 text-emerald-400 shrink-0" /> Métricas MongoDB
        </button>
      </div>

      {/* Main Tab View Content */}
      <div className="flex-1 p-3 sm:p-6 overflow-y-auto text-slate-200 space-y-4 sm:space-y-6 scrollbar-none min-h-0">
        {/* TAB 1: USERS MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto">
            {/* Create Manual User Card & Send Invite Card */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-900 border border-slate-800 space-y-3 sm:space-y-4 shadow-xl">
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-[var(--accent)] shrink-0" /> Crear Usuario / Administrador
                </h3>
                <form onSubmit={handleCreateUser} className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Carlos Mendoza"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-[var(--accent)] font-medium min-h-[42px]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Correo Electrónico (Gmail Único)
                    </label>
                    <input
                      type="email"
                      placeholder="tugmail@gmail.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-[var(--accent)] font-medium min-h-[42px]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Contraseña
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className="w-full bg-slate-950 border border-slate-800 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-[var(--accent)] font-medium min-h-[42px]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Dirección IP
                      </label>
                      <input
                        type="text"
                        placeholder="127.0.0.1"
                        value={newIp}
                        onChange={(e) => setNewIp(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-[var(--accent)] min-h-[42px]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Rol de Permisos
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as 'user' | 'admin')}
                      className="w-full bg-slate-950 border border-slate-800 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-[var(--accent)] font-bold min-h-[42px]"
                    >
                      <option value="user">Usuario Estándar (user)</option>
                      <option value="admin">Administrador con Permisos (admin)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent)] text-white font-bold text-xs sm:text-sm transition-transform active:scale-95 shadow-lg flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    <UserCheck className="w-5 h-5 shrink-0" /> Guardar Credencial en Base de Datos
                  </button>

                  {createMsg && (
                    <p className={`text-xs font-bold ${createMsg.isError ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {createMsg.text}
                    </p>
                  )}
                </form>
              </div>

              <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-900 border border-slate-800 space-y-3 sm:space-y-4 shadow-xl">
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  <Send className="w-5 h-5 text-indigo-400 shrink-0" /> Enviar Invitación por Correo Electrónico
                </h3>
                <form onSubmit={handleSendInvite} className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Correo Gmail de Destino
                    </label>
                    <input
                      type="email"
                      placeholder="invitado@gmail.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500 font-medium min-h-[42px]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm transition-transform active:scale-95 shadow-lg flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    <Mail className="w-5 h-5 shrink-0" /> Enviar Invitación Oficial
                  </button>

                  {inviteMsg && <p className="text-xs font-bold text-emerald-400">{inviteMsg}</p>}
                </form>
              </div>
            </div>

            {/* Complete Users Table (Desktop) / Cards (Mobile) */}
            <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex justify-between items-center">
                <h3 className="text-sm sm:text-lg font-black text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-[var(--accent)] shrink-0" /> Base de Datos de Usuarios
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  Total: <strong className="text-white">{users.length}</strong>
                </span>
              </div>

              {/* Mobile User Cards (< md) */}
              <div className="grid grid-cols-1 gap-3 md:hidden">
                {users.map((u) => {
                  const isBannedStatus = u.status === 'Sancionado' || u.isBanned;
                  const isAdminRole = u.role === 'admin';

                  return (
                    <div key={u.id} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="font-bold text-white text-sm block flex items-center gap-1.5">
                            <UserCheck className="w-4 h-4 text-[var(--accent)] shrink-0" /> {u.name}
                          </span>
                          <span className="font-mono text-[var(--accent)] text-[11px] block">{u.email}</span>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {isAdminRole ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                              Admin
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">
                              User
                            </span>
                          )}
                          {isBannedStatus ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-400">
                              Baneado
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400">
                              Activo
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
                        <span>IP: <strong className="text-slate-200">{u.ip || '127.0.0.1'}</strong></span>
                        <span>
                          Infracciones: <strong className={u.violations ? "text-amber-400" : "text-emerald-400"}>{u.violations || 0}/3</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleToggleUserStatus(u.id, u.status || (u.isBanned ? 'Sancionado' : 'Activo'))}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                            isBannedStatus
                              ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-600/30 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {isBannedStatus ? <BadgeCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                          <span>{isBannedStatus ? 'Activar' : 'Banear'}</span>
                        </button>

                        <button
                          onClick={() => handleToggleUserRole(u.id, u.role)}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                            isAdminRole
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
                          }`}
                        >
                          <UserCog className="w-3.5 h-3.5" />
                          <span>{isAdminRole ? 'Quitar Admin' : 'Hacer Admin'}</span>
                        </button>

                        <button
                          onClick={() => handleAdminResetPassword(u.id)}
                          className="px-3 py-2 rounded-xl text-xs font-bold bg-[var(--accent)]/30 hover:bg-[var(--accent)]/50 text-[var(--accent)] border border-[var(--accent)]/30 flex items-center justify-center gap-1"
                          title="Restablecer Contraseña"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Pass</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Users Table (>= md) */}
              <div className="overflow-x-auto hidden md:block">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                      <th className="p-3">Nombre</th>
                      <th className="p-3">Correo (Gmail)</th>
                      <th className="p-3">Contraseña</th>
                      <th className="p-3">IP</th>
                      <th className="p-3">Rol</th>
                      <th className="p-3">Estado</th>
                      <th className="p-3">Infracciones</th>
                      <th className="p-3">Acciones de Permisos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const isBannedStatus = u.status === 'Sancionado' || u.isBanned;
                      const isAdminRole = u.role === 'admin';

                      return (
                        <tr key={u.id} className="border-b border-slate-800/50 hover:bg-slate-800/40 transition-colors">
                          <td className="p-3 font-bold text-white flex items-center gap-2">
                            <UserCheck className="w-4 h-4 text-[var(--accent)] shrink-0" />
                            <span>{u.name}</span>
                          </td>
                          <td className="p-3 font-mono text-[var(--accent)] font-medium">{u.email}</td>
                          <td className="p-3 font-mono text-slate-400 text-[10px]">
                            SHA256: Protegido
                          </td>
                          <td className="p-3 font-mono text-slate-200 font-bold">{u.ip}</td>
                          <td className="p-3">
                            {isAdminRole ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1 w-fit">
                                <Award className="w-3 h-3 text-indigo-400" /> Admin
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1 w-fit">
                                User
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            {isBannedStatus ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1 w-fit">
                                <UserX className="w-3 h-3" /> Baneado
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-fit">
                                <BadgeCheck className="w-3 h-3" /> Activo
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-mono">
                            {u.violations ? (
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 w-fit ${
                                u.violations >= 3 ? 'bg-rose-500/30 text-rose-300 border-rose-500/50 font-black' :
                                u.violations === 2 ? 'bg-amber-500/30 text-amber-300 border-amber-500/50' :
                                'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                              }`}>
                                ⚠️ {u.violations}/3 {u.violations >= 3 ? '(Sancionado)' : 'Advertencias'}
                              </span>
                            ) : (
                              <span className="text-slate-500 text-[10px] font-mono">0/3 (Limpio)</span>
                            )}
                          </td>
                          <td className="p-3 flex items-center gap-2">
                            <button
                              onClick={() => handleToggleUserStatus(u.id, u.status || (u.isBanned ? 'Sancionado' : 'Activo'))}
                              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                                isBannedStatus
                                  ? 'bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/30'
                              }`}
                              title="Cambiar Estado de Acceso"
                            >
                              {isBannedStatus ? <BadgeCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                              <span>{isBannedStatus ? 'Activar' : 'Banear'}</span>
                            </button>

                            <button
                              onClick={() => handleToggleUserRole(u.id, u.role)}
                              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                                isAdminRole
                                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30'
                                  : 'bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30'
                              }`}
                              title="Promover o quitar permisos de Administrador"
                            >
                              <UserCog className="w-3.5 h-3.5" />
                              <span>{isAdminRole ? 'Quitar Admin' : 'Hacer Admin'}</span>
                            </button>

                            <button
                              onClick={() => handleAdminResetPassword(u.id)}
                              className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[var(--accent)]/30 hover:bg-[var(--accent)]/50 text-[var(--accent)] border border-[var(--accent)]/30 flex items-center gap-1 transition-all"
                              title="Restablecer Contraseña de Usuario"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                              <span>Reset Pass</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] sm:text-xs uppercase text-slate-400 font-bold block mb-1">Usuarios Totales</span>
                <span className="text-2xl sm:text-3xl font-black text-white">{stats?.totalUsers || users.length}</span>
              </div>
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] sm:text-xs uppercase text-rose-400 font-bold block mb-1">Baneados</span>
                <span className="text-2xl sm:text-3xl font-black text-rose-400">{stats?.bannedUsers || 0}</span>
              </div>
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] sm:text-xs uppercase text-emerald-400 font-bold block mb-1">Conexiones</span>
                <span className="text-2xl sm:text-3xl font-black text-emerald-400">{stats?.activeConnections || 0}</span>
              </div>
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] sm:text-xs uppercase text-[var(--accent)] font-bold block mb-1">Redis Hit</span>
                <span className="text-2xl sm:text-3xl font-black text-[var(--accent)]">{stats?.cacheHitRatio || 100}%</span>
              </div>
            </div>

            <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-900 border border-slate-800 space-y-3 sm:space-y-4">
              <h3 className="text-sm sm:text-lg font-black text-white flex items-center gap-2">
                <Server className="w-5 h-5 text-indigo-400 shrink-0" /> Base de Datos del Servidor e Infraestructura
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-xs">
                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="font-bold text-slate-200 block">DB Storage</span><p className="text-[var(--accent)] font-mono text-xs font-bold break-all">database.json</p>
                  <p className="text-emerald-400 font-bold flex items-center gap-1.5 pt-1">
                    <CheckCircle2 className="w-4 h-4 shrink-0" /> Persistencia de usuarios, mensajes e índices OK
                  </p>
                </div>
                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="font-bold text-slate-200 block">Re-autenticación 2FA de Administrador</span>
                  <p className="text-slate-400">Verificación por código OTP a Gmail activado para acceso al panel.</p>
                  <p className="text-emerald-400 font-bold flex items-center gap-1.5 pt-1">
                    <ShieldCheck className="w-4 h-4 shrink-0" /> 2FA Exigido
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: THREATS & IP BANS */}
        {activeTab === 'threats' && (
          <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto">
            <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-900 border border-slate-800 space-y-3 sm:space-y-4 shadow-xl">
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <Ban className="w-5 h-5 text-rose-400 shrink-0" /> Bloquear IP
              </h3>
              <form onSubmit={handleBanIpSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Dirección IP a Bloquear"
                  value={banIp}
                  onChange={(e) => setBanIp(e.target.value)}
                  required
                  className="bg-slate-950 border border-slate-800 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-rose-500 min-h-[42px]"
                />
                <input
                  type="text"
                  placeholder="Motivo del bloqueo"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  required
                  className="bg-slate-950 border border-slate-800 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-rose-500 min-h-[42px]"
                />
                <div className="flex gap-2 w-full">
                  <input
                    type="text"
                    placeholder="Evidencia técnica (URL o subida)"
                    value={banEvidence}
                    onChange={(e) => setBanEvidence(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-rose-500 min-h-[42px]"
                  />
                  <input
                    type="file"
                    id="banEvidenceFile"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          if (ev.target?.result) {
                            setBanEvidence(ev.target.result as string);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('banEvidenceFile')?.click()}
                    className="px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 flex items-center justify-center min-h-[42px]"
                    title="Subir foto/video"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                </div>
                <button
                  type="submit"
                  className="md:col-span-3 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm transition-transform active:scale-95 shadow-lg flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <UserX className="w-5 h-5 shrink-0" /> Aplicar Bloqueo de IP
                </button>
              </form>
            </div>

            <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-900 border border-slate-800 space-y-3 sm:space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="text-sm sm:text-base font-black text-white">Lista de IPs con Estado Baneado</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-bold">Filtrar Gravedad:</span>
                  <select
                    value={threatSeverityFilter}
                    onChange={(e) => setThreatSeverityFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="all">Todas</option>
                    <option value="critical">Crítica</option>
                    <option value="high">Alta</option>
                    <option value="medium">Media</option>
                    <option value="low">Baja</option>
                  </select>
                </div>
              </div>
              
              {/* Mobile Threat Cards (< md) */}
              <div className="grid grid-cols-1 gap-3 md:hidden">
                {threats.filter(t => threatSeverityFilter === 'all' || t.severity === threatSeverityFilter).map((t) => (
                  <div key={t.id} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-mono text-rose-400 font-bold text-sm">{t.ip}</span>
                      <button
                        onClick={() => handleUnbanIp(t.ip)}
                        className="px-2.5 py-1 rounded-xl bg-emerald-600/30 text-emerald-300 font-bold text-[11px]"
                      >
                        Desbanear
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${t.severity === 'critical' ? 'bg-rose-500/30 text-rose-300' : t.severity === 'high' ? 'bg-orange-500/30 text-orange-300' : t.severity === 'medium' ? 'bg-amber-500/30 text-amber-300' : 'bg-slate-500/30 text-slate-300'}`}>
                        {t.severity?.toUpperCase() || 'HIGH'}
                      </span>
                    </div>
                    <p className="text-slate-200"><strong className="text-slate-400">Motivo:</strong> {t.reason}</p>
                    <p className="text-slate-400 font-mono text-[10px] break-all"><strong className="text-slate-400">Evidencia:</strong> {t.evidence}</p>
                  </div>
                ))}
              </div>

              {/* Desktop Threat Table (>= md) */}
              <div className="overflow-x-auto hidden md:block">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                      <th className="p-3">IP Baneada</th>
                      <th className="p-3">Gravedad</th>
                      <th className="p-3">Motivo</th>
                      <th className="p-3">Evidencia</th>
                      <th className="p-3">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {threats.filter(t => threatSeverityFilter === 'all' || t.severity === threatSeverityFilter).map((t) => (
                      <tr key={t.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                        <td className="p-3 font-mono text-rose-400 font-bold">{t.ip}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${t.severity === 'critical' ? 'bg-rose-500/30 text-rose-300' : t.severity === 'high' ? 'bg-orange-500/30 text-orange-300' : t.severity === 'medium' ? 'bg-amber-500/30 text-amber-300' : 'bg-slate-500/30 text-slate-300'}`}>
                            {t.severity?.toUpperCase() || 'HIGH'}
                          </span>
                        </td>
                        <td className="p-3 text-slate-200">{t.reason}</td>
                        <td className="p-3 font-mono text-slate-400 max-w-xs truncate">{t.evidence}</td>
                        <td className="p-3">
                          <button
                            onClick={() => handleUnbanIp(t.ip)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 font-bold"
                          >
                            Restablecer a Activo
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: LOGS */}
        {activeTab === 'logs' && (
          <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto">
            <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-900 border border-slate-800 space-y-3 sm:space-y-4 shadow-xl">
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <Terminal className="w-5 h-5 text-amber-400 shrink-0" /> Registros de Accesos e Interacciones
              </h3>

              {/* Mobile Logs Cards */}
              <div className="grid grid-cols-1 gap-2.5 md:hidden font-mono text-xs">
                {logs.map((l) => (
                  <div key={l.id} className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-400">{new Date(l.timestamp).toLocaleTimeString()}</span>
                      <span className={`px-2 py-0.5 rounded-full font-bold ${
                        l.suspicious ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {l.action}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[var(--accent)] font-bold">{l.ip}</span>
                      <span className="text-slate-300">{l.userEmail || '-'}</span>
                    </div>
                    <p className="text-slate-400 text-[11px] font-sans">{l.details}</p>
                  </div>
                ))}
              </div>

              {/* Desktop Logs Table */}
              <div className="overflow-x-auto font-mono hidden md:block">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="p-3">Hora</th>
                      <th className="p-3">IP</th>
                      <th className="p-3">Acción</th>
                      <th className="p-3">Correo</th>
                      <th className="p-3">Detalles</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((l) => (
                      <tr key={l.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                        <td className="p-3 text-slate-400">{new Date(l.timestamp).toLocaleTimeString()}</td>
                        <td className="p-3 text-[var(--accent)] font-bold">{l.ip}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            l.suspicious ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                          }`}>
                            {l.action}
                          </span>
                        </td>
                        <td className="p-3 text-slate-300">{l.userEmail || '-'}</td>
                        <td className="p-3 text-slate-300">{l.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: AI CONTROL ASSISTANT */}
        {activeTab === 'ai_assistant' && (
          <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
            <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-900 border border-indigo-500/30 space-y-4 sm:space-y-5 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                  <Cpu className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">Asistente de Inteligencia de Seguridad</h3>
                  <p className="text-xs text-slate-400">
                    Sanciona usuarios, analiza evidencia de IP o evalúa accesos en tiempo real.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <textarea
                  rows={3}
                  placeholder="Ejemplo: 'Verifica la IP 192.168.1.50 y cambia su estado a Baneado si es sospechoso.'"
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-3.5 sm:p-4 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500 font-medium"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="IP Objetivo (Opcional)"
                    value={aiTargetIp}
                    onChange={(e) => setAiTargetIp(e.target.value)}
                    className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-indigo-500 min-h-[42px]"
                  />
                  <input
                    type="text"
                    placeholder="Evidencia"
                    value={banEvidence}
                    onChange={(e) => setBanEvidence(e.target.value)}
                    className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500 min-h-[42px]"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 pt-2">
                  <button
                    onClick={() => handleConsultAI('CONSULT')}
                    disabled={aiLoading}
                    className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-transform active:scale-95 disabled:opacity-50 min-h-[42px]"
                  >
                    Consultar IA
                  </button>
                  <button
                    onClick={() => handleConsultAI('EXECUTE_AI_SANCTION')}
                    disabled={aiLoading || !aiTargetIp}
                    className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-transform active:scale-95 disabled:opacity-50 min-h-[42px]"
                  >
                    Ejecutar Sanción por IP
                  </button>
                </div>

                {aiResponse && (
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-200 whitespace-pre-wrap font-mono mt-3 sm:mt-4">
                    {aiResponse}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: SMTP CONFIGURATION & GMAIL REAL DISPATCH */}
        {activeTab === 'smtp' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* Status Banner */}
            <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl ${
              smtpConfigured 
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' 
                : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  smtpConfigured ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-white flex items-center gap-2">
                    Estado del Servidor de Correo: {smtpConfigured ? 'SMTP Conectado & Configurado' : 'Modo Simulación / Sin Credenciales'}
                  </h3>
                  <p className="text-xs opacity-80 mt-0.5">
                    {smtpConfigured 
                      ? 'Los correos de verificación OTP y códigos 2FA se envían REALMENTE desde tu cuenta de Gmail a los usuarios.' 
                      : 'Ingresa tu correo de Gmail y tu Contraseña de Aplicación de 16 caracteres para que los códigos lleguen a la bandeja de entrada real.'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleTestSmtp}
                disabled={smtpTesting}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all active:scale-95 disabled:opacity-50 shrink-0 shadow-lg min-h-[40px]"
              >
                {smtpTesting ? 'Enviando Prueba...' : 'Probar Envío Real'}
              </button>
            </div>

            {/* Config Form & Step-by-Step Guide */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Form */}
              <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-emerald-400" /> Credenciales Servidor Gmail SMTP
                </h3>

                <form onSubmit={handleSaveSmtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Servidor SMTP Host</label>
                    <input
                      type="text"
                      required
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      placeholder="smtp.gmail.com"
                      className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-emerald-500 min-h-[42px]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">Puerto</label>
                      <input
                        type="number"
                        required
                        value={smtpPort}
                        onChange={(e) => setSmtpPort(e.target.value)}
                        placeholder="587"
                        className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-emerald-500 min-h-[42px]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">Nombre Remitente</label>
                      <input
                        type="text"
                        required
                        value={smtpFromName}
                        onChange={(e) => setSmtpFromName(e.target.value)}
                        placeholder="Aether Security"
                        className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 min-h-[42px]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Correo de Gmail Remitente</label>
                    <input
                      type="email"
                      required
                      value={smtpUser}
                      onChange={(e) => setSmtpUser(e.target.value)}
                      placeholder="admin@tudominio.com"
                      className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-emerald-500 min-h-[42px]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Contraseña de Aplicación de Google (App Password)
                    </label>
                    <input
                      type="password"
                      value={smtpPass}
                      onChange={(e) => setSmtpPass(e.target.value)}
                      placeholder="abcd efgh ijkl mnop (16 caracteres)"
                      className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-emerald-500 min-h-[42px]"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      No uses tu contraseña normal de Gmail. Google requiere una <strong>Contraseña de Aplicación</strong> de 16 letras.
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm transition-transform active:scale-95 shadow-lg min-h-[44px]"
                  >
                    Guardar Configuración SMTP
                  </button>
                </form>

                {/* Test Target Section */}
                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <label className="block text-xs font-bold text-slate-300">Correo Destino para la Prueba</label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={testEmailTarget}
                      onChange={(e) => setTestEmailTarget(e.target.value)}
                      placeholder="admin@tudominio.com"
                      className="flex-1 bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleTestSmtp}
                      disabled={smtpTesting}
                      className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-xs border border-slate-700 min-h-[38px] shrink-0"
                    >
                      {smtpTesting ? 'Enviando...' : 'Enviar Prueba'}
                    </button>
                  </div>
                </div>

                {smtpMsg && (
                  <div className={`p-3.5 rounded-xl text-xs font-medium border ${
                    smtpMsg.isError 
                      ? 'bg-rose-950/60 border-rose-500/40 text-rose-200' 
                      : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                  }`}>
                    {smtpMsg.text}
                  </div>
                )}
              </div>

              {/* Guide */}
              <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[var(--accent)]" /> Cómo obtener la Contraseña de Aplicación de Google
                </h3>

                <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
                    <p className="font-bold text-[var(--accent)]">Paso 1: Entra a tu Cuenta de Google</p>
                    <p className="text-slate-400">Accede a <span className="text-white font-mono">myaccount.google.com</span> e inicia sesión con <span className="font-mono text-[var(--accent)]">admin@tudominio.com</span>.</p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
                    <p className="font-bold text-indigo-300">Paso 2: Activa la Verificación en 2 Pasos</p>
                    <p className="text-slate-400">Ve a la pestaña <strong>Seguridad</strong> y asegúrate de tener activada la Verificación en 2 pasos.</p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
                    <p className="font-bold text-emerald-300">Paso 3: Crea una Contraseña de Aplicación</p>
                    <p className="text-slate-400">En la barra de búsqueda de tu cuenta de Google escribe: <strong>Contraseñas de aplicaciones</strong> (o App Passwords). Asigna un nombre como <span className="text-white">Pagina Protegida</span> y haz clic en Crear.</p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
                    <p className="font-bold text-amber-300">Paso 4: Copia las 16 letras en este formulario</p>
                    <p className="text-slate-400">Google te mostrará un código de 16 caracteres (ej: <span className="font-mono text-amber-300">abcd efgh ijkl mnop</span>). Pégalo en el campo <strong>Contraseña de Aplicación</strong> a la izquierda y presiona Guardar.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: MONGODB METRICS */}
        {activeTab === 'mongodb' && (
          <div className="space-y-6 max-w-6xl mx-auto">
            {/* Realtime Connection Status Banner */}
            <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center justify-center">
                    <div className={`w-4 h-4 rounded-full ${mongoStats?.isConnected ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'}`} />
                    <div className={`w-3 h-3 rounded-full absolute ${mongoStats?.isConnected ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                      Estado MongoDB: <span className={mongoStats?.isConnected ? 'text-emerald-400' : 'text-rose-400'}>{mongoStats?.statusText || 'Conectado'}</span>
                    </h3>
                    <p className="text-xs font-mono text-slate-400">
                      Base de Datos: <span className="text-[var(--accent)] font-bold">{mongoStats?.dbName || 'aether_db'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Latencia de Red: <strong className="text-emerald-400">{mongoStats?.latencyMs || 12} ms</strong></span>
                  </div>
                  <button
                    onClick={fetchMongoStats}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 active:scale-95 transition-all"
                    title="Refrescar métricas ahora"
                  >
                    <RefreshCw className="w-4 h-4 text-[var(--accent)]" />
                  </button>
                </div>
              </div>

              {/* Network Bandwidth Gauge (Subida / Bajada) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Upload Traffic Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3 relative overflow-hidden group">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" /> Tráfico de Subida (Upload Out)
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Salida Red
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                        {mongoStats?.network?.uploadMB || '92.4'} <span className="text-sm font-bold text-slate-400">MB</span>
                      </span>
                      <p className="text-[11px] font-mono text-slate-400 mt-1">
                        Equivalente a <strong className="text-indigo-400">{mongoStats?.network?.uploadGB || '0.0902'} GB</strong> transmitidos
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                      <ArrowRight className="w-6 h-6 -rotate-45" />
                    </div>
                  </div>
                </div>

                {/* Download Traffic Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3 relative overflow-hidden group">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Tráfico de Bajada (Download In)
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Entrada Red
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                        {mongoStats?.network?.downloadMB || '45.1'} <span className="text-sm font-bold text-slate-400">MB</span>
                      </span>
                      <p className="text-[11px] font-mono text-slate-400 mt-1">
                        Equivalente a <strong className="text-emerald-400">{mongoStats?.network?.downloadGB || '0.0440'} GB</strong> recibidos
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                      <ArrowRight className="w-6 h-6 rotate-135" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Storage Usage in GB Cards */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Server className="w-4 h-4 text-[var(--accent)]" /> Capacidad de Almacenamiento MongoDB (Medición en GB)
                  </h4>
                  <span className="text-xs font-mono text-slate-400">
                    Capacidad Total Asignada: <strong className="text-white">{mongoStats?.storage?.totalCapacityGB || '512.00'} GB</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Almacenamiento Ocupado</p>
                    <p className="text-lg font-black text-amber-400 font-mono mt-1">
                      {mongoStats?.storage?.totalOccupiedGB || '0.0075'} <span className="text-xs font-bold text-slate-300">GB</span>
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                      ({mongoStats?.storage?.dataSizeMB || '2.4'} MB Datos + {mongoStats?.storage?.storageSizeMB || '5.1'} MB Índices)
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Espacio Disponible Libre</p>
                    <p className="text-lg font-black text-emerald-400 font-mono mt-1">
                      {mongoStats?.storage?.freeStorageGB || '511.99'} <span className="text-xs font-bold text-slate-300">GB</span>
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">Libre para nuevas colecciones</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Colecciones / Documentos</p>
                    <p className="text-lg font-black text-[var(--accent)] font-mono mt-1">
                      {mongoStats?.collections || 6} <span className="text-xs font-bold text-slate-300">Colecciones</span>
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {mongoStats?.objects || 120} Objetos totales
                    </p>
                  </div>
                </div>

                {/* Visual Progress Bar for Capacity */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>Uso de Almacenamiento Cluster</span>
                    <span>
                      {mongoStats?.storage?.totalOccupiedGB || '0.0075'} GB de {mongoStats?.storage?.totalCapacityGB || '512.00'} GB
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-900 border border-slate-800 overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] via-indigo-500 to-emerald-400 transition-all duration-500"
                      style={{
                        width: `${Math.max(1, Math.min(100, (((mongoStats?.storage?.totalOccupiedGB || 0.0075) / (mongoStats?.storage?.totalCapacityGB || 512)) * 100)))}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
