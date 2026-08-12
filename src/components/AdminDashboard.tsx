import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, ShieldCheck, Activity, Users, Lock, Key, Server, 
  Trash2, Ban, UserPlus, Send, RefreshCw, Cpu, AlertTriangle, CheckCircle2,
  Database, Zap, Eye, Terminal, Mail, KeyRound, UserCheck, UserX, BadgeCheck,
  Globe, Clock, Layers, ArrowRight, Shield, Award, Sparkles, Bot, UserCog, UserMinus, X, Crown,
  Edit3, Plus, Search, Filter, MessageSquare, Settings, Power, Info, ChevronRight, Copy, Check, SlidersHorizontal, Menu, Flame
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
  type TabType = 'overview' | 'users' | 'rooms' | 'threats' | 'logs' | 'ai_assistant' | 'smtp' | 'mongodb' | 'premium';
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Toast Notification System
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Rooms State
  const [roomsList, setRoomsList] = useState<any[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [roomSearch, setRoomSearch] = useState('');

  const fetchRooms = async () => {
    setLoadingRooms(true);
    try {
      const data = await adminService.getRooms(token);
      setRoomsList(data || []);
    } catch (err: any) {
      console.error("Error fetching admin rooms:", err);
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'rooms') {
      fetchRooms();
    }
  }, [activeTab, token]);

  // Realtime MongoDB Metrics State
  const [mongoStats, setMongoStats] = useState<any>(null);
  const fetchMongoStats = async () => {
    try {
      const data = await adminService.getMongoStats(token);
      setMongoStats(data);
    } catch {
      // Graceful fallback
    }
  };

  useEffect(() => {
    if (activeTab === 'mongodb') {
      fetchMongoStats();
      const interval = setInterval(fetchMongoStats, 5000);
      return () => clearInterval(interval);
    }
  }, [token, activeTab]);

  // Filters for User Management
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'Activo' | 'Baneado'>('all');
  const [userPremiumFilter, setUserPremiumFilter] = useState<'all' | 'premium' | 'standard'>('all');

  // Modals State
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);
  const [resetPassUser, setResetPassUser] = useState<UserProfile | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [deletingRoom, setDeletingRoom] = useState<any | null>(null);

  // Edit User Form State
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<'user' | 'admin'>('user');
  const [editStatus, setEditStatus] = useState<'Activo' | 'Baneado'>('Activo');
  const [editIp, setEditIp] = useState('');
  const [editIsPremium, setEditIsPremium] = useState(false);
  const [editPremiumDays, setEditPremiumDays] = useState(30);

  const openEditUser = (u: UserProfile) => {
    setEditingUser(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditRole(u.role);
    setEditStatus(u.status === 'Baneado' ? 'Baneado' : 'Activo');
    setEditIp(u.ip || '');
    setEditIsPremium(!!u.isPremium);
    if (u.premiumExpiresAt) {
      const remainingDays = Math.max(1, Math.round((u.premiumExpiresAt - Date.now()) / (1000 * 60 * 60 * 24)));
      setEditPremiumDays(remainingDays);
    } else {
      setEditPremiumDays(30);
    }
  };

  const handleSaveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const expTimestamp = editIsPremium ? Date.now() + editPremiumDays * 24 * 60 * 60 * 1000 : undefined;
      const res = await adminService.editUser({
        userId: editingUser.id,
        name: editName,
        email: editEmail,
        role: editRole,
        status: editStatus,
        ip: editIp,
        isPremium: editIsPremium,
        premiumExpiresAt: expTimestamp
      }, token);
      showToast(res.message || "Usuario actualizado correctamente", "success");
      setEditingUser(null);
      onRefresh();
    } catch (err: any) {
      showToast(err.message || "Error al actualizar usuario", "error");
    }
  };

  const handleDeleteUserConfirm = async () => {
    if (!deletingUser) return;
    try {
      const res = await adminService.deleteUser(deletingUser.id, token);
      showToast(res.message || "Usuario eliminado exitosamente", "success");
      setDeletingUser(null);
      onRefresh();
    } catch (err: any) {
      showToast(err.message || "Error al eliminar usuario", "error");
    }
  };

  // Add User Form State
  const [addEmail, setAddEmail] = useState('');
  const [addName, setAddName] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addIp, setAddIp] = useState('127.0.0.1');
  const [addRole, setAddRole] = useState<'user' | 'admin'>('user');

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await adminService.createUser({
        email: addEmail,
        name: addName,
        password: addPassword,
        ip: addIp,
        role: addRole
      }, token);
      showToast(res.message || "Usuario creado exitosamente", "success");
      setShowAddUserModal(false);
      setAddEmail(''); setAddName(''); setAddPassword(''); setAddIp('127.0.0.1'); setAddRole('user');
      onRefresh();
    } catch (err: any) {
      showToast(err.message || "Error al crear usuario", "error");
    }
  };

  // Reset Password State
  const [newPassInput, setNewPassInput] = useState('');
  const handleResetPassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPassUser) return;
    try {
      const res = await adminService.resetUserPassword(resetPassUser.id, newPassInput, token);
      showToast(res.message || "Contraseña reestablecida", "success");
      setResetPassUser(null);
      setNewPassInput('');
    } catch (err: any) {
      showToast(err.message || "Error al restablecer contraseña", "error");
    }
  };

  // Quick Action Toggles
  const handleToggleStatus = async (user: UserProfile) => {
    const nextStatus = user.status === 'Baneado' ? 'Activo' : 'Baneado';
    try {
      const res = await adminService.toggleStatus(user.id, nextStatus, token);
      showToast(res.message || `Estado cambiado a ${nextStatus}`, "success");
      onRefresh();
    } catch (err: any) {
      showToast(err.message || "Error al cambiar estado", "error");
    }
  };

  const handleToggleRole = async (user: UserProfile) => {
    const nextRole = user.role === 'admin' ? 'user' : 'admin';
    try {
      const res = await adminService.toggleRole(user.id, nextRole, token);
      showToast(res.message || `Rol cambiado a ${nextRole}`, "success");
      onRefresh();
    } catch (err: any) {
      showToast(err.message || "Error al cambiar rol", "error");
    }
  };

  // Room Deletion
  const handleDeleteRoomConfirm = async () => {
    if (!deletingRoom) return;
    try {
      const res = await adminService.deleteRoom(deletingRoom.id, token);
      showToast(res.message || "Sala eliminada", "success");
      setDeletingRoom(null);
      fetchRooms();
      onRefresh();
    } catch (err: any) {
      showToast(err.message || "Error al eliminar sala", "error");
    }
  };

  // IP Ban Form
  const [banIpInput, setBanIpInput] = useState('');
  const [banReasonInput, setBanReasonInput] = useState('');
  const [banEvidenceInput, setBanEvidenceInput] = useState('');

  const handleManualBanIp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!banIpInput.trim()) return;
    try {
      const res = await adminService.banIp({
        ip: banIpInput.trim(),
        reason: banReasonInput || "Sanción manual de Admin",
        severity: "high",
        evidence: banEvidenceInput || "Bloqueo manual en Dashboard"
      }, token);
      showToast(res.message || `IP ${banIpInput} baneada`, "success");
      setBanIpInput(''); setBanReasonInput(''); setBanEvidenceInput('');
      onRefresh();
    } catch (err: any) {
      showToast(err.message || "Error al banear IP", "error");
    }
  };

  const handleUnbanIp = async (ip: string) => {
    try {
      const res = await adminService.unbanIp({ ip }, token);
      showToast(res.message || `IP ${ip} desbaneada`, "success");
      onRefresh();
    } catch (err: any) {
      showToast(err.message || "Error al desbanear IP", "error");
    }
  };

  // AI Assistant State
  const [aiQuery, setAiQuery] = useState('');
  const [aiTargetIp, setAiTargetIp] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const handleAiConsult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setAiResponse(null);
    try {
      const res = await fetch('/api/admin/ai-consult', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query: aiQuery, targetIp: aiTargetIp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error de IA');
      setAiResponse(data.answer);
    } catch (err: any) {
      showToast(err.message || "Error al consultar Asistente IA", "error");
    } finally {
      setAiLoading(false);
    }
  };

  // SMTP Config
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpFromName, setSmtpFromName] = useState('Aether Security');
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [testEmailTarget, setTestEmailTarget] = useState('');

  useEffect(() => {
    fetch('/api/admin/smtp-config', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (data.host) setSmtpHost(data.host);
        if (data.port) setSmtpPort(String(data.port));
        if (data.user) setSmtpUser(data.user);
        if (data.fromName) setSmtpFromName(data.fromName);
      })
      .catch(() => {});
  }, [token]);

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/smtp-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ host: smtpHost, port: Number(smtpPort), user: smtpUser, pass: smtpPass, fromName: smtpFromName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast("Configuración SMTP guardada", "success");
      setSmtpPass('');
    } catch (err: any) {
      showToast(err.message || "Error al guardar SMTP", "error");
    }
  };

  const handleTestSmtp = async () => {
    setSmtpTesting(true);
    try {
      const res = await fetch('/api/admin/test-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ toEmail: testEmailTarget || smtpUser })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(data.message || "Correo de prueba enviado con éxito", "success");
    } catch (err: any) {
      showToast(err.message || "Error enviando correo de prueba", "error");
    } finally {
      setSmtpTesting(false);
    }
  };

  // Filtered lists
  const filteredUsers = users.filter(u => {
    const searchLower = userSearch.toLowerCase();
    const matchesSearch = u.name.toLowerCase().includes(searchLower) || 
                          u.email.toLowerCase().includes(searchLower) || 
                          (u.ip && u.ip.includes(searchLower));
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    const matchesStatus = userStatusFilter === 'all' || u.status === userStatusFilter;
    const matchesPremium = userPremiumFilter === 'all' ? true : userPremiumFilter === 'premium' ? !!u.isPremium : !u.isPremium;
    return matchesSearch && matchesRole && matchesStatus && matchesPremium;
  });

  const filteredRooms = roomsList.filter(r => {
    const searchLower = roomSearch.toLowerCase();
    return r.name.toLowerCase().includes(searchLower) || 
           r.code.toLowerCase().includes(searchLower) || 
           r.createdByName.toLowerCase().includes(searchLower);
  });

  // Navigation Items
  const navItems: { id: TabType; label: string; icon: any; badge?: number }[] = [
    { id: 'overview', label: 'Métricas & Telemetría', icon: Activity },
    { id: 'users', label: 'Gestión de Usuarios', icon: Users, badge: users.length },
    { id: 'rooms', label: 'Salas & Espacios', icon: MessageSquare, badge: roomsList.length },
    { id: 'threats', label: 'Amenazas & IP Ban', icon: ShieldAlert, badge: threats.filter(t => t.blocked).length },
    { id: 'logs', label: 'Auditoría & Logs', icon: Terminal, badge: logs.length },
    { id: 'ai_assistant', label: 'Aether AI Guard', icon: Sparkles },
    { id: 'premium', label: 'Planes Premium', icon: Crown },
    { id: 'mongodb', label: 'Estado MongoDB', icon: Database },
    { id: 'smtp', label: 'Config SMTP', icon: Mail }
  ];

  return (
    <div className="fixed inset-0 z-50 flex bg-slate-950/95 text-slate-100 backdrop-blur-xl overflow-hidden font-sans">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl border shadow-2xl backdrop-blur-md ${
              toast.type === 'success' 
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-300' 
                : toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/40 text-rose-300'
                : 'bg-cyan-950/90 border-cyan-500/40 text-cyan-300'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-cyan-400 shrink-0" />}
            <span className="text-sm font-semibold">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 hover:opacity-75">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-slate-900/80 border-r border-slate-800/80 p-5 shrink-0 select-none">
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-6 mb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 shadow-lg shadow-cyan-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                Aether Security
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">PRO</span>
              </h1>
              <p className="text-xs text-slate-400 font-mono">Control Central System</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive 
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-lg shadow-cyan-500/10' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
                    isActive ? 'bg-cyan-500/30 text-cyan-200' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="pt-4 border-t border-slate-800/80 space-y-3">
          <button 
            onClick={onRefresh}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-xs font-semibold text-slate-300 transition-all active:scale-98"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sincronizar Datos</span>
          </button>
          <button 
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-bold text-rose-300 transition-all active:scale-98"
          >
            <X className="w-4 h-4" />
            <span>Cerrar Panel</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Mobile Header Bar */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 select-none">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-cyan-400" />
            <span className="font-bold text-sm text-white">Aether Panel</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={onRefresh}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button 
              onClick={onClose}
              className="p-2 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Mobile Slideout Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 space-y-1 z-40 overflow-y-auto max-h-[70vh]"
            >
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold ${
                      isActive ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 text-cyan-400" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-700 text-slate-300">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Horizontal Mobile Tab ScrollBar for Instant Access */}
        <div className="lg:hidden flex items-center gap-1.5 p-2 bg-slate-900/60 border-b border-slate-800 overflow-x-auto scrollbar-none shrink-0">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 bg-slate-800/30'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab View Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">

          {/* TAB 1: OVERVIEW & TELEMETRY */}
          {activeTab === 'overview' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900/80 to-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                    Panel Principal de Seguridad
                    <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
                  </h2>
                  <p className="text-slate-400 text-xs sm:text-sm mt-1">
                    Supervisión en tiempo real de infraestructura, usuarios y protocolos defensivos.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Sistema Operativo</span>
                  </div>
                </div>
              </div>

              {/* Telemetry Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all shadow-lg">
                  <div className="flex items-center justify-between text-slate-400 mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider">Usuarios Registrados</span>
                    <Users className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="text-3xl font-black text-white">{stats?.totalUsers ?? users.length}</div>
                  <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{users.filter(u => u.status === 'Activo').length} Usuarios activos</span>
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all shadow-lg">
                  <div className="flex items-center justify-between text-slate-400 mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider">Cuentas / IP Baneadas</span>
                    <Ban className="w-5 h-5 text-rose-400" />
                  </div>
                  <div className="text-3xl font-black text-white">{stats?.bannedUsers ?? users.filter(u => u.isBanned).length}</div>
                  <p className="text-xs text-rose-400/80 mt-2 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>{stats?.bannedIPsCount ?? 0} Direcciones IP Bloqueadas</span>
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all shadow-lg">
                  <div className="flex items-center justify-between text-slate-400 mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider">Salas Activas</span>
                    <MessageSquare className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="text-3xl font-black text-white">{stats?.activeRooms ?? roomsList.length}</div>
                  <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Espacios de chat global y privado</span>
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all shadow-lg">
                  <div className="flex items-center justify-between text-slate-400 mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider">Amenazas Neutralizadas</span>
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="text-3xl font-black text-white">{stats?.threatsDetected ?? threats.length}</div>
                  <p className="text-xs text-emerald-400/80 mt-2 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Aether IA Threat Shield activo</span>
                  </p>
                </div>
              </div>

              {/* Quick Actions Panel */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
                <h3 className="text-sm font-extrabold uppercase text-slate-300 tracking-wider mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  Acciones Rápidas de Administración
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <button 
                    onClick={() => { setActiveTab('users'); setShowAddUserModal(true); }}
                    className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition-all group"
                  >
                    <div className="p-2.5 rounded-lg bg-blue-500/20 text-blue-400 group-hover:scale-105 transition-transform">
                      <UserPlus className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Añadir Usuario</div>
                      <div className="text-[11px] text-slate-400">Crear cuenta directa</div>
                    </div>
                  </button>

                  <button 
                    onClick={() => setActiveTab('premium')}
                    className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition-all group"
                  >
                    <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-400 group-hover:scale-105 transition-transform">
                      <Crown className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Gestionar Premium</div>
                      <div className="text-[11px] text-slate-400">Asignar suscripciones</div>
                    </div>
                  </button>

                  <button 
                    onClick={() => setActiveTab('threats')}
                    className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition-all group"
                  >
                    <div className="p-2.5 rounded-lg bg-rose-500/20 text-rose-400 group-hover:scale-105 transition-transform">
                      <Ban className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Bloqueo de IP</div>
                      <div className="text-[11px] text-slate-400">Sancionar agresor</div>
                    </div>
                  </button>

                  <button 
                    onClick={() => setActiveTab('smtp')}
                    className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition-all group"
                  >
                    <div className="p-2.5 rounded-lg bg-fuchsia-500/20 text-fuchsia-400 group-hover:scale-105 transition-transform">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Configurar SMTP</div>
                      <div className="text-[11px] text-slate-400">Probar envíos Gmail</div>
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: USER MANAGEMENT (FULL CRUD) */}
          {activeTab === 'users' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Header & Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                    <Users className="w-6 h-6 text-blue-400" />
                    Gestión de Usuarios ({filteredUsers.length})
                  </h2>
                  <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
                    Añadir, editar, suspender o eliminar cuentas del sistema.
                  </p>
                </div>
                <button 
                  onClick={() => setShowAddUserModal(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-extrabold shadow-lg shadow-blue-600/25 active:scale-98 transition-all"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Nuevo Usuario</span>
                </button>
              </div>

              {/* Search & Filter Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input 
                    type="text"
                    placeholder="Buscar por nombre, email o IP..."
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <select 
                    value={userRoleFilter} 
                    onChange={e => setUserRoleFilter(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:border-blue-500 outline-none"
                  >
                    <option value="all">Todos los Roles</option>
                    <option value="admin">Administradores</option>
                    <option value="user">Usuarios Normales</option>
                  </select>
                </div>

                <div>
                  <select 
                    value={userStatusFilter} 
                    onChange={e => setUserStatusFilter(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:border-blue-500 outline-none"
                  >
                    <option value="all">Todos los Estados</option>
                    <option value="Activo">Activo</option>
                    <option value="Baneado">Baneado</option>
                  </select>
                </div>

                <div>
                  <select 
                    value={userPremiumFilter} 
                    onChange={e => setUserPremiumFilter(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:border-blue-500 outline-none"
                  >
                    <option value="all">Todos los Planes</option>
                    <option value="premium">Solo Premium</option>
                    <option value="standard">Solo Estándar</option>
                  </select>
                </div>
              </div>

              {/* Users Table / Mobile Cards */}
              <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b border-slate-800 text-[11px] font-extrabold uppercase text-slate-400 bg-slate-950/50">
                        <th className="p-4">Usuario</th>
                        <th className="p-4">IP & Rol</th>
                        <th className="p-4">Plan</th>
                        <th className="p-4">Estado</th>
                        <th className="p-4 text-right">Acciones CRUD</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-xs">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-500 font-medium">
                            No se encontraron usuarios coincidentes.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map(u => (
                          <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                            {/* User Info */}
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                                  u.role === 'admin' 
                                    ? 'bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950' 
                                    : 'bg-slate-800 text-slate-300'
                                }`}>
                                  {u.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-bold text-white flex items-center gap-1.5">
                                    {u.name}
                                    {u.role === 'admin' && <Crown className="w-3.5 h-3.5 text-amber-400 inline" />}
                                  </div>
                                  <div className="text-slate-400 text-[11px] font-mono">{u.email}</div>
                                </div>
                              </div>
                            </td>

                            {/* IP & Role */}
                            <td className="p-4">
                              <div className="font-mono text-slate-300 text-[11px] mb-1">{u.ip || '127.0.0.1'}</div>
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                u.role === 'admin' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-400'
                              }`}>
                                {u.role.toUpperCase()}
                              </span>
                            </td>

                            {/* Premium Plan */}
                            <td className="p-4">
                              {u.isPremium ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  <Crown className="w-3 h-3 text-amber-400" />
                                  <span>PREMIUM</span>
                                </span>
                              ) : (
                                <span className="text-slate-500 text-[11px]">Estándar</span>
                              )}
                            </td>

                            {/* Status */}
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase inline-flex items-center gap-1 ${
                                u.status === 'Baneado' || u.isBanned 
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${u.isBanned ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                                {u.status || (u.isBanned ? 'Baneado' : 'Activo')}
                              </span>
                            </td>

                            {/* Actions CRUD */}
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Edit */}
                                <button
                                  onClick={() => openEditUser(u)}
                                  title="Editar usuario"
                                  className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition-all"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>

                                {/* Toggle Ban */}
                                <button
                                  onClick={() => handleToggleStatus(u)}
                                  title={u.isBanned ? "Desbanear usuario" : "Banear usuario"}
                                  className={`p-1.5 rounded-lg border transition-all ${
                                    u.isBanned 
                                      ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20' 
                                      : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/20'
                                  }`}
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                </button>

                                {/* Toggle Role */}
                                <button
                                  onClick={() => handleToggleRole(u)}
                                  title="Cambiar rol Admin/User"
                                  className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition-all"
                                >
                                  <UserCog className="w-3.5 h-3.5" />
                                </button>

                                {/* Reset Password */}
                                <button
                                  onClick={() => setResetPassUser(u)}
                                  title="Restablecer contraseña"
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
                                >
                                  <KeyRound className="w-3.5 h-3.5" />
                                </button>

                                {/* Delete */}
                                <button
                                  onClick={() => setDeletingUser(u)}
                                  title="Eliminar permanentemente"
                                  className="p-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 transition-all"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: ROOMS CONTROL */}
          {activeTab === 'rooms' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                    <MessageSquare className="w-6 h-6 text-indigo-400" />
                    Gestión de Salas de Chat ({roomsList.length})
                  </h2>
                  <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
                    Monitorear salas activas, mensajes acumulados y eliminar espacios.
                  </p>
                </div>
                <button 
                  onClick={fetchRooms} 
                  disabled={loadingRooms}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingRooms ? 'animate-spin' : ''}`} />
                  <span>Actualizar Lista</span>
                </button>
              </div>

              {/* Room Search Bar */}
              <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input 
                    type="text"
                    placeholder="Filtrar por nombre de sala, código o creador..."
                    value={roomSearch}
                    onChange={e => setRoomSearch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Rooms List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRooms.length === 0 ? (
                  <div className="col-span-full p-8 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800 font-medium">
                    No hay salas registradas que coincidan con el filtro.
                  </div>
                ) : (
                  filteredRooms.map(r => (
                    <div key={r.id} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all space-y-4 shadow-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-extrabold text-white text-base">{r.name}</h3>
                          <div className="text-xs text-indigo-400 font-mono mt-0.5">Código: #{r.code}</div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          r.isClosed ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {r.isClosed ? 'Cerrada' : 'Abierta'}
                        </span>
                      </div>

                      <div className="text-xs text-slate-400 space-y-1">
                        <div className="flex justify-between">
                          <span>Creador:</span>
                          <span className="text-slate-200 font-semibold">{r.createdByName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Privacidad:</span>
                          <span className="text-slate-200">{r.isPrivate ? 'Privada (Código)' : 'Pública'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Mensajes Guardados:</span>
                          <span className="text-cyan-400 font-mono font-bold">{r.messageCount ?? 0}</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-800 flex items-center justify-end">
                        <button 
                          onClick={() => setDeletingRoom(r)}
                          className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Eliminar Sala</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 4: THREATS & IP BAN */}
          {activeTab === 'threats' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-7 h-7 text-rose-400" />
                <div>
                  <h2 className="text-2xl font-black text-white">Amenazas & Bloqueo de IP</h2>
                  <p className="text-slate-400 text-xs sm:text-sm">Registro de amenazas de seguridad y sanciones manuales.</p>
                </div>
              </div>

              {/* Manual IP Ban Form */}
              <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-xs font-extrabold uppercase text-slate-300 tracking-wider">Bloqueo Manual de Dirección IP</h3>
                <form onSubmit={handleManualBanIp} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input 
                    type="text"
                    placeholder="Dirección IP (ej. 192.168.1.1)..."
                    value={banIpInput}
                    onChange={e => setBanIpInput(e.target.value)}
                    required
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-rose-500 outline-none"
                  />
                  <input 
                    type="text"
                    placeholder="Razón del bloqueo..."
                    value={banReasonInput}
                    onChange={e => setBanReasonInput(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-rose-500 outline-none"
                  />
                  <button 
                    type="submit"
                    className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <Ban className="w-4 h-4" />
                    <span>Aplicar Ban IP</span>
                  </button>
                </form>
              </div>

              {/* Threat Logs List */}
              <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[650px]">
                    <thead>
                      <tr className="border-b border-slate-800 text-[11px] font-extrabold uppercase text-slate-400 bg-slate-950/50">
                        <th className="p-4">Dirección IP</th>
                        <th className="p-4">Tipo de Amenaza</th>
                        <th className="p-4">Gravedad</th>
                        <th className="p-4">Razón / Evidencia</th>
                        <th className="p-4 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-xs">
                      {threats.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-500">No se registran amenazas activas.</td>
                        </tr>
                      ) : (
                        threats.map(t => (
                          <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="p-4 font-mono text-cyan-400">{t.ip}</td>
                            <td className="p-4 font-semibold text-white">{t.threatType}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                t.severity === 'high' || t.severity === 'critical' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                              }`}>
                                {t.severity}
                              </span>
                            </td>
                            <td className="p-4 text-slate-400 text-[11px] max-w-xs truncate">{t.reason}</td>
                            <td className="p-4 text-right">
                              <button 
                                onClick={() => handleUnbanIp(t.ip)}
                                className="px-3 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold"
                              >
                                Desbanear
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 5: AUDIT ACCESS LOGS */}
          {activeTab === 'logs' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3">
                <Terminal className="w-7 h-7 text-cyan-400" />
                <div>
                  <h2 className="text-2xl font-black text-white">Auditoría & Access Logs</h2>
                  <p className="text-slate-400 text-xs sm:text-sm">Registro detallado de accesos e interacciones de seguridad.</p>
                </div>
              </div>

              <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[650px]">
                    <thead>
                      <tr className="border-b border-slate-800 text-[11px] font-extrabold uppercase text-slate-400 bg-slate-950/50">
                        <th className="p-4">IP</th>
                        <th className="p-4">Acción</th>
                        <th className="p-4">Detalles</th>
                        <th className="p-4">Estado</th>
                        <th className="p-4 text-right">Fecha / Hora</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-xs">
                      {logs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-500">No hay registros de auditoría disponibles.</td>
                        </tr>
                      ) : (
                        logs.map(l => (
                          <tr key={l.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="p-4 font-mono text-cyan-400">{l.ip}</td>
                            <td className="p-4 font-bold text-white">{l.action}</td>
                            <td className="p-4 text-slate-400 text-[11px] max-w-xs truncate">{l.details || l.userEmail || '-'}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                l.suspicious ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                              }`}>
                                {l.suspicious ? 'Sospechoso' : 'OK'}
                              </span>
                            </td>
                            <td className="p-4 text-right font-mono text-[11px] text-slate-500">
                              {new Date(l.timestamp).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 6: AI ASSISTANT */}
          {activeTab === 'ai_assistant' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 max-w-4xl mx-auto"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-cyan-400" />
                <div>
                  <h2 className="text-2xl font-black text-white">Aether AI Security Guard</h2>
                  <p className="text-slate-400 text-xs sm:text-sm">Asistente de consulta e inteligencia para decisiones de administración.</p>
                </div>
              </div>

              <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-4">
                <form onSubmit={handleAiConsult} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">Consulta o Indicación de Análisis</label>
                    <textarea 
                      rows={3}
                      value={aiQuery}
                      onChange={e => setAiQuery(e.target.value)}
                      placeholder="Ej: Analizar la IP 192.168.1.50 para intentos repetidos de autenticación fallida..."
                      className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-cyan-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">IP Objetivo (Opcional)</label>
                    <input 
                      type="text"
                      value={aiTargetIp}
                      onChange={e => setAiTargetIp(e.target.value)}
                      placeholder="127.0.0.1"
                      className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-cyan-500 outline-none"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={aiLoading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-extrabold text-xs shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Bot className="w-4 h-4" />
                    <span>{aiLoading ? 'Analizando con Aether AI...' : 'Consultar Aether AI'}</span>
                  </button>
                </form>

                {aiResponse && (
                  <div className="p-4 bg-slate-950 rounded-xl border border-cyan-500/30 text-xs text-cyan-200 whitespace-pre-wrap leading-relaxed mt-4">
                    {aiResponse}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 7: PREMIUM MANAGEMENT */}
          {activeTab === 'premium' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 max-w-4xl mx-auto"
            >
              <div className="flex items-center gap-3">
                <Crown className="w-8 h-8 text-amber-400" />
                <div>
                  <h2 className="text-2xl font-black text-white">Planes & Suscripciones Premium</h2>
                  <p className="text-slate-400 text-xs sm:text-sm">Otorgar o remover membresías VIP Premium a usuarios.</p>
                </div>
              </div>

              {/* Premium List */}
              <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-xs font-bold uppercase text-slate-400">Usuarios Premium Actuales</h3>
                <div className="space-y-2">
                  {users.filter(u => u.isPremium).length === 0 ? (
                    <div className="p-4 text-center text-slate-500 text-xs">No hay usuarios con plan Premium activo.</div>
                  ) : (
                    users.filter(u => u.isPremium).map(u => (
                      <div key={u.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <div className="flex items-center gap-3">
                          <Crown className="w-4 h-4 text-amber-400" />
                          <div>
                            <div className="text-xs font-bold text-white">{u.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-amber-300 font-mono">
                            Expira: {u.premiumExpiresAt ? new Date(u.premiumExpiresAt).toLocaleDateString() : 'Indefinido'}
                          </span>
                          <button 
                            onClick={() => openEditUser(u)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-700"
                          >
                            Editar
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 8: MONGODB METRICS */}
          {activeTab === 'mongodb' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3">
                <Database className="w-8 h-8 text-emerald-400" />
                <div>
                  <h2 className="text-2xl font-black text-white">Telemetría de Base de Datos MongoDB</h2>
                  <p className="text-slate-400 text-xs sm:text-sm">Estado de conexión, espacio ocupado y transferencia de red.</p>
                </div>
              </div>

              {mongoStats ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-slate-400 uppercase">Estado de Conexión</div>
                    <div className="text-xl font-black text-emerald-400 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{mongoStats.statusText || 'Conectado'}</span>
                    </div>
                    <div className="text-xs text-slate-500 font-mono">Latencia: {mongoStats.latencyMs ?? 5} ms</div>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-slate-400 uppercase">Colecciones & Objetos</div>
                    <div className="text-xl font-black text-white">{mongoStats.collections ?? 6} Colecciones</div>
                    <div className="text-xs text-slate-500 font-mono">{mongoStats.objects ?? 120} documentos guardados</div>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-slate-400 uppercase">Almacenamiento Ocupado</div>
                    <div className="text-xl font-black text-cyan-400">{mongoStats.storage?.storageSizeMB ?? 12.4} MB</div>
                    <div className="text-xs text-slate-500 font-mono">Index Size: {mongoStats.storage?.indexSizeGB ?? 0.02} GB</div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
                  Cargando estadísticas de MongoDB...
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 9: SMTP CONFIG */}
          {activeTab === 'smtp' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 max-w-4xl mx-auto"
            >
              <div className="flex items-center gap-3">
                <Mail className="w-8 h-8 text-fuchsia-400" />
                <div>
                  <h2 className="text-2xl font-black text-white">Configuración SMTP</h2>
                  <p className="text-slate-400 text-xs sm:text-sm">Servidor de salida para tokens 2FA y restablecimientos.</p>
                </div>
              </div>

              <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-4">
                <form onSubmit={handleSaveSmtp} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase">Host SMTP</label>
                      <input 
                        type="text"
                        value={smtpHost}
                        onChange={e => setSmtpHost(e.target.value)}
                        required
                        className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-fuchsia-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase">Puerto</label>
                      <input 
                        type="number"
                        value={smtpPort}
                        onChange={e => setSmtpPort(e.target.value)}
                        required
                        className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-fuchsia-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase">Correo de Gmail / Usuario</label>
                      <input 
                        type="email"
                        value={smtpUser}
                        onChange={e => setSmtpUser(e.target.value)}
                        required
                        className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-fuchsia-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase">Contraseña de Aplicación Google</label>
                      <input 
                        type="password"
                        value={smtpPass}
                        onChange={e => setSmtpPass(e.target.value)}
                        placeholder="Dejar en blanco para mantener..."
                        className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-fuchsia-500 outline-none"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-3 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-extrabold text-xs shadow-lg transition-colors"
                  >
                    Guardar Configuración SMTP
                  </button>
                </form>

                <div className="pt-6 border-t border-slate-800">
                  <h4 className="text-xs font-bold text-slate-300 uppercase mb-3">Probar Envío Real de Correo</h4>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input 
                      type="email"
                      placeholder="Correo de destino..."
                      value={testEmailTarget}
                      onChange={e => setTestEmailTarget(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-fuchsia-500 outline-none"
                    />
                    <button 
                      onClick={handleTestSmtp}
                      disabled={smtpTesting}
                      className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors disabled:opacity-50"
                    >
                      {smtpTesting ? 'Enviando...' : 'Enviar Prueba'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </main>
      </div>

      {/* MODAL: EDIT USER */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-2xl text-slate-100"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-blue-400" />
                  Editar Perfil de Usuario
                </h3>
                <button onClick={() => setEditingUser(null)} className="hover:opacity-75">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveUserEdit} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Nombre Completo</label>
                  <input 
                    type="text" 
                    value={editName} 
                    onChange={e => setEditName(e.target.value)} 
                    required 
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-blue-500 outline-none" 
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Correo Electrónico (Gmail)</label>
                  <input 
                    type="email" 
                    value={editEmail} 
                    onChange={e => setEditEmail(e.target.value)} 
                    required 
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-blue-500 outline-none" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">Rol</label>
                    <select 
                      value={editRole} 
                      onChange={e => setEditRole(e.target.value as any)}
                      className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                    >
                      <option value="user">Usuario Estándar</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">Estado</label>
                    <select 
                      value={editStatus} 
                      onChange={e => setEditStatus(e.target.value as any)}
                      className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                    >
                      <option value="Activo">Activo</option>
                      <option value="Baneado">Baneado</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Dirección IP Asignada</label>
                  <input 
                    type="text" 
                    value={editIp} 
                    onChange={e => setEditIp(e.target.value)} 
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-blue-500 outline-none" 
                  />
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-300">
                    <input 
                      type="checkbox" 
                      checked={editIsPremium} 
                      onChange={e => setEditIsPremium(e.target.checked)} 
                      className="rounded border-slate-800 bg-slate-950 text-amber-500 focus:ring-0"
                    />
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span>Membresía Premium Activa</span>
                  </label>

                  {editIsPremium && (
                    <div>
                      <label className="text-[11px] font-semibold text-slate-400">Días de Duración Premium</label>
                      <input 
                        type="number" 
                        value={editPremiumDays} 
                        onChange={e => setEditPremiumDays(Number(e.target.value))} 
                        min={1} 
                        className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-1.5 text-xs text-white focus:border-amber-500 outline-none" 
                      />
                    </div>
                  )}
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setEditingUser(null)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: ADD USER */}
      <AnimatePresence>
        {showAddUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-2xl text-slate-100"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-blue-400" />
                  Crear Nuevo Usuario
                </h3>
                <button onClick={() => setShowAddUserModal(false)} className="hover:opacity-75">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Nombre Completo</label>
                  <input 
                    type="text" 
                    value={addName} 
                    onChange={e => setAddName(e.target.value)} 
                    required 
                    placeholder="Juan Pérez"
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-blue-500 outline-none" 
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Correo Electrónico (Gmail)</label>
                  <input 
                    type="email" 
                    value={addEmail} 
                    onChange={e => setAddEmail(e.target.value)} 
                    required 
                    placeholder="usuario@gmail.com"
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-blue-500 outline-none" 
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Contraseña</label>
                  <input 
                    type="password" 
                    value={addPassword} 
                    onChange={e => setAddPassword(e.target.value)} 
                    required 
                    placeholder="••••••••"
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-blue-500 outline-none" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">Rol</label>
                    <select 
                      value={addRole} 
                      onChange={e => setAddRole(e.target.value as any)}
                      className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                    >
                      <option value="user">Usuario Estándar</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">IP Inicial</label>
                    <input 
                      type="text" 
                      value={addIp} 
                      onChange={e => setAddIp(e.target.value)} 
                      className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-blue-500 outline-none" 
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setShowAddUserModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                  >
                    Crear Cuenta
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: RESET PASSWORD */}
      <AnimatePresence>
        {resetPassUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl text-slate-100"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  Restablecer Contraseña
                </h3>
                <button onClick={() => setResetPassUser(null)} className="hover:opacity-75">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-400">
                Ingresa la nueva contraseña para el usuario <strong className="text-white">{resetPassUser.name}</strong>.
              </p>

              <form onSubmit={handleResetPassSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Nueva Contraseña (mín 6 carácteres)</label>
                  <input 
                    type="password"
                    value={newPassInput}
                    onChange={e => setNewPassInput(e.target.value)}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-amber-500 outline-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setResetPassUser(null)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs"
                  >
                    Restablecer
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: DELETE USER CONFIRM */}
      <AnimatePresence>
        {deletingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-rose-500/30 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl text-slate-100"
            >
              <div className="flex items-center gap-3 text-rose-400">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h3 className="font-extrabold text-base text-white">¿Eliminar Usuario Permanentemente?</h3>
              </div>

              <p className="text-xs text-slate-300">
                Esta acción eliminará la cuenta de <strong className="text-white">{deletingUser.name}</strong> ({deletingUser.email}) y borrará todas sus sesiones activas de la base de datos.
              </p>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setDeletingUser(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleDeleteUserConfirm}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                >
                  Eliminar permanentemente
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: DELETE ROOM CONFIRM */}
      <AnimatePresence>
        {deletingRoom && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-rose-500/30 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl text-slate-100"
            >
              <div className="flex items-center gap-3 text-rose-400">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h3 className="font-extrabold text-base text-white">¿Eliminar Sala de Chat?</h3>
              </div>

              <p className="text-xs text-slate-300">
                Se eliminará la sala <strong className="text-white">{deletingRoom.name}</strong> (#{deletingRoom.code}) y todos los mensajes asociados de forma permanente.
              </p>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setDeletingRoom(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleDeleteRoomConfirm}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                >
                  Eliminar Sala
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
