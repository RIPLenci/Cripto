import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, ShieldCheck, Activity, Users, Lock, Key, Server, 
  Trash2, Ban, UserPlus, Send, RefreshCw, Cpu, AlertTriangle, CheckCircle2,
  Database, Zap, Eye, Terminal, Mail, KeyRound, UserCheck, UserX, BadgeCheck,
  Globe, Clock, Layers, ArrowRight, Shield, Award, Sparkles, Bot, UserCog, UserMinus, X, Crown,
  Edit3, Plus, Search, Filter, MessageSquare, Settings, Power, Info, ChevronRight, Copy, Check, SlidersHorizontal, Menu, Flame, Radar,
  FileText, Download, Scale, Gavel, FileCheck, LayoutGrid, List
} from 'lucide-react';
import { SystemStats, UserProfile, ThreatLog, SecurityAccessLog, BannedIpDetail, ForensicCase, PlanTier, BadgeType } from '../types';
import { adminService, roomService } from '../services';
import { SecurityMonitor } from './SecurityMonitor';
import { 
  BADGE_ORDER, BADGE_DEFINITIONS, BadgeIcon, UserBadgeList, UserBadgeItem, 
  UserBadgeShowcase, getSortedBadges 
} from './BadgeRenderer';

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
  type TabType = 'overview' | 'ws_monitor' | 'users' | 'rooms' | 'forensics' | 'threats' | 'logs' | 'ai_assistant' | 'premium' | 'mongodb' | 'smtp';
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Toast Notification System
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Badge Management Modal State
  const [badgeModalUser, setBadgeModalUser] = useState<UserProfile | null>(null);
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [customBadgeTextInput, setCustomBadgeTextInput] = useState('');
  const [badgeFilterCategory, setBadgeFilterCategory] = useState<'all' | 'hierarchy' | 'special' | 'social' | 'vip' | 'general'>('all');
  const [badgeSearchQuery, setBadgeSearchQuery] = useState('');
  const [badgeViewMode, setBadgeViewMode] = useState<'list' | 'grid'>('list');
  const [savingBadges, setSavingBadges] = useState(false);

  const openBadgeManager = (user: UserProfile) => {
    setBadgeModalUser(user);
    setSelectedBadges(Array.isArray(user.badges) ? [...user.badges] : []);
    setCustomBadgeTextInput(user.customBadgeText || '');
    setBadgeFilterCategory('all');
    setBadgeSearchQuery('');
  };

  const handleToggleBadge = (badgeId: string) => {
    setSelectedBadges(prev => 
      prev.includes(badgeId) ? prev.filter(b => b !== badgeId) : [...prev, badgeId]
    );
  };

  const handleSetBadgeState = (badgeId: string, give: boolean) => {
    setSelectedBadges(prev => {
      if (give) {
        return prev.includes(badgeId) ? prev : [...prev, badgeId];
      } else {
        return prev.filter(b => b !== badgeId);
      }
    });
  };

  const handleSetOnlyBadge = (badgeId: string) => {
    setSelectedBadges([badgeId]);
  };

  const handleClearAllBadges = () => {
    setSelectedBadges([]);
  };

  const handleSaveBadges = async () => {
    if (!badgeModalUser) return;
    setSavingBadges(true);
    try {
      const res = await adminService.updateUserBadges(
        badgeModalUser.id,
        selectedBadges,
        customBadgeTextInput,
        token
      );
      showToast(res.message || "Insignias actualizadas con éxito", "success");
      setBadgeModalUser(null);
      onRefresh();
    } catch (err: any) {
      showToast(err.message || "Error al actualizar insignias", "error");
    } finally {
      setSavingBadges(false);
    }
  };

  // Forensic Cases State (Argentine Law Audit Dossiers)
  const [forensicCases, setForensicCases] = useState<ForensicCase[]>([]);
  const [loadingForensics, setLoadingForensics] = useState(false);
  const [selectedCaseModal, setSelectedCaseModal] = useState<ForensicCase | null>(null);
  const [forensicSearch, setForensicSearch] = useState('');

  // Threat Logs Filtering State
  const [threatSearch, setThreatSearch] = useState('');
  const [threatSeverityFilter, setThreatSeverityFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');

  const fetchForensics = async () => {
    setLoadingForensics(true);
    try {
      const data = await adminService.getForensicCases(token);
      setForensicCases(data || []);
    } catch (err: any) {
      console.error("Error fetching forensic cases:", err);
    } finally {
      setLoadingForensics(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'forensics') {
      fetchForensics();
    }
  }, [activeTab, token]);

  const handleDeleteForensicCase = async (caseId: string) => {
    try {
      const res = await adminService.deleteForensicCase(caseId, token);
      showToast(res.message || "Expediente eliminado correctamente", "success");
      fetchForensics();
    } catch (err: any) {
      showToast(err.message || "Error al eliminar expediente", "error");
    }
  };

  const downloadTranscriptFile = (item: ForensicCase) => {
    const blob = new Blob([item.fullTranscript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `EXPEDIENTE_FORENSE_${item.id}_${item.roomName.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Acta forense descargada correctamente", "success");
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
  const [userPremiumFilter, setUserPremiumFilter] = useState<'all' | 'cyber_elite' | 'premium' | 'free'>('all');

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
  const [editPlanTier, setEditPlanTier] = useState<PlanTier>('free');
  const [editPremiumDays, setEditPremiumDays] = useState(30);

  const openEditUser = (u: UserProfile) => {
    setEditingUser(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditRole(u.role);
    setEditStatus(u.status === 'Baneado' ? 'Baneado' : 'Activo');
    setEditIp(u.ip || '');
    const currentTier: PlanTier = u.planTier || (u.isPremium ? 'premium' : 'free');
    setEditPlanTier(currentTier);
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
      const expTimestamp = editPlanTier !== 'free' ? Date.now() + editPremiumDays * 24 * 60 * 60 * 1000 : undefined;
      const res = await adminService.editUser({
        userId: editingUser.id,
        name: editName,
        email: editEmail,
        role: editRole,
        status: editStatus,
        ip: editIp,
        isPremium: editPlanTier !== 'free',
        planTier: editPlanTier,
        premiumExpiresAt: expTimestamp
      }, token);
      showToast(res.message || "Usuario actualizado correctamente", "success");
      setEditingUser(null);
      onRefresh();
    } catch (err: any) {
      showToast(err.message || "Error al actualizar usuario", "error");
    }
  };

  // Direct Plan Tier Assign (Premium Tab & Quick Actions)
  const [quickPlanUserId, setQuickPlanUserId] = useState('');
  const [quickPlanTier, setQuickPlanTier] = useState<PlanTier>('cyber_elite');
  const [quickPlanDays, setQuickPlanDays] = useState(30);

  const handleDirectPlanAssign = async (userId: string, tier: PlanTier, days: number = 30) => {
    try {
      const res = await adminService.setUserPlan(userId, tier, days, token);
      showToast(res.message || "Plan actualizado correctamente", "success");
      onRefresh();
    } catch (err: any) {
      showToast(err.message || "Error al cambiar plan", "error");
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

  // Banned IPs State
  const [bannedIpsList, setBannedIpsList] = useState<BannedIpDetail[]>([]);
  const [loadingBannedIps, setLoadingBannedIps] = useState(false);
  const [bannedIpSearch, setBannedIpSearch] = useState('');
  const [bannedSeverityFilter, setBannedSeverityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');

  // IP Ban Form State
  const [banIpInput, setBanIpInput] = useState('');
  const [banReasonInput, setBanReasonInput] = useState('');
  const [banSeverityInput, setBanSeverityInput] = useState<'low' | 'medium' | 'high' | 'critical'>('high');
  const [banEvidenceInput, setBanEvidenceInput] = useState('');

  const fetchBannedIps = async () => {
    setLoadingBannedIps(true);
    try {
      const data = await adminService.getBannedIps(token);
      setBannedIpsList(data || []);
    } catch (err: any) {
      console.error("Error fetching banned IPs:", err);
    } finally {
      setLoadingBannedIps(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'threats') {
      fetchBannedIps();
    }
  }, [activeTab, token]);

  const handleManualBanIp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!banIpInput.trim()) return;
    try {
      const res = await adminService.banIp({
        ip: banIpInput.trim(),
        reason: banReasonInput || "Sanción manual de Administrador",
        severity: banSeverityInput,
        evidence: banEvidenceInput || "Bloqueo manual en Dashboard"
      }, token);
      showToast(res.message || `IP ${banIpInput} baneada`, "success");
      setBanIpInput(''); setBanReasonInput(''); setBanEvidenceInput('');
      fetchBannedIps();
      onRefresh();
    } catch (err: any) {
      showToast(err.message || "Error al banear IP", "error");
    }
  };

  const handleUnbanIp = async (ip: string) => {
    try {
      const res = await adminService.unbanIp({ ip }, token);
      showToast(res.message || `IP ${ip} desbaneada`, "success");
      fetchBannedIps();
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

  const filteredForensics = forensicCases.filter(c => {
    const s = forensicSearch.toLowerCase();
    return c.id.toLowerCase().includes(s) ||
           c.roomName.toLowerCase().includes(s) ||
           c.offenderEmail.toLowerCase().includes(s) ||
           c.offenderName.toLowerCase().includes(s) ||
           c.violationSummary.toLowerCase().includes(s);
  });

  const filteredThreats = threats.filter(t => {
    const s = threatSearch.toLowerCase();
    const matchesSearch = !s || 
      (t.ip && t.ip.toLowerCase().includes(s)) ||
      (t.threatType && t.threatType.toLowerCase().includes(s)) ||
      (t.reason && t.reason.toLowerCase().includes(s)) ||
      (t.evidence && t.evidence.toLowerCase().includes(s));

    const matchesSeverity = threatSeverityFilter === 'all' || 
      (threatSeverityFilter === 'critical' && (t.severity === 'critical' || t.severity === 'high')) ||
      (threatSeverityFilter === 'high' && (t.severity === 'high' || t.severity === 'critical')) ||
      (threatSeverityFilter === 'medium' && t.severity === 'medium') ||
      (threatSeverityFilter === 'low' && t.severity === 'low') ||
      t.severity === threatSeverityFilter;

    return matchesSearch && matchesSeverity;
  });

  // Navigation Items
  const navItems: { id: TabType; label: string; icon: any; badge?: number }[] = [
    { id: 'overview', label: 'Métricas & Telemetría', icon: Activity },
    { id: 'ws_monitor', label: 'Monitor WS (Tiempo Real)', icon: Radar },
    { id: 'users', label: 'Gestión de Usuarios', icon: Users, badge: users.length },
    { id: 'rooms', label: 'Salas & Espacios', icon: MessageSquare, badge: roomsList.length },
    { id: 'forensics', label: 'Expedientes Forenses Ley Arg', icon: Scale, badge: forensicCases.length },
    { id: 'threats', label: 'Amenazas & IP Ban', icon: ShieldAlert, badge: threats.filter(t => t.blocked).length },
    { id: 'logs', label: 'Auditoría & Logs', icon: Terminal, badge: logs.length },
    { id: 'ai_assistant', label: 'Aether AI Guard', icon: Sparkles },
    { id: 'premium', label: 'Planes Premium', icon: Crown },
    { id: 'mongodb', label: 'Estado MongoDB', icon: Database },
    { id: 'smtp', label: 'Config SMTP', icon: Mail }
  ];

  return (
    <div className="fixed inset-0 z-50 flex bg-slate-950/95 text-slate-100 backdrop-blur-xl overflow-hidden font-sans w-full max-w-full overflow-x-hidden">
      
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
        <main 
          style={{ width: '100vw', maxWidth: '100vw', overflowX: 'hidden' }}
          className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-8 space-y-6 w-full max-w-full"
        >

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

          {/* TAB: WEBSOCKET REAL-TIME SECURITY MONITOR */}
          {activeTab === 'ws_monitor' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <SecurityMonitor 
                token={token} 
                onNotify={(msg, type) => showToast(msg, type === 'alert' ? 'error' : type)} 
                accentColor={accentColor}
              />
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
                        <th className="p-4">Insignias</th>
                        <th className="p-4">Estado</th>
                        <th className="p-4 text-right">Acciones CRUD</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-xs">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">
                            No se encontraron usuarios coincidentes.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u, idx) => (
                          <tr key={u.id ? `${u.id}-${idx}` : `usr-${idx}`} className="hover:bg-slate-800/30 transition-colors">
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
                              {u.planTier === 'cyber_elite'  ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                  <Zap className="w-3 h-3 text-cyan-400" />
                                  <span>CYBER ELITE</span>
                                </span>
                              ) : u.isPremium || u.planTier === 'premium' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  <Crown className="w-3 h-3 text-amber-400" />
                                  <span>PREMIUM</span>
                                </span>
                              ) : (
                                <span className="text-slate-500 text-[11px]">Estándar</span>
                              )}
                            </td>

                            {/* Badges Column */}
                            <td className="p-4">
                              <div className="flex flex-wrap items-center gap-1 max-w-[220px]">
                                {Array.isArray(u.badges) && u.badges.length > 0 ? (
                                  <UserBadgeList 
                                    badges={u.badges} 
                                    customBadgeText={u.customBadgeText} 
                                    size="xs" 
                                    maxDisplay={4}
                                  />
                                ) : (
                                  <span className="text-slate-600 text-[11px] italic">Sin insignias</span>
                                )}
                              </div>
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
                                {/* Badges Manager Button */}
                                <button
                                  onClick={() => openBadgeManager(u)}
                                  title="Gestionar Insignias Oficiales"
                                  className="p-1.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 transition-all flex items-center gap-1"
                                >
                                  <Award className="w-3.5 h-3.5 text-purple-400" />
                                  <span className="hidden xl:inline text-[10px] font-bold">Insignias</span>
                                </button>

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
                  filteredRooms.map((r, idx) => {
                    const mode = r.accessMode || (r.isClosed ? 'closed' : (r.isPrivate ? 'open' : 'global'));
                    return (
                      <div key={r.id ? `${r.id}-${idx}` : `room-${idx}`} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all space-y-4 shadow-lg flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-extrabold text-white text-base">{r.name}</h3>
                              <div className="text-xs text-indigo-400 font-mono mt-0.5 flex items-center gap-1.5">
                                <span>Código: #{r.code}</span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(r.code);
                                    showToast(`Código #${r.code} copiado`, 'info');
                                  }}
                                  className="text-slate-500 hover:text-slate-300 transition-colors"
                                  title="Copiar Código"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${
                              mode === 'closed' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                              mode === 'open' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                              'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}>
                              {mode === 'closed' ? '🔒 Cerrada' : mode === 'open' ? '🔑 Abierta' : '🌐 Global'}
                            </span>
                          </div>

                          {r.description && (
                            <p className="text-slate-400 text-xs italic bg-slate-950/40 p-2 rounded-xl border border-slate-800/60">
                              "{r.description}"
                            </p>
                          )}

                          <div className="text-xs text-slate-400 space-y-1.5 bg-slate-950/30 p-3 rounded-xl border border-slate-800/40">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Creador:</span>
                              <span className="text-slate-200 font-semibold">{r.createdByName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Usuarios Activos:</span>
                              <span className="text-emerald-400 font-bold font-mono">{r.activeUsersCount ?? 0} conectados</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Mensajes Guardados:</span>
                              <span className="text-cyan-400 font-mono font-bold">{r.messageCount ?? 0}</span>
                            </div>
                          </div>

                          {/* Quick Mode Changer */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-500">Cambiar Modalidad de Sala:</label>
                            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                              <button
                                onClick={async () => {
                                  try {
                                    const res = await roomService.updateAccessMode(r.id, 'global', token);
                                    showToast(res.message || "Modo cambiado a Global", "success");
                                    fetchRooms();
                                  } catch (err: any) {
                                    showToast(err.message, "error");
                                  }
                                }}
                                className={`py-1 rounded-lg text-[10px] font-bold transition-all ${
                                  mode === 'global' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                🌐 Global
                              </button>

                              <button
                                onClick={async () => {
                                  try {
                                    const res = await roomService.updateAccessMode(r.id, 'open', token);
                                    showToast(res.message || "Modo cambiado a Abierta", "success");
                                    fetchRooms();
                                  } catch (err: any) {
                                    showToast(err.message, "error");
                                  }
                                }}
                                className={`py-1 rounded-lg text-[10px] font-bold transition-all ${
                                  mode === 'open' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                🔑 Abierta
                              </button>

                              <button
                                onClick={async () => {
                                  try {
                                    const res = await roomService.updateAccessMode(r.id, 'closed', token);
                                    showToast(res.message || "Modo cambiado a Cerrada", "success");
                                    fetchRooms();
                                  } catch (err: any) {
                                    showToast(err.message, "error");
                                  }
                                }}
                                className={`py-1 rounded-lg text-[10px] font-bold transition-all ${
                                  mode === 'closed' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                🔒 Cerrada
                              </button>
                            </div>
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
                    );
                  })
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                      Firewall & Listado de IPs Bloqueadas
                    </h2>
                    <p className="text-slate-400 text-xs sm:text-sm">
                      Gestión manual y automatizada de sanciones IP, WAF heurístico y lista negra.
                    </p>
                  </div>
                </div>

                <button 
                  onClick={fetchBannedIps}
                  disabled={loadingBannedIps}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 self-start sm:self-auto border border-slate-700/50 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingBannedIps ? 'animate-spin' : ''}`} />
                  <span>Actualizar Lista</span>
                </button>
              </div>

              {/* Firewall Summary Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                    <Ban className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">IPs Bloqueadas</div>
                    <div className="text-xl font-black text-white font-mono">{bannedIpsList.length}</div>
                  </div>
                </div>

                <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Amenazas WAF</div>
                    <div className="text-xl font-black text-white font-mono">{threats.length}</div>
                  </div>
                </div>

                <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Estado Firewall</div>
                    <div className="text-xs font-black text-emerald-400 flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      Protección Activa
                    </div>
                  </div>
                </div>
              </div>

              {/* Manual IP Ban Form */}
              <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
                <div className="flex items-center gap-2">
                  <Ban className="w-4 h-4 text-rose-400" />
                  <h3 className="text-xs font-extrabold uppercase text-slate-200 tracking-wider">
                    Bloquear Nueva Dirección IP (Manual)
                  </h3>
                </div>
                <form onSubmit={handleManualBanIp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Dirección IP</label>
                    <input 
                      type="text"
                      placeholder="Ej. 192.168.1.100..."
                      value={banIpInput}
                      onChange={e => setBanIpInput(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:border-rose-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Nivel de Severidad</label>
                    <select
                      value={banSeverityInput}
                      onChange={e => setBanSeverityInput(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-rose-500 outline-none"
                    >
                      <option value="low">🟢 Baja</option>
                      <option value="medium">🟡 Media</option>
                      <option value="high">🔴 Alta</option>
                      <option value="critical">🟣 Crítica</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Motivo / Razón</label>
                    <input 
                      type="text"
                      placeholder="Ej. Spam, Intento de ataque..."
                      value={banReasonInput}
                      onChange={e => setBanReasonInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:border-rose-500 outline-none"
                    />
                  </div>

                  <div className="flex items-end">
                    <button 
                      type="submit"
                      className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-rose-950/40"
                    >
                      <Ban className="w-4 h-4" />
                      <span>Sancionar IP</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Banned IPs List Table */}
              <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden shadow-xl space-y-4 p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-black text-white">Listado Activo de IPs Bloqueadas ({bannedIpsList.length})</h3>
                  </div>

                  {/* Filters */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative min-w-[200px]">
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                      <input 
                        type="text"
                        placeholder="Buscar IP o motivo..."
                        value={bannedIpSearch}
                        onChange={e => setBannedIpSearch(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 outline-none"
                      />
                    </div>

                    <select
                      value={bannedSeverityFilter}
                      onChange={e => setBannedSeverityFilter(e.target.value as any)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:border-cyan-500 outline-none"
                    >
                      <option value="all">Todas las Severidades</option>
                      <option value="critical">Crítica</option>
                      <option value="high">Alta</option>
                      <option value="medium">Media</option>
                      <option value="low">Baja</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b border-slate-800 text-[10px] font-extrabold uppercase text-slate-400 bg-slate-950/50">
                        <th className="p-3">Dirección IP</th>
                        <th className="p-3">Severidad</th>
                        <th className="p-3">Origen / Sancionador</th>
                        <th className="p-3">Motivo / Razon</th>
                        <th className="p-3">Fecha de Bloqueo</th>
                        <th className="p-3 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-xs">
                      {bannedIpsList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">
                            No hay direcciones IP bloqueadas actualmente en el sistema.
                          </td>
                        </tr>
                      ) : (
                        bannedIpsList
                          .filter(b => {
                            const matchesSearch = !bannedIpSearch || 
                              b.ip.toLowerCase().includes(bannedIpSearch.toLowerCase()) || 
                              (b.reason && b.reason.toLowerCase().includes(bannedIpSearch.toLowerCase())) ||
                              (b.bannedBy && b.bannedBy.toLowerCase().includes(bannedIpSearch.toLowerCase()));
                            const matchesSeverity = bannedSeverityFilter === 'all' || b.severity === bannedSeverityFilter;
                            return matchesSearch && matchesSeverity;
                          })
                          .map((b, idx) => (
                            <tr key={b.id ? `${b.id}-${idx}` : `banned-${b.ip}-${idx}`} className="hover:bg-slate-800/30 transition-colors">
                              <td className="p-3 font-mono font-bold text-rose-300 flex items-center gap-2">
                                <Ban className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                <span>{b.ip}</span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(b.ip);
                                    showToast(`IP ${b.ip} copiada al portapapeles`, 'info');
                                  }}
                                  className="text-slate-500 hover:text-slate-300 transition-colors p-0.5"
                                  title="Copiar IP"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </td>

                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  b.severity === 'critical' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                                  b.severity === 'high' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                                  b.severity === 'medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                  'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                }`}>
                                  {b.severity || 'alta'}
                                </span>
                              </td>

                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-medium border border-slate-700/50">
                                  {b.bannedBy || 'Sistema WAF'}
                                </span>
                              </td>

                              <td className="p-3 text-slate-300 text-[11px] max-w-xs truncate" title={b.reason}>
                                {b.reason || 'Sin razón especificada'}
                              </td>

                              <td className="p-3 text-slate-400 font-mono text-[11px]">
                                {new Date(b.timestamp).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                              </td>

                              <td className="p-3 text-right">
                                <button 
                                  onClick={() => handleUnbanIp(b.ip)}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold transition-all flex items-center gap-1 ml-auto"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Desbloquear IP</span>
                                </button>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Threat Logs List (WAF Auto Detections) */}
              <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden shadow-xl space-y-4 p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <Radar className="w-4 h-4 text-amber-400" />
                      <span>Registro de Detecciones WAF ({filteredThreats.length} / {threats.length})</span>
                    </h3>
                    <p className="text-slate-400 text-xs mt-0.5">Alertas automáticas generadas por el motor de detección de amenazas.</p>
                  </div>

                  {/* Search & Severity Filter Selectors */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                      <input 
                        type="text"
                        placeholder="Buscar IP, razón o tipo..."
                        value={threatSearch}
                        onChange={e => setThreatSearch(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 outline-none w-48 sm:w-60"
                      />
                    </div>

                    <select
                      value={threatSeverityFilter}
                      onChange={e => setThreatSeverityFilter(e.target.value as any)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-amber-400 font-bold outline-none focus:border-amber-500"
                    >
                      <option value="all">🛡️ Todas las Severidades</option>
                      <option value="critical">🚨 Crítica / Alta (Critical/High)</option>
                      <option value="high">🔥 Alta (High)</option>
                      <option value="medium">⚠️ Media (Medium)</option>
                      <option value="low">ℹ️ Baja (Low)</option>
                    </select>

                    {(threatSearch || threatSeverityFilter !== 'all') && (
                      <button 
                        onClick={() => { setThreatSearch(''); setThreatSeverityFilter('all'); }}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold transition-all"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[650px]">
                    <thead>
                      <tr className="border-b border-slate-800 text-[10px] font-extrabold uppercase text-slate-400 bg-slate-950/50">
                        <th className="p-3">IP Origen</th>
                        <th className="p-3">Amenaza</th>
                        <th className="p-3">Gravedad</th>
                        <th className="p-3">Detalle / Razón</th>
                        <th className="p-3 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-xs">
                      {filteredThreats.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-slate-500 font-medium">No se registran amenazas que coincidan con los filtros aplicados.</td>
                        </tr>
                      ) : (
                        filteredThreats.map((t, idx) => (
                          <tr key={t.id ? `${t.id}-${idx}` : `threat-${t.ip}-${idx}`} className="hover:bg-slate-800/30 transition-colors">
                            <td className="p-3 font-mono text-cyan-400">{t.ip}</td>
                            <td className="p-3 font-semibold text-white">{t.threatType}</td>
                            <td className="p-3">
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                                t.severity === 'critical' ? 'bg-rose-600/30 text-rose-300 border border-rose-500/40 animate-pulse' :
                                t.severity === 'high' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                                t.severity === 'medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}>
                                {t.severity === 'critical' ? '🚨 CRÍTICA' : t.severity === 'high' ? '🔥 ALTA' : t.severity === 'medium' ? '⚠️ MEDIA' : 'ℹ️ BAJA'}
                              </span>
                            </td>
                            <td className="p-3 text-slate-300 text-[11px] max-w-xs truncate">{t.reason}</td>
                            <td className="p-3 text-right">
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

          {/* TAB 4.5: FORENSIC DOSSIERS (ARGENTINE PENAL LAW AUDIT) */}
          {activeTab === 'forensics' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                    <Scale className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-2">
                      <span>Expedientes Forenses (Ley Argentina)</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                        {forensicCases.length} Incautaciones
                      </span>
                    </h2>
                    <p className="text-slate-400 text-xs sm:text-sm">
                      Salas clausuradas e incautadas automáticamente por violaciones al Código Penal de la República Argentina.
                    </p>
                  </div>
                </div>

                <button 
                  onClick={fetchForensics}
                  disabled={loadingForensics}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 text-xs font-extrabold flex items-center gap-2 shadow-lg transition-all self-start sm:self-auto"
                >
                  <RefreshCw className={`w-4 h-4 text-amber-400 ${loadingForensics ? 'animate-spin' : ''}`} />
                  <span>Actualizar Expedientes</span>
                </button>
              </div>

              {/* Search input */}
              <div className="relative max-w-md">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input 
                  type="text"
                  placeholder="Buscar por ID de expediente, sala, infractor o artículo..."
                  value={forensicSearch}
                  onChange={e => setForensicSearch(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 outline-none"
                />
              </div>

              {/* Grid of Forensic Case Dossiers */}
              {loadingForensics ? (
                <div className="p-12 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
                  Cargando expedientes judicializados...
                </div>
              ) : filteredForensics.length === 0 ? (
                <div className="p-12 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800 space-y-2">
                  <FileCheck className="w-10 h-10 text-slate-600 mx-auto" />
                  <div className="text-sm font-bold text-slate-400">Sin expedientes forenses registrados</div>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Cuando el WAF detecte contenido penal e incaute una sala, el acta completa de la transcripción se guardará aquí de forma permanente.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredForensics.map((item, idx) => (
                    <div 
                      key={item.id ? `${item.id}-${idx}` : `forensic-${idx}`} 
                      className="bg-slate-900/80 border border-amber-500/20 hover:border-amber-500/40 rounded-2xl p-5 space-y-4 shadow-xl transition-all relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-black uppercase border border-rose-500/30">
                              INCAUTADA Y BANEADA
                            </span>
                            <span className="text-[11px] font-mono text-slate-400">
                              ID: {item.id}
                            </span>
                          </div>
                          <h3 className="text-base font-black text-white mt-1 flex items-center gap-2">
                            <Gavel className="w-4 h-4 text-amber-400 shrink-0" />
                            <span>{item.roomName}</span>
                          </h3>
                        </div>

                        <button 
                          onClick={() => handleDeleteForensicCase(item.id)}
                          className="p-2 rounded-xl bg-slate-950/60 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/30 transition-all"
                          title="Eliminar Expediente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Legal Articles Pills */}
                      <div className="flex flex-wrap gap-1.5">
                        {item.lawArticles && item.lawArticles.map((art, idx) => (
                          <span key={idx} className="px-2.5 py-1 rounded-lg bg-amber-950/50 border border-amber-500/30 text-amber-300 text-[11px] font-extrabold flex items-center gap-1">
                            <Scale className="w-3 h-3 text-amber-400" />
                            <span>{art}</span>
                          </span>
                        ))}
                      </div>

                      {/* Infractor Info */}
                      <div className="bg-slate-950/70 rounded-xl p-3 border border-slate-800/80 space-y-1.5 text-xs">
                        <div className="flex justify-between text-slate-400">
                          <span className="font-bold">Infractor Identificado:</span>
                          <span className="text-rose-400 font-mono font-bold">{item.offenderName} ({item.offenderEmail})</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span className="font-bold">IP Origen Sancionada:</span>
                          <span className="text-cyan-400 font-mono">{item.offenderIp}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span className="font-bold">Participantes Expulsados:</span>
                          <span className="text-amber-300 font-bold">{item.usersExpelledCount || 0} usuarios</span>
                        </div>
                      </div>

                      {/* Evidence Snippet */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold uppercase text-slate-400">Motivo / Evidencia Flagrante</label>
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-rose-300 font-mono truncate">
                          {item.violationSummary}: "{item.evidenceSnippet}"
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                        <button 
                          onClick={() => setSelectedCaseModal(item)}
                          className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-extrabold text-xs shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          <span>Ver Acta Completa</span>
                        </button>
                        <button 
                          onClick={() => downloadTranscriptFile(item)}
                          className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs transition-all flex items-center justify-center gap-1.5"
                          title="Descargar (.txt)"
                        >
                          <Download className="w-4 h-4 text-cyan-400" />
                          <span className="hidden sm:inline">Descargar</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                        logs.map((l, idx) => (
                          <tr key={l.id ? `${l.id}-${idx}` : `log-${idx}`} className="hover:bg-slate-800/30 transition-colors">
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
                  <h2 className="text-2xl font-black text-white">Planes & Suscripciones VIP / Cyber Elite</h2>
                  <p className="text-slate-400 text-xs sm:text-sm">Otorgar o modificar planes de usuario directamente con facturación activada.</p>
                </div>
              </div>

              {/* Quick Direct Plan Assigner */}
              <div className="bg-slate-900/80 p-6 rounded-2xl border border-amber-500/30 space-y-4 shadow-xl">
                <h3 className="text-xs font-black uppercase text-amber-300 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Asignación Directa Inmediata de Plan</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Seleccionar Usuario</label>
                    <select 
                      value={quickPlanUserId}
                      onChange={e => setQuickPlanUserId(e.target.value)}
                      className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                    >
                      <option value="">-- Seleccionar Usuario --</option>
                      {users.map((u, idx) => {
                        const isCyber = u.planTier === 'cyber_elite' ;
                        const tierDisplay = isCyber ? 'cyber_elite' : (u.planTier || (u.isPremium ? 'premium' : 'free'));
                        return (
                          <option key={u.id ? `${u.id}-${idx}` : `opt-${idx}`} value={u.id}>
                            {u.name} ({u.email}) - [{tierDisplay.toUpperCase()}]
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Nivel de Plan</label>
                    <select 
                      value={quickPlanTier}
                      onChange={e => setQuickPlanTier(e.target.value as any)}
                      className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-300 font-extrabold outline-none focus:border-amber-500"
                    >
                      <option value="cyber_elite">⚡ Cyber Elite Ultra (VIP Total)</option>
                      <option value="premium">👑 Aether Premium VIP</option>
                      <option value="free">🛡️ Básico / Gratuito</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Duración (Días)</label>
                    <input 
                      type="number"
                      value={quickPlanDays}
                      onChange={e => setQuickPlanDays(Number(e.target.value))}
                      min={1}
                      className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <button 
                  onClick={() => {
                    if (!quickPlanUserId) {
                      showToast("Por favor selecciona un usuario", "error");
                      return;
                    }
                    handleDirectPlanAssign(quickPlanUserId, quickPlanTier, quickPlanDays);
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 hover:from-amber-500 hover:to-orange-500 text-white font-extrabold text-xs shadow-lg shadow-amber-950/40 transition-all flex items-center justify-center gap-2"
                >
                  <Award className="w-4 h-4" />
                  <span>Aplicar Cambio de Plan & Notificar por Correo</span>
                </button>
              </div>

              {/* Premium List */}
              <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-xs font-bold uppercase text-slate-400">Usuarios Premium & Cyber Elite Actuales</h3>
                <div className="space-y-2">
                  {users.filter(u => u.isPremium || u.planTier === 'cyber_elite' || u.planTier === 'premium' ).length === 0 ? (
                    <div className="p-4 text-center text-slate-500 text-xs">No hay usuarios con plan VIP / Cyber Elite activo.</div>
                  ) : (
                    users.filter(u => u.isPremium || u.planTier === 'cyber_elite' || u.planTier === 'premium' ).map((u, idx) => {
                      const isCyber = u.planTier === 'cyber_elite' ;
                      return (
                        <div key={u.id ? `${u.id}-${idx}` : `prem-${idx}`} className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                          <div className="flex items-center gap-3">
                            {isCyber ? (
                              <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
                            ) : (
                              <Crown className="w-4 h-4 text-amber-400" />
                            )}
                            <div>
                              <div className="text-xs font-bold text-white flex items-center gap-2">
                                <span>{u.name}</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                  isCyber ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                }`}>
                                  {isCyber ? '⚡ Cyber Elite Ultra' : '👑 Premium VIP'}
                                </span>
                              </div>
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
                      );
                    })
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
                  <div>
                    <label className="text-xs font-bold text-amber-300 flex items-center gap-2">
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span>Plan & Suscripción VIP</span>
                    </label>
                    <select 
                      value={editPlanTier}
                      onChange={e => setEditPlanTier(e.target.value as PlanTier)}
                      className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-amber-300 outline-none"
                    >
                      <option value="free">🛡️ Básico / Gratuito</option>
                      <option value="premium">👑 Aether Premium VIP</option>
                      <option value="cyber_elite">⚡ Cyber Elite Ultra (Total)</option>
                    </select>
                  </div>

                  {editPlanTier !== 'free' && (
                    <div>
                      <label className="text-[11px] font-semibold text-slate-400">Días de Duración del Plan</label>
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

                {/* Quick Link to Badge Selector */}
                {editingUser && (
                  <div className="pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        const target = editingUser;
                        setEditingUser(null);
                        openBadgeManager(target);
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/30 text-purple-300 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Award className="w-4 h-4 text-purple-400" />
                      <span>Elegir e Insignias de este Usuario (Selector SÍ / NO)</span>
                    </button>
                  </div>
                )}

                <div className="pt-2 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setEditingUser(null)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer"
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

      {/* MODAL: FORENSIC CASE FULL TRANSCRIPT DOSSIER */}
      <AnimatePresence>
        {selectedCaseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-amber-500/40 rounded-2xl p-6 w-full max-w-3xl space-y-4 shadow-2xl text-slate-100 max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-white">Acta Forense Judicial - {selectedCaseModal.roomName}</h3>
                    <p className="text-xs text-slate-400">ID Expediente: {selectedCaseModal.id}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedCaseModal(null)} className="hover:opacity-75">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Legal Articles */}
              <div className="flex flex-wrap gap-1.5 shrink-0">
                {selectedCaseModal.lawArticles && selectedCaseModal.lawArticles.map((art, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-bold">
                    ⚖️ {art}
                  </span>
                ))}
              </div>

              {/* Full Transcript Scrollable Terminal Box */}
              <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-y-auto font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed select-text">
                {selectedCaseModal.fullTranscript}
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800 shrink-0">
                <button 
                  onClick={() => downloadTranscriptFile(selectedCaseModal)}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Expediente (.txt)</span>
                </button>
                <button 
                  onClick={() => setSelectedCaseModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: ADVANCED BADGE MANAGER (Asignación Múltiple de Insignias Adaptativa para Cualquier Dispositivo) */}
      <AnimatePresence>
        {badgeModalUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              className="bg-slate-900 border border-purple-500/30 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 w-full max-w-4xl shadow-2xl text-slate-100 max-h-[94vh] sm:max-h-[90vh] flex flex-col space-y-3 sm:space-y-4 my-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-800/80 shrink-0">
                <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white font-extrabold text-base sm:text-lg shadow-lg shadow-purple-500/25 shrink-0">
                    <Award className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-pulse" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-sm sm:text-lg text-white truncate">
                        Selector de Insignias
                      </h3>
                      <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono border border-purple-500/30 shrink-0">
                        {selectedBadges.length} de {BADGE_ORDER.length}
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                      Usuario: <strong className="text-white font-bold">{badgeModalUser.name}</strong> ({badgeModalUser.email})
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setBadgeModalUser(null)} 
                  className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0 ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Summary & Quick Counts */}
              <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 border border-purple-500/30 shrink-0 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0 hidden xs:block">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-[11px] sm:text-xs text-slate-300 truncate">
                    Elige individualmente tocando cualquier insignia:
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg sm:rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] sm:text-xs font-bold flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                    <span>{selectedBadges.length} SÍ</span>
                  </div>
                  <div className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg sm:rounded-xl bg-slate-800/80 border border-slate-700 text-slate-400 text-[11px] sm:text-xs font-bold flex items-center gap-1">
                    <X className="w-3 h-3 text-slate-500" />
                    <span>{BADGE_ORDER.length - selectedBadges.length} NO</span>
                  </div>
                </div>
              </div>

              {/* Live Preview Bar */}
              <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-950 border border-slate-800 shrink-0 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] sm:text-[11px]">
                  <span className="uppercase tracking-wider font-extrabold text-purple-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    Vista Previa en Vivo:
                  </span>
                  <span className="text-slate-500 font-mono hidden xs:inline">
                    {selectedBadges.length === 0 ? 'Sin insignias activas' : `${selectedBadges.length} asignadas`}
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 p-2 sm:p-2.5 bg-slate-900/90 rounded-xl border border-slate-800/80 max-h-20 overflow-y-auto">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="w-6 h-6 rounded-lg bg-purple-600/30 border border-purple-500/40 flex items-center justify-center font-bold text-[10px] text-purple-200">
                      {badgeModalUser.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-bold text-xs text-white">{badgeModalUser.name}</span>
                  </div>
                  <div className="h-4 w-px bg-slate-800 hidden sm:block" />
                  <div className="flex flex-wrap items-center gap-1 flex-1">
                    {selectedBadges.length > 0 ? (
                      <UserBadgeList 
                        badges={selectedBadges} 
                        customBadgeText={customBadgeTextInput} 
                        size="sm" 
                      />
                    ) : (
                      <span className="text-[11px] text-slate-500 italic">
                        (Ninguna insignia seleccionada)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Search, Filter Tabs & View Mode (Adaptive Controls) */}
              <div className="space-y-2 shrink-0">
                {/* Search Bar + View Toggle + Clear */}
                <div className="flex items-center justify-between gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                    <input 
                      type="text"
                      placeholder="Buscar insignia (Donador, Staff, TikTok, VIP, Owner...)"
                      value={badgeSearchQuery}
                      onChange={e => setBadgeSearchQuery(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-7 py-1.5 sm:py-2 text-xs text-white placeholder-slate-500 focus:border-purple-500 outline-none"
                    />
                    {badgeSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setBadgeSearchQuery('')}
                        className="absolute right-2 top-2 text-slate-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* View Mode (List vs Grid) */}
                  <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800 shrink-0">
                    <button
                      type="button"
                      onClick={() => setBadgeViewMode('list')}
                      className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        badgeViewMode === 'list'
                          ? 'bg-purple-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="Vista en Lista Detallada"
                    >
                      <List className="w-3.5 h-3.5" />
                      <span className="hidden md:inline text-[11px]">Lista</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBadgeViewMode('grid')}
                      className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        badgeViewMode === 'grid'
                          ? 'bg-purple-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="Vista en Cuadrícula Compacta"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span className="hidden md:inline text-[11px]">Cuadrícula</span>
                    </button>
                  </div>

                  {/* Clear button */}
                  <button
                    type="button"
                    onClick={handleClearAllBadges}
                    disabled={selectedBadges.length === 0}
                    className="px-2.5 py-1.5 sm:py-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 disabled:opacity-40 disabled:pointer-events-none"
                    title="Desmarcar todas las insignias"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span className="hidden sm:inline">Desmarcar</span>
                  </button>
                </div>

                {/* Category Horizontal Filter Bar (Scrollable on phones) */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                  {[
                    { id: 'all', label: `Todas (${BADGE_ORDER.length})` },
                    { id: 'hierarchy', label: '👑 Jerarquía & Staff' },
                    { id: 'social', label: '🌐 Redes Verificadas' },
                    { id: 'vip', label: '⚡ VIP & Cyber' },
                    { id: 'special', label: '✨ Especiales' },
                    { id: 'general', label: '🛡️ Base' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setBadgeFilterCategory(tab.id as any)}
                      className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap text-[11px] transition-all cursor-pointer shrink-0 ${
                        badgeFilterCategory === tab.id
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                          : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 border border-slate-800/80 hover:bg-slate-800/50'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Badges Container (Adaptive List or Responsive Grid) */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[420px] custom-scrollbar">
                {badgeViewMode === 'list' ? (
                  /* ================= LIST VIEW ================= */
                  <div className="space-y-2">
                    {BADGE_ORDER
                      .filter(badgeId => {
                        const def = BADGE_DEFINITIONS[badgeId];
                        if (!def) return false;
                        if (badgeFilterCategory !== 'all' && def.category !== badgeFilterCategory) return false;
                        if (badgeSearchQuery.trim()) {
                          const q = badgeSearchQuery.toLowerCase();
                          return def.name.toLowerCase().includes(q) || def.description.toLowerCase().includes(q) || def.id.toLowerCase().includes(q);
                        }
                        return true;
                      })
                      .map((badgeId, idx) => {
                        const def = BADGE_DEFINITIONS[badgeId];
                        const isSelected = selectedBadges.includes(badgeId);
                        const isCustomBadge = badgeId === 'custom';

                        return (
                          <div
                            key={badgeId}
                            onClick={() => handleToggleBadge(badgeId)}
                            className={`p-3 rounded-xl sm:rounded-2xl border transition-all select-none cursor-pointer flex flex-col gap-2 ${
                              isSelected
                                ? 'bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 border-purple-500/80 shadow-lg shadow-purple-500/10 ring-1 ring-purple-500/50'
                                : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/50'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2.5 sm:gap-3">
                              {/* Left: Number + Icon + Info */}
                              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                                <span className="w-5 text-center text-xs font-mono font-bold text-slate-500 shrink-0">
                                  #{idx + 1}
                                </span>

                                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                                  isSelected
                                    ? `${def.bgGradient} text-white ${def.glowColor} border-white/40 shadow-md`
                                    : 'bg-slate-900 border-slate-800 text-slate-500'
                                }`}>
                                  <BadgeIcon badgeId={badgeId} className="w-4 h-4 sm:w-5 sm:h-5" />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                    <span className={`font-extrabold text-xs sm:text-sm ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                                      {def.name}
                                    </span>
                                    <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.2 rounded-full bg-slate-900 border border-slate-800 text-slate-400 font-medium">
                                      {def.category === 'hierarchy' && '👑 Jerarquía'}
                                      {def.category === 'social' && '🌐 Red Social'}
                                      {def.category === 'vip' && '⚡ VIP'}
                                      {def.category === 'special' && '✨ Especial'}
                                      {def.category === 'general' && '🛡️ Base'}
                                    </span>
                                  </div>
                                  <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 line-clamp-1 sm:line-clamp-2">
                                    {def.description}
                                  </p>
                                </div>
                              </div>

                              {/* Right: Toggle Button */}
                              <div 
                                className="shrink-0"
                                onClick={e => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={() => handleToggleBadge(badgeId)}
                                  className={`px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer min-h-[36px] ${
                                    isSelected
                                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/25 ring-1 ring-emerald-400'
                                      : 'bg-slate-800 hover:bg-purple-600 hover:text-white text-slate-300 border border-slate-700'
                                  }`}
                                >
                                  {isSelected ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 stroke-[3] text-white" />
                                      <span>Añadida</span>
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="w-3.5 h-3.5" />
                                      <span>Añadir</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Inline Custom Text Field */}
                            {isCustomBadge && isSelected && (
                              <div 
                                className="mt-1 pt-2 border-t border-purple-500/30 flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
                                onClick={e => e.stopPropagation()}
                              >
                                <span className="text-[10px] sm:text-[11px] font-bold text-purple-300 shrink-0">
                                  Título Personalizado:
                                </span>
                                <input
                                  type="text"
                                  value={customBadgeTextInput}
                                  onChange={e => setCustomBadgeTextInput(e.target.value)}
                                  placeholder="Ej: Campeón, Desarrollador, VIP Supreme..."
                                  maxLength={40}
                                  className="flex-1 bg-slate-950 border border-purple-500/40 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-purple-400 outline-none"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  /* ================= GRID / COMPACT VIEW ================= */
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {BADGE_ORDER
                      .filter(badgeId => {
                        const def = BADGE_DEFINITIONS[badgeId];
                        if (!def) return false;
                        if (badgeFilterCategory !== 'all' && def.category !== badgeFilterCategory) return false;
                        if (badgeSearchQuery.trim()) {
                          const q = badgeSearchQuery.toLowerCase();
                          return def.name.toLowerCase().includes(q) || def.description.toLowerCase().includes(q) || def.id.toLowerCase().includes(q);
                        }
                        return true;
                      })
                      .map((badgeId, idx) => {
                        const def = BADGE_DEFINITIONS[badgeId];
                        const isSelected = selectedBadges.includes(badgeId);
                        const isCustomBadge = badgeId === 'custom';

                        return (
                          <div
                            key={badgeId}
                            onClick={() => handleToggleBadge(badgeId)}
                            className={`p-3 rounded-2xl border transition-all select-none cursor-pointer flex flex-col justify-between gap-2.5 ${
                              isSelected
                                ? 'bg-gradient-to-br from-slate-900 via-purple-950/30 to-slate-900 border-purple-500/80 shadow-lg shadow-purple-500/10 ring-1 ring-purple-500/50'
                                : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/50'
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                                isSelected
                                  ? `${def.bgGradient} text-white ${def.glowColor} border-white/40 shadow-md`
                                  : 'bg-slate-900 border-slate-800 text-slate-500'
                              }`}>
                                <BadgeIcon badgeId={badgeId} className="w-4 h-4" />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1">
                                  <span className={`font-extrabold text-xs truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                                    {def.name}
                                  </span>
                                  <span className="text-[9px] font-mono text-slate-500 shrink-0">
                                    #{idx + 1}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2 leading-tight">
                                  {def.description}
                                </p>
                              </div>
                            </div>

                            <div 
                              className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1.5"
                              onClick={e => e.stopPropagation()}
                            >
                              <span className="text-[10px] font-bold text-slate-500">
                                {isSelected ? (
                                  <span className="text-emerald-400 flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Activa
                                  </span>
                                ) : (
                                  'Inactiva'
                                )}
                              </span>

                              <button
                                type="button"
                                onClick={() => handleToggleBadge(badgeId)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer min-h-[30px] ${
                                  isSelected
                                    ? 'bg-emerald-500 text-white shadow'
                                    : 'bg-slate-800 hover:bg-purple-600 hover:text-white text-slate-300'
                                }`}
                              >
                                {isSelected ? 'Añadida' : '+ Añadir'}
                              </button>
                            </div>

                            {/* Inline Custom Text Field if active in grid view */}
                            {isCustomBadge && isSelected && (
                              <div 
                                className="pt-2 border-t border-purple-500/30"
                                onClick={e => e.stopPropagation()}
                              >
                                <input
                                  type="text"
                                  value={customBadgeTextInput}
                                  onChange={e => setCustomBadgeTextInput(e.target.value)}
                                  placeholder="Título personalizado..."
                                  maxLength={40}
                                  className="w-full bg-slate-950 border border-purple-500/40 rounded-xl px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:border-purple-400 outline-none"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}

                {/* Empty Search Fallback */}
                {BADGE_ORDER.filter(badgeId => {
                  const def = BADGE_DEFINITIONS[badgeId];
                  if (!def) return false;
                  if (badgeFilterCategory !== 'all' && def.category !== badgeFilterCategory) return false;
                  if (badgeSearchQuery.trim()) {
                    const q = badgeSearchQuery.toLowerCase();
                    return def.name.toLowerCase().includes(q) || def.description.toLowerCase().includes(q);
                  }
                  return true;
                }).length === 0 && (
                  <div className="p-6 text-center bg-slate-950/60 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                    No se encontraron insignias con el filtro seleccionado.
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex flex-col-reverse xs:flex-row items-stretch xs:items-center justify-between gap-2.5 pt-2.5 sm:pt-3 border-t border-slate-800/80 shrink-0">
                <button
                  type="button"
                  onClick={() => setBadgeModalUser(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer text-center"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleSaveBadges}
                  disabled={savingBadges}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {savingBadges ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>Guardar Insignias ({selectedBadges.length})</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
