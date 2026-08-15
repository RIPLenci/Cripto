import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Crown, CheckCircle2, Zap, Shield, Sparkles, ArrowRight,
  HelpCircle, Check, X, ShieldCheck, Cpu, Lock, Flame,
  FileText, Palette, Users, Bot, Layers, CheckSquare, ChevronDown,
  MessageSquare, Copy, ExternalLink
} from 'lucide-react';
import { UserProfile, CustomPreferences } from '../types';

interface PremiumScreenProps {
  currentUser: UserProfile | null;
  preferences: CustomPreferences;
  onBack: () => void;
  onUpgradeSuccess?: (updatedUser: UserProfile) => void;
  notify?: (msg: string, type: 'info' | 'success' | 'alert') => void;
}

const DISCORD_INVITE_URL = 'https://discord.gg/XdP84mBNWp';

export const PremiumScreen: React.FC<PremiumScreenProps> = ({
  currentUser,
  preferences,
  onBack,
  notify
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [selectedPlanModal, setSelectedPlanModal] = useState<'premium' | 'cyber_elite' | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [copiedTicketData, setCopiedTicketData] = useState(false);

  const currentTier = currentUser?.planTier || (currentUser?.isPremium ? 'premium' : 'free');

  const handleCopyTicketInfo = (planName: string) => {
    const text = `📋 SOLICITUD DE PLAN AETHER SECURITY\n- Plan: ${planName}\n- Ciclo: ${billingCycle === 'yearly' ? 'Anual' : 'Mensual'}\n- Correo: ${currentUser?.email || 'N/A'}\n- ID de Usuario: ${currentUser?.id || 'N/A'}\n- Nombre: ${currentUser?.name || 'N/A'}`;
    navigator.clipboard.writeText(text);
    setCopiedTicketData(true);
    notify?.('✓ Datos copiados al portapapeles. Pégalos en tu ticket de Discord.', 'success');
    setTimeout(() => setCopiedTicketData(false), 3000);
  };

  const handleOpenDiscord = () => {
    window.open(DISCORD_INVITE_URL, '_blank', 'noopener,noreferrer');
  };

  const faqs = [
    {
      q: '¿Cómo se solicita y activa el Plan Premium o Cyber Elite Ultra?',
      a: 'Por políticas de seguridad y validación de cuentas, los planes son activados exclusivamente por el equipo de Administración desde el Panel Central. Para solicitarlo, únete a nuestro servidor de Discord oficial (https://discord.gg/XdP84mBNWp) y crea un Ticket en el canal de soporte indicando tu ID de cuenta y correo.'
    },
    {
      q: '¿Qué diferencia hay entre el Plan Premium y Cyber Elite Ultra?',
      a: 'El Plan Premium desbloquea IA Cuántica sin esperas, 2 GB por archivo, salas protegidas y colores VIP. Cyber Elite Ultra añade auditoría forense con IA bajo la legislación vigente, salas dedicadas en nodos aislados, historial forense extendido y soporte prioritario directo de la administración.'
    },
    {
      q: '¿Cuánto tiempo tarda la activación una vez creado el Ticket?',
      a: 'La activación suele completarse en pocos minutos tras la confirmación en el ticket de Discord. El administrador asigna tu plan directamente en el sistema y tus privilegios se sincronizan en tiempo real sin que tengas que reiniciar tu cuenta.'
    },
    {
      q: '¿Puedo transferir o cambiar de plan más adelante?',
      a: 'Sí, a través del mismo sistema de Tickets en Discord puedes solicitar renovaciones, upgrades a Cyber Elite Ultra o ajustes de vigencia.'
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#030712] text-slate-100 relative min-h-0 select-none sm:select-auto font-sans scrollbar-thin scrollbar-thumb-slate-800">
      {/* Dynamic Ambient Aurora Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[10%] w-[500px] h-[500px] bg-amber-500/10 blur-[130px] rounded-full" />
        <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[10%] left-[-5%] w-[500px] h-[500px] bg-cyan-500/10 blur-[140px] rounded-full" />
      </div>

      {/* Top Floating Bar */}
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-2 transition-all active:scale-95 shadow-md cursor-pointer"
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
          <span>Volver al Panel</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenDiscord}
            className="px-3.5 py-1.5 rounded-xl bg-[#5865F2]/20 hover:bg-[#5865F2]/30 border border-[#5865F2]/40 text-[#9da6ff] hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Discord Oficial</span>
          </button>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Red Segura
          </span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-12 relative z-10 space-y-10">
        {/* HERO TITLE SECTION */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <Crown className="w-4 h-4 text-amber-400 animate-bounce" /> Catálogo de Planes & Membresías
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Niveles de Membresía y <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-200 drop-shadow-[0_0_25px_rgba(245,158,11,0.3)]">
              Protección Avanzada
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 font-medium leading-relaxed">
            Comunícate con privacidad absoluta, IA cuántica sin restricciones, salas protegidas y la insignia de estatus más exclusiva.
            <br className="hidden sm:inline" />
            <span className="text-amber-300/90 font-semibold"> Las activaciones se gestionan exclusivamente desde el Panel Admin previa solicitud por Ticket en Discord.</span>
          </p>

          {/* Billing Switcher */}
          <div className="pt-2 flex items-center justify-center">
            <div className="bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl flex items-center gap-1 shadow-2xl backdrop-blur-xl">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  billingCycle === 'monthly'
                    ? 'bg-slate-800 text-white shadow-lg'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Tarifa Mensual
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  billingCycle === 'yearly'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                    : 'text-amber-400 hover:text-amber-300'
                }`}
              >
                <span>Tarifa Anual</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-black/40 text-amber-200 font-bold">
                  -30% AHORRO
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* CURRENT USER STATUS BADGE */}
        <motion.div
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`p-6 rounded-3xl border-2 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 ${
            currentTier === 'cyber_elite'
              ? 'bg-gradient-to-r from-purple-900/40 via-purple-950/30 to-slate-900 border-purple-500/60 shadow-purple-500/10'
              : currentTier === 'premium'
              ? 'bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-slate-900 border-amber-500/50 shadow-amber-500/10'
              : 'bg-slate-900/80 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0 shadow-lg ${
              currentTier === 'cyber_elite'
                ? 'bg-purple-500/20 border-purple-500/40 text-purple-400'
                : currentTier === 'premium'
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}>
              {currentTier === 'cyber_elite' ? (
                <Zap className="w-8 h-8 animate-pulse" />
              ) : currentTier === 'premium' ? (
                <Crown className="w-8 h-8 animate-pulse" />
              ) : (
                <Shield className="w-7 h-7" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h3 className="text-lg font-black text-white">
                  {currentTier === 'cyber_elite'
                    ? 'Membresía Cyber Elite Ultra'
                    : currentTier === 'premium'
                    ? 'Membresía Plan Premium (Quantum Pro)'
                    : 'Plan Gratis / Estándar'}
                </h3>
                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                  currentTier === 'cyber_elite'
                    ? 'bg-purple-500 text-white'
                    : currentTier === 'premium'
                    ? 'bg-amber-500 text-black'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}>
                  {currentTier === 'cyber_elite' ? 'ULTRA ELITE' : currentTier === 'premium' ? 'VIP ACTIVO' : 'ESTÁNDAR'}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                {currentUser?.isPremium || currentTier !== 'free' ? (
                  <>
                    Vigencia activa hasta:{' '}
                    <span className="font-mono font-bold text-amber-300">
                      {currentUser?.premiumExpiresAt
                        ? new Date(currentUser.premiumExpiresAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
                        : 'Permanente'}
                    </span>
                  </>
                ) : (
                  'Actualmente estás utilizando la infraestructura estándar sin costo.'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenDiscord}
              className="text-xs text-[#9da6ff] hover:text-white font-bold px-4 py-2 rounded-xl bg-[#5865F2]/20 hover:bg-[#5865F2]/30 border border-[#5865F2]/40 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Abrir Ticket en Discord</span>
            </button>
          </div>
        </motion.div>

        {/* 3 PRICING TIERS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
          
          {/* TIER 1: PLAN GRATIS */}
          <div className={`rounded-3xl bg-slate-900/70 border p-6 sm:p-8 flex flex-col justify-between transition-all shadow-xl backdrop-blur-xl relative ${
            currentTier === 'free' ? 'border-slate-600 shadow-slate-900/50' : 'border-slate-800/80 hover:border-slate-700'
          }`}>
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 text-slate-300 text-[10px] font-bold uppercase tracking-wider mb-3">
                  <Users className="w-3.5 h-3.5" /> Acceso Estándar
                </div>
                <h3 className="text-xl font-black text-white">Plan Gratis</h3>
                <p className="text-xs text-slate-400 font-medium mt-1">Mensajería básica cifrada para uso personal.</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">$0</span>
                <span className="text-xs font-bold text-slate-500 uppercase">/ para siempre</span>
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-3">
                <p className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">Incluye:</p>
                <ul className="space-y-3 text-xs text-slate-300 font-medium">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Canal de comunicación seguro</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Salas globales y públicas</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>IA Aether Base con cuotas</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Envío de archivos hasta 25 MB</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Paleta de 6 colores estándar</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-slate-500">
                    <X className="w-4 h-4 text-slate-600 shrink-0" />
                    <span className="line-through">Insignia VIP Dorada</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-slate-500">
                    <X className="w-4 h-4 text-slate-600 shrink-0" />
                    <span className="line-through">Auditoría y Nodos Aislados</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-8">
              <button
                type="button"
                disabled
                className="w-full py-3.5 rounded-2xl bg-slate-800/60 text-slate-400 font-bold text-xs uppercase tracking-wider border border-slate-700/50 cursor-not-allowed text-center"
              >
                {currentTier === 'free' ? '✓ Plan Actual Activo' : 'Nivel Base'}
              </button>
            </div>
          </div>

          {/* TIER 2: PLAN PREMIUM (QUANTUM PRO) */}
          <div className="rounded-3xl bg-gradient-to-b from-amber-500/20 via-slate-900/90 to-slate-950 border-2 border-amber-500/60 p-6 sm:p-8 flex flex-col justify-between shadow-[0_0_40px_rgba(245,158,11,0.15)] relative backdrop-blur-2xl transform lg:-translate-y-2">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest shadow-lg flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Más Solicitado & Recomendado
            </div>

            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider mb-3">
                  <Crown className="w-3.5 h-3.5 text-amber-400" /> Nivel Quantum VIP
                </div>
                <h3 className="text-2xl font-black text-white flex items-center gap-2">
                  Plan Premium <Crown className="w-5 h-5 text-amber-400" />
                </h3>
                <p className="text-xs text-amber-200/80 font-medium mt-1">Potencia total de IA, velocidad extrema e identidad VIP.</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl sm:text-5xl font-black text-white">
                  {billingCycle === 'yearly' ? '$7.99' : '$9.99'}
                </span>
                <span className="text-xs font-bold text-amber-300 uppercase">
                  / mes {billingCycle === 'yearly' && '(anual $79)'}
                </span>
              </div>

              <div className="pt-2 border-t border-amber-500/20 space-y-3">
                <p className="text-[11px] font-mono font-bold text-amber-300 uppercase tracking-wider">Beneficios Desbloqueados:</p>
                <ul className="space-y-3 text-xs text-slate-200 font-medium">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span><strong>Insignia VIP Dorada</strong> visible en salas y perfil</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span><strong>IA Aether Max Cuántica</strong> ilimitada y sin esperas</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span><strong>Archivos hasta 2 GB</strong> (videos, fotos RAW y documentos)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span><strong>Paleta de 8 Colores VIP</strong> + Temas visuales exclusivos</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span><strong>Notas de Voz HD</strong> con transcripción inteligente</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span><strong>Salas con Código Seguro</strong> ilimitadas</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span><strong>Activación por Admin</strong> mediante Ticket Discord</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-8">
              <button
                type="button"
                onClick={() => setSelectedPlanModal('premium')}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-xl shadow-amber-500/25 active:scale-95 flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02]"
              >
                <Crown className="w-4 h-4" />
                <span>Solicitar Plan Premium</span>
              </button>
            </div>
          </div>

          {/* TIER 3: CYBER ELITE ULTRA */}
          <div className="rounded-3xl bg-slate-900/80 border-2 border-purple-500/50 p-6 sm:p-8 flex flex-col justify-between hover:border-purple-500/80 transition-all shadow-xl shadow-purple-500/10 backdrop-blur-xl relative group">
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-black uppercase tracking-wider mb-3">
                  <Zap className="w-3.5 h-3.5 text-purple-400" /> Nivel Operador & Elite
                </div>
                <h3 className="text-2xl font-black text-white flex items-center gap-2">
                  Cyber Elite Ultra <Zap className="w-5 h-5 text-purple-400" />
                </h3>
                <p className="text-xs text-purple-200/80 font-medium mt-1">Máxima soberanía, auditoría forense con IA y nodos dedicados.</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl sm:text-5xl font-black text-white">
                  {billingCycle === 'yearly' ? '$19.99' : '$24.99'}
                </span>
                <span className="text-xs font-bold text-purple-300 uppercase">
                  / mes {billingCycle === 'yearly' && '(anual $199)'}
                </span>
              </div>

              <div className="pt-2 border-t border-purple-500/20 space-y-3">
                <p className="text-[11px] font-mono font-bold text-purple-300 uppercase tracking-wider">Todo lo de Premium más:</p>
                <ul className="space-y-3 text-xs text-slate-200 font-medium">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                    <span><strong>Insignia Holográfica Elite</strong></span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                    <span><strong>Salas Dedicadas y Nodos Aislados</strong></span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                    <span><strong>Auditoría Forense con IA</strong> en segundo plano</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                    <span><strong>Límite de 10 GB por Archivo</strong></span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                    <span><strong>Soporte Prioritario VIP 24/7</strong></span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                    <span><strong>Activación Directa por Admin</strong> en Discord</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-8">
              <button
                type="button"
                onClick={() => setSelectedPlanModal('cyber_elite')}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-xl shadow-purple-500/25 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>Solicitar Cyber Elite Ultra</span>
              </button>
            </div>
          </div>

        </div>

        {/* DETAILED COMPARISON TABLE */}
        <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 sm:p-8 space-y-6 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Matriz Comparativa Oficial</h3>
              <p className="text-xs text-slate-400">Detalle de capacidades y privilegios por plan.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4 font-bold">Característica</th>
                  <th className="py-3 px-4 font-bold text-slate-300">Plan Gratis</th>
                  <th className="py-3 px-4 font-black text-amber-400">Plan Premium</th>
                  <th className="py-3 px-4 font-bold text-purple-300">Cyber Elite Ultra</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-slate-200">
                <tr>
                  <td className="py-3 px-4 text-slate-300">Insignia Distintiva</td>
                  <td className="py-3 px-4 text-slate-500">Estándar</td>
                  <td className="py-3 px-4 font-bold text-amber-300">👑 VIP Dorada</td>
                  <td className="py-3 px-4 font-bold text-purple-300">💎 Holográfica Ultra</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-300">Asistente IA Cuántica</td>
                  <td className="py-3 px-4 text-slate-400">Básica (con cuota)</td>
                  <td className="py-3 px-4 font-bold text-emerald-400">✓ Ilimitada y Prioritaria</td>
                  <td className="py-3 px-4 font-bold text-emerald-400">✓ Ultra Latencia Mínima</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-300">Tamaño Máximo de Archivo</td>
                  <td className="py-3 px-4 text-slate-400">25 MB</td>
                  <td className="py-3 px-4 font-bold text-white">2.000 MB (2 GB)</td>
                  <td className="py-3 px-4 font-bold text-white">10.000 MB (10 GB)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-300">Paleta de Colores & Temas</td>
                  <td className="py-3 px-4 text-slate-400">6 Colores</td>
                  <td className="py-3 px-4 font-bold text-amber-300">14 Colores VIP + Temas</td>
                  <td className="py-3 px-4 font-bold text-purple-300">Todos + Gradientes Personalizados</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-300">Salas Privadas y con Código</td>
                  <td className="py-3 px-4 text-slate-400">Hasta 3 salas</td>
                  <td className="py-3 px-4 font-bold text-emerald-400">✓ Ilimitadas</td>
                  <td className="py-3 px-4 font-bold text-emerald-400">✓ Ilimitadas + Nodos Aislados</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-300">Auditoría Forense con IA</td>
                  <td className="py-3 px-4 text-slate-500">No disponible</td>
                  <td className="py-3 px-4 font-bold text-emerald-400">✓ En Cockpit IA</td>
                  <td className="py-3 px-4 font-bold text-emerald-400">✓ Tiempo Real Continuo</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-300">Canal de Activación</td>
                  <td className="py-3 px-4 text-slate-400">Automático</td>
                  <td className="py-3 px-4 font-bold text-amber-300">Ticket Discord / Admin Panel</td>
                  <td className="py-3 px-4 font-bold text-purple-300">Ticket Discord / Admin Panel</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ ACCORDION SECTION */}
        <div className="rounded-3xl bg-slate-900/60 border border-slate-800 p-6 sm:p-8 space-y-6 backdrop-blur-xl">
          <div className="text-center space-y-1">
            <h3 className="text-xl font-black text-white flex items-center justify-center gap-2">
              <HelpCircle className="w-5 h-5 text-amber-400" /> Preguntas Frecuentes
            </h3>
            <p className="text-xs text-slate-400">Todo sobre el proceso de solicitud y activación de membresías.</p>
          </div>

          <div className="space-y-3 max-w-3xl mx-auto">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="border border-slate-800 rounded-2xl bg-slate-950/70 overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="w-full p-4 text-left font-bold text-xs sm:text-sm text-white flex items-center justify-between gap-3 hover:text-amber-300 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${expandedFaq === idx ? 'rotate-180 text-amber-400' : ''}`} />
                </button>
                <AnimatePresence>
                  {expandedFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-4 pb-4 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER GUARANTEES */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <h4 className="text-xs font-bold text-white">Privacidad 100% Protegida</h4>
            <p className="text-[11px] text-slate-400">Tus datos nunca son compartidos con terceros.</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col items-center gap-2">
            <Zap className="w-6 h-6 text-amber-400" />
            <h4 className="text-xs font-bold text-white">Activación Directa por Admin</h4>
            <p className="text-[11px] text-slate-400">Validación y asignación segura en el panel central.</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col items-center gap-2">
            <MessageSquare className="w-6 h-6 text-[#9da6ff]" />
            <h4 className="text-xs font-bold text-white">Servidor de Discord Oficial</h4>
            <p className="text-[11px] text-slate-400">Atención ágil mediante el sistema de tickets.</p>
          </div>
        </div>
      </div>

      {/* DISCORD TICKET REQUEST MODAL */}
      <AnimatePresence>
        {selectedPlanModal && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl border ${
                    selectedPlanModal === 'cyber_elite'
                      ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                      : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  }`}>
                    {selectedPlanModal === 'cyber_elite' ? (
                      <Zap className="w-5 h-5 animate-pulse" />
                    ) : (
                      <Crown className="w-5 h-5 animate-pulse" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">
                      {selectedPlanModal === 'cyber_elite' ? 'Solicitud: Cyber Elite Ultra' : 'Solicitud: Plan Premium'}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Activación exclusiva mediante Servidor de Discord
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPlanModal(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Instructions Notice */}
              <div className="p-4 rounded-2xl bg-[#5865F2]/10 border border-[#5865F2]/30 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-[#9da6ff] font-bold">
                  <MessageSquare className="w-4 h-4" />
                  <span>Pasos para activar tu membresía:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-xs">
                  <li>Copia tus datos de cuenta con el botón a continuación.</li>
                  <li>Únete al servidor oficial de Discord y abre un <strong>Ticket de Soporte</strong>.</li>
                  <li>Envía los datos copiados solicitando el <strong>{selectedPlanModal === 'cyber_elite' ? 'Cyber Elite Ultra' : 'Plan Premium'}</strong>.</li>
                  <li>Un Administrador activará tu plan desde el Panel Central.</li>
                </ol>
              </div>

              {/* Account Data Box */}
              <div className="p-4 rounded-2xl bg-black/60 border border-slate-800 space-y-2 text-xs font-mono">
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400">Plan Solicitado:</span>
                  <span className={`font-bold ${selectedPlanModal === 'cyber_elite' ? 'text-purple-300' : 'text-amber-300'}`}>
                    {selectedPlanModal === 'cyber_elite' ? 'Cyber Elite Ultra' : 'Plan Premium'} ({billingCycle === 'yearly' ? 'Anual' : 'Mensual'})
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400">Tu Correo:</span>
                  <span className="text-cyan-300 font-bold">{currentUser?.email || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400">Tu ID de Cuenta:</span>
                  <span className="text-slate-300 text-[11px] truncate max-w-[200px]">{currentUser?.id || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400">Tu Nombre:</span>
                  <span className="text-white">{currentUser?.name || 'N/A'}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleCopyTicketInfo(selectedPlanModal === 'cyber_elite' ? 'Cyber Elite Ultra' : 'Plan Premium')}
                  className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs uppercase tracking-wider transition-all border border-slate-700 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Copy className="w-4 h-4 text-cyan-400" />
                  <span>{copiedTicketData ? '✓ ¡Datos Copiados al Portapapeles!' : 'Copiar Datos para el Ticket'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleCopyTicketInfo(selectedPlanModal === 'cyber_elite' ? 'Cyber Elite Ultra' : 'Plan Premium');
                    handleOpenDiscord();
                  }}
                  className="w-full py-4 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white font-black text-xs uppercase tracking-wider transition-all shadow-xl shadow-[#5865F2]/25 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Abrir Servidor de Discord (Crear Ticket)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>

                <p className="text-[10px] text-center text-slate-500 font-mono">
                  Servidor oficial: https://discord.gg/XdP84mBNWp
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
