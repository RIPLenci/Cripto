import React from 'react';
import { 
  Crown, Code2, ShieldAlert, ShieldCheck, Headphones, Bug, HeartHandshake, Sparkles, 
  Rocket, BadgeCheck, Zap, Award, UserCheck, Shield
} from 'lucide-react';
import { BadgeType, BadgeDefinition } from '../types';

export const BADGE_ORDER: BadgeType[] = [
  'owner',
  'developer',
  'admin',
  'staff',
  'support',
  'bug_hunter',
  'donator',
  'custom',
  'booster',
  'verified',
  'verified_instagram',
  'verified_tiktok',
  'verified_youtube',
  'verified_kick',
  'verified_twitch',
  'cyber_elite',
  'premium',
  'user'
];

export const BADGE_DEFINITIONS: Record<BadgeType, BadgeDefinition> = {
  owner: {
    id: 'owner',
    name: 'Owner',
    shortName: 'OWNER',
    category: 'hierarchy',
    description: 'Propietario, Creador y Máxima Autoridad de la Plataforma Aether.',
    bgGradient: 'from-amber-500/30 via-yellow-500/25 to-orange-500/30',
    borderColor: 'border-amber-400/80',
    textColor: 'text-amber-300',
    glowColor: 'shadow-[0_0_18px_rgba(245,158,11,0.55)]',
    iconName: 'Crown'
  },
  developer: {
    id: 'developer',
    name: 'Developer',
    shortName: 'DEV',
    category: 'hierarchy',
    description: 'Desarrollador Oficial del Core, Encriptación y Arquitectura del Sistema.',
    bgGradient: 'from-cyan-600/30 via-teal-500/25 to-indigo-600/30',
    borderColor: 'border-cyan-400/80',
    textColor: 'text-cyan-300',
    glowColor: 'shadow-[0_0_18px_rgba(6,182,212,0.55)]',
    iconName: 'Code2'
  },
  admin: {
    id: 'admin',
    name: 'Administrador',
    shortName: 'ADMIN',
    category: 'hierarchy',
    description: 'Administrador Oficial con Privilegios Globales de Seguridad y Control.',
    bgGradient: 'from-red-600/30 via-rose-600/25 to-red-500/30',
    borderColor: 'border-red-500/80',
    textColor: 'text-red-400',
    glowColor: 'shadow-[0_0_18px_rgba(239,68,68,0.55)]',
    iconName: 'ShieldAlert'
  },
  staff: {
    id: 'staff',
    name: 'Staff',
    shortName: 'STAFF',
    category: 'hierarchy',
    description: 'Miembro Oficial del Equipo de Moderación y Supervisión del Sistema.',
    bgGradient: 'from-blue-600/30 via-indigo-600/25 to-cyan-500/30',
    borderColor: 'border-blue-400/80',
    textColor: 'text-blue-300',
    glowColor: 'shadow-[0_0_18px_rgba(59,130,246,0.55)]',
    iconName: 'ShieldCheck'
  },
  support: {
    id: 'support',
    name: 'Soporte',
    shortName: 'SOPORTE',
    category: 'hierarchy',
    description: 'Especialista Oficial de Atención al Usuario y Soporte Técnico.',
    bgGradient: 'from-emerald-600/30 via-teal-600/25 to-green-500/30',
    borderColor: 'border-emerald-400/80',
    textColor: 'text-emerald-300',
    glowColor: 'shadow-[0_0_18px_rgba(16,185,129,0.55)]',
    iconName: 'Headphones'
  },
  bug_hunter: {
    id: 'bug_hunter',
    name: 'Bug Hunter',
    shortName: 'HUNTER',
    category: 'special',
    description: 'Cazador Élite de Vulnerabilidades y Reportes de Seguridad.',
    bgGradient: 'from-orange-500/30 via-amber-500/25 to-lime-500/30',
    borderColor: 'border-orange-400/80',
    textColor: 'text-orange-300',
    glowColor: 'shadow-[0_0_18px_rgba(249,115,22,0.55)]',
    iconName: 'Bug'
  },
  donator: {
    id: 'donator',
    name: 'Donador',
    shortName: 'DONADOR',
    category: 'special',
    description: 'Mecenas y Contribuyente Oficial que apoya económicamente el desarrollo del proyecto.',
    bgGradient: 'from-emerald-500/35 via-teal-500/30 to-amber-400/35',
    borderColor: 'border-emerald-400/80',
    textColor: 'text-emerald-300',
    glowColor: 'shadow-[0_0_18px_rgba(16,185,129,0.55)]',
    iconName: 'HeartHandshake'
  },
  custom: {
    id: 'custom',
    name: 'Custom',
    shortName: 'CUSTOM',
    category: 'special',
    description: 'Insignia de Honor Personalizada otorgada por Mérito Exclusivo.',
    bgGradient: 'from-purple-600/30 via-fuchsia-600/25 to-pink-500/30',
    borderColor: 'border-fuchsia-400/80',
    textColor: 'text-fuchsia-300',
    glowColor: 'shadow-[0_0_18px_rgba(217,70,239,0.55)]',
    iconName: 'Sparkles'
  },
  booster: {
    id: 'booster',
    name: 'Booster',
    shortName: 'BOOSTER',
    category: 'special',
    description: 'Impulsor Oficial del Servidor y Colaborador Destacado de la Comunidad.',
    bgGradient: 'from-pink-600/30 via-rose-600/25 to-purple-600/30',
    borderColor: 'border-pink-400/80',
    textColor: 'text-pink-300',
    glowColor: 'shadow-[0_0_18px_rgba(244,63,94,0.55)]',
    iconName: 'Rocket'
  },
  verified: {
    id: 'verified',
    name: 'Verificado',
    shortName: 'VERIFICADO',
    category: 'social',
    description: 'Identidad Verificada Oficialmente en la Red Aether.',
    bgGradient: 'from-sky-500/30 via-blue-500/25 to-cyan-500/30',
    borderColor: 'border-sky-400/80',
    textColor: 'text-sky-300',
    glowColor: 'shadow-[0_0_18px_rgba(14,165,233,0.55)]',
    iconName: 'BadgeCheck'
  },
  verified_instagram: {
    id: 'verified_instagram',
    name: 'Verificado Instagram',
    shortName: 'INSTAGRAM',
    category: 'social',
    description: 'Creador con Cuenta Oficial de Instagram Verificada vinculada.',
    bgGradient: 'from-pink-500/35 via-rose-500/30 to-amber-500/35',
    borderColor: 'border-pink-500/80',
    textColor: 'text-pink-300',
    glowColor: 'shadow-[0_0_18px_rgba(236,72,153,0.55)]',
    iconName: 'Instagram'
  },
  verified_tiktok: {
    id: 'verified_tiktok',
    name: 'Verificado TikTok',
    shortName: 'TIKTOK',
    category: 'social',
    description: 'Creador con Cuenta Oficial de TikTok Verificada vinculada.',
    bgGradient: 'from-cyan-500/35 via-slate-900/50 to-pink-500/35',
    borderColor: 'border-cyan-400/80',
    textColor: 'text-cyan-300',
    glowColor: 'shadow-[0_0_18px_rgba(6,182,212,0.55)]',
    iconName: 'TikTok'
  },
  verified_youtube: {
    id: 'verified_youtube',
    name: 'Verificado YouTube',
    shortName: 'YOUTUBE',
    category: 'social',
    description: 'Canal Oficial de YouTube Verificado y Vinculado al Perfil.',
    bgGradient: 'from-red-600/35 via-red-700/30 to-rose-600/35',
    borderColor: 'border-red-500/80',
    textColor: 'text-red-300',
    glowColor: 'shadow-[0_0_18px_rgba(239,68,68,0.6)]',
    iconName: 'YouTube'
  },
  verified_kick: {
    id: 'verified_kick',
    name: 'Verificado Kick',
    shortName: 'KICK',
    category: 'social',
    description: 'Streamer Oficial de Kick Verificado y Reconocido en la Plataforma.',
    bgGradient: 'from-[#53FC18]/30 via-emerald-600/25 to-lime-500/30',
    borderColor: 'border-[#53FC18]/80',
    textColor: 'text-[#53FC18]',
    glowColor: 'shadow-[0_0_18px_rgba(83,252,24,0.55)]',
    iconName: 'Kick'
  },
  verified_twitch: {
    id: 'verified_twitch',
    name: 'Verificado Twitch',
    shortName: 'TWITCH',
    category: 'social',
    description: 'Streamer Oficial de Twitch Partner / Verificado Vinculado.',
    bgGradient: 'from-purple-600/35 via-violet-600/30 to-indigo-600/35',
    borderColor: 'border-[#9146FF]/80',
    textColor: 'text-[#a970ff]',
    glowColor: 'shadow-[0_0_18px_rgba(145,70,255,0.55)]',
    iconName: 'Twitch'
  },
  cyber_elite: {
    id: 'cyber_elite',
    name: 'Cyber Elite Ultra',
    shortName: 'CYBER ELITE',
    category: 'vip',
    description: 'Nivel Supremo de Ciberseguridad Militar e IA Cyber Elite Ultra.',
    bgGradient: 'from-cyan-500/35 via-indigo-600/30 to-purple-600/35',
    borderColor: 'border-cyan-400/80',
    textColor: 'text-cyan-300',
    glowColor: 'shadow-[0_0_20px_rgba(6,182,212,0.6)]',
    iconName: 'Zap'
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    shortName: 'PREMIUM VIP',
    category: 'vip',
    description: 'Suscripción VIP Premium Activa con Beneficios Exclusivos.',
    bgGradient: 'from-amber-500/35 via-yellow-600/30 to-orange-500/35',
    borderColor: 'border-amber-400/80',
    textColor: 'text-amber-300',
    glowColor: 'shadow-[0_0_18px_rgba(245,158,11,0.6)]',
    iconName: 'Award'
  },
  user: {
    id: 'user',
    name: 'Usuario',
    shortName: 'USUARIO',
    category: 'general',
    description: 'Miembro Autenticado y Verificado de la Comunidad Aether.',
    bgGradient: 'from-slate-700/35 via-slate-800/30 to-blue-900/30',
    borderColor: 'border-slate-500/60',
    textColor: 'text-slate-300',
    glowColor: 'shadow-[0_0_12px_rgba(148,163,184,0.35)]',
    iconName: 'UserCheck'
  }
};

/**
 * Returns sorted badges based on the user-requested exact priority order.
 */
export function getSortedBadges(badges?: string[]): BadgeType[] {
  if (!Array.isArray(badges) || badges.length === 0) return [];
  const unique = Array.from(new Set(badges)) as BadgeType[];
  return unique
    .filter(b => BADGE_DEFINITIONS[b])
    .sort((a, b) => {
      const idxA = BADGE_ORDER.indexOf(a);
      const idxB = BADGE_ORDER.indexOf(b);
      return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
    });
}

/**
 * Returns the single highest-rank (highest priority) badge unlocked by the user.
 */
export function getPrimaryBadge(badges?: string[]): BadgeType | null {
  const sorted = getSortedBadges(badges);
  return sorted.length > 0 ? sorted[0] : null;
}

/**
 * Single Highest Priority Badge Component for chat rooms, message streams, and conversations.
 */
export function UserPrimaryBadge({
  badges,
  customBadgeText,
  size = 'xs',
  showLabel = false,
  className
}: {
  badges?: string[];
  customBadgeText?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}) {
  const primaryBadge = getPrimaryBadge(badges);
  if (!primaryBadge) return null;

  return (
    <UserBadgeItem
      badgeId={primaryBadge}
      customText={customBadgeText}
      size={size}
      showLabel={showLabel}
    />
  );
}

/**
 * Custom SVG Vector icons for social networks and unique graphics.
 */
export function SocialBadgeIcon({ type, className = "w-3.5 h-3.5" }: { type: string; className?: string }) {
  switch (type) {
    case 'Instagram':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      );
    case 'TikTok':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-2.889 2.89 2.896 2.896 0 0 1-2.89-2.89 2.896 2.896 0 0 1 2.89-2.89c.31 0 .607.05.885.14v-3.52a6.34 6.34 0 0 0-.885-.062 6.335 6.335 0 0 0-6.335 6.332 6.335 6.335 0 0 0 6.335 6.335 6.335 6.335 0 0 0 6.335-6.335V8.347a8.204 8.204 0 0 0 4.88 1.583v-3.244a4.83 4.83 0 0 1-1.206-.001z" />
        </svg>
      );
    case 'YouTube':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    case 'Kick':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 3h5v5h3V5h5v6h-3v2h3v6h-5v-3h-3v5H3V3zm5 8V8H5v8h3v-3h3v-2H8z" />
        </svg>
      );
    case 'Twitch':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M2.149 0l-1.612 4.119v16.8h5.531v3.081h3.073l3.077-3.081h4.607l6.635-6.634v-14.285h-21.311zm19.232 13.067l-3.839 3.843h-4.607l-3.077 3.081v-3.081h-4.352v-14.887h15.875v11.044zm-9.722-6.666h2.564v7.688h-2.564v-7.688zm5.632 0h2.564v7.688h-2.564v-7.688z" />
        </svg>
      );
    default:
      return null;
  }
}

/**
 * Universal Badge Icon Component
 */
export function BadgeIcon({ badgeId, className = "w-3.5 h-3.5" }: { badgeId: BadgeType; className?: string }) {
  const def = BADGE_DEFINITIONS[badgeId];
  if (!def) return null;

  switch (def.iconName) {
    case 'Crown':
      return <Crown className={className} />;
    case 'Code2':
      return <Code2 className={className} />;
    case 'ShieldAlert':
      return <ShieldAlert className={className} />;
    case 'ShieldCheck':
      return <ShieldCheck className={className} />;
    case 'Headphones':
      return <Headphones className={className} />;
    case 'Bug':
      return <Bug className={className} />;
    case 'HeartHandshake':
      return <HeartHandshake className={className} />;
    case 'Sparkles':
      return <Sparkles className={className} />;
    case 'Rocket':
      return <Rocket className={className} />;
    case 'BadgeCheck':
      return <BadgeCheck className={className} />;
    case 'Zap':
      return <Zap className={className} />;
    case 'Award':
      return <Award className={className} />;
    case 'UserCheck':
      return <UserCheck className={className} />;
    case 'Instagram':
    case 'TikTok':
    case 'YouTube':
    case 'Kick':
    case 'Twitch':
      return <SocialBadgeIcon type={def.iconName} className={className} />;
    default:
      return <Shield className={className} />;
  }
}

/**
 * Single Badge Chip Component (Compact or Normal)
 */
export function UserBadgeItem({ 
  badgeId, 
  customText, 
  size = 'sm', 
  showLabel = false 
}: { 
  badgeId: BadgeType; 
  customText?: string; 
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}) {
  const def = BADGE_DEFINITIONS[badgeId];
  if (!def) return null;

  const label = badgeId === 'custom' && customText ? customText : def.name;

  const sizeClasses = {
    xs: 'p-0.5 text-[9px] gap-0.5',
    sm: 'px-1.5 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3.5 py-1.5 text-sm gap-2'
  };

  const iconSizes = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4'
  };

  return (
    <span
      title={`${def.name}: ${def.description}`}
      className={`inline-flex items-center rounded-lg font-black tracking-wide border transition-all duration-300 select-none bg-gradient-to-r ${def.bgGradient} ${def.borderColor} ${def.textColor} ${def.glowColor} ${sizeClasses[size]} hover:scale-105 active:scale-95 animate-badge-shimmer cursor-help`}
    >
      <BadgeIcon badgeId={badgeId} className={`${iconSizes[size]} shrink-0 animate-badge-pulse`} />
      {showLabel && (
        <span className="font-extrabold truncate max-w-[120px]">{label}</span>
      )}
    </span>
  );
}

/**
 * List of badges for message headers, lists, or compact previews.
 */
export function UserBadgeList({ 
  badges, 
  customBadgeText, 
  size = 'sm', 
  showLabels = false,
  maxDisplay,
  className = "flex items-center gap-1 flex-wrap"
}: { 
  badges?: string[]; 
  customBadgeText?: string; 
  size?: 'xs' | 'sm' | 'md';
  showLabels?: boolean;
  maxDisplay?: number;
  className?: string;
}) {
  const sorted = getSortedBadges(badges);
  if (sorted.length === 0) return null;

  const displayList = maxDisplay ? sorted.slice(0, maxDisplay) : sorted;
  const remaining = maxDisplay ? Math.max(0, sorted.length - maxDisplay) : 0;

  return (
    <div className={className}>
      {displayList.map(b => (
        <UserBadgeItem 
          key={b} 
          badgeId={b} 
          customText={customBadgeText} 
          size={size} 
          showLabel={showLabels} 
        />
      ))}
      {remaining > 0 && (
        <span 
          title={`${remaining} insignias adicionales`}
          className="text-[9px] font-mono px-1 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700"
        >
          +{remaining}
        </span>
      )}
    </div>
  );
}

/**
 * Rich Showcase Display for User Profile Modals & Settings
 */
export function UserBadgeShowcase({ 
  badges, 
  customBadgeText 
}: { 
  badges?: string[]; 
  customBadgeText?: string; 
}) {
  const sorted = getSortedBadges(badges);

  if (sorted.length === 0) {
    return (
      <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center text-xs text-slate-500 font-medium">
        Este usuario aún no tiene insignias especiales asignadas por la administración.
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5 text-amber-400" /> Insignias Oficiales Asignadas ({sorted.length})
        </span>
        <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          Autenticadas en Red
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {sorted.map(b => {
          const def = BADGE_DEFINITIONS[b];
          if (!def) return null;
          const displayTitle = b === 'custom' && customBadgeText ? customBadgeText : def.name;

          return (
            <div
              key={b}
              className={`p-3 rounded-2xl border bg-gradient-to-r ${def.bgGradient} ${def.borderColor} ${def.glowColor} flex items-start gap-3 transition-all hover:scale-[1.02] animate-badge-shimmer relative overflow-hidden group`}
            >
              <div className={`p-2.5 rounded-xl bg-slate-950/90 border ${def.borderColor} ${def.textColor} shrink-0 mt-0.5 shadow-lg group-hover:scale-110 transition-transform`}>
                <BadgeIcon badgeId={b} className="w-4 h-4 animate-badge-pulse" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-xs font-black truncate ${def.textColor}`}>
                    {displayTitle}
                  </span>
                  <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-md bg-slate-950/80 text-slate-300 border border-slate-800 uppercase font-black">
                    {def.shortName}
                  </span>
                </div>
                <p className="text-[10px] text-slate-300/90 leading-tight mt-1">
                  {def.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
