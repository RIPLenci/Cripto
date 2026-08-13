import React, { useState, useEffect } from 'react';
import { 
  Radar, 
  ShieldAlert, 
  ShieldCheck, 
  Zap, 
  Activity, 
  Ban, 
  Play, 
  RefreshCw, 
  Wifi, 
  Lock, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Sliders, 
  Terminal, 
  Users, 
  MessageSquare, 
  Clock, 
  Trash2,
  HelpCircle
} from 'lucide-react';
import { WsMonitorStats, WsConnectionClient, WsSecurityHeuristicRule } from '../types';

interface SecurityMonitorProps {
  token: string | null;
  onNotify: (msg: string, type: 'info' | 'success' | 'alert') => void;
  accentColor?: string;
}

export const SecurityMonitor: React.FC<SecurityMonitorProps> = ({ token, onNotify, accentColor = '#0ea5e9' }) => {
  const [stats, setStats] = useState<WsMonitorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(2000);
  const [simulatingThreat, setSimulatingThreat] = useState(false);
  const [activeTab, setActiveTab] = useState<'live' | 'heuristics' | 'banned' | 'logs'>('live');
  const [selectedIpFilter, setSelectedIpFilter] = useState('');

  const fetchWsStats = async () => {
    try {
      const res = await fetch('/api/admin/ws-monitor/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Error fetching WS Monitor stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWsStats();
    const interval = setInterval(fetchWsStats, refreshInterval);
    return () => clearInterval(interval);
  }, [token, refreshInterval]);

  const handleToggleHeuristic = async (id: string, enabled: boolean, threshold?: number) => {
    try {
      const res = await fetch('/api/admin/ws-monitor/heuristics', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ heuristicId: id, enabled, threshold })
      });
      if (res.ok) {
        onNotify("Regla heurística actualizada correctamente", "success");
        fetchWsStats();
      }
    } catch (err) {
      onNotify("Error al actualizar heurística", "alert");
    }
  };

  const handleDisconnectSocket = async (socketId: string) => {
    try {
      const res = await fetch('/api/admin/ws-monitor/disconnect', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ socketId })
      });
      if (res.ok) {
        onNotify("Conexión WebSocket forzada a desconectar", "info");
        fetchWsStats();
      }
    } catch (err) {
      onNotify("Error al desconectar socket", "alert");
    }
  };

  const handleBanIp = async (ip: string, reason: string) => {
    try {
      const res = await fetch('/api/admin/ban-ip', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ targetIp: ip, reason: reason || "Bloqueado desde Monitor WebSocket", severity: "critical" })
      });
      if (res.ok) {
        onNotify(`IP ${ip} bloqueada y añadida al firewall`, "success");
        fetchWsStats();
      }
    } catch (err) {
      onNotify("Error al bloquear IP", "alert");
    }
  };

  const handleUnbanIp = async (ip: string) => {
    try {
      const res = await fetch('/api/admin/unban-ip', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ targetIp: ip })
      });
      if (res.ok) {
        onNotify(`IP ${ip} desbloqueada del firewall`, "success");
        fetchWsStats();
      }
    } catch (err) {
      onNotify("Error al desbloquear IP", "alert");
    }
  };

  const handleSimulateThreat = async (threatType: string) => {
    setSimulatingThreat(true);
    try {
      const res = await fetch('/api/admin/ws-monitor/simulate-threat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ threatType })
      });
      if (res.ok) {
        const data = await res.json();
        onNotify(`Prueba ejecuctada: ${data.message}`, "info");
        fetchWsStats();
      }
    } catch (err) {
      onNotify("Error en simulación de amenaza", "alert");
    } finally {
      setSimulatingThreat(false);
    }
  };

  const filteredClients = stats?.activeClients.filter(c => 
    !selectedIpFilter || c.ip.includes(selectedIpFilter) || (c.userName && c.userName.toLowerCase().includes(selectedIpFilter.toLowerCase()))
  ) || [];

  return (
    <div className="space-y-5 text-slate-100 max-w-full overflow-x-hidden">
      {/* HEADER BANNER */}
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl aether-card border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 z-10">
          <div 
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl ring-2 ring-white/10 shrink-0"
            style={{ backgroundColor: accentColor }}
          >
            <Radar className="w-6 h-6 animate-spin-slow text-white" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              Monitor de Seguridad WebSocket (WAF & Live Heuristics)
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                ACTIVO 24/7
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Análisis heurístico en tiempo real de tramas WebSocket, detección de inundación y auto-bloqueo dinámico de IPs.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end z-10">
          <button
            onClick={fetchWsStats}
            className="p-2.5 rounded-xl aether-card-subtle hover:border-slate-600 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all"
            title="Actualizar métricas"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} style={{ color: accentColor }} />
            <span className="hidden sm:inline">Refrescar</span>
          </button>

          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <span className="text-[10px] font-bold text-slate-400 px-2">Velocidad:</span>
            {[1000, 2000, 5000].map(ms => (
              <button
                key={ms}
                onClick={() => setRefreshInterval(ms)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${refreshInterval === ms ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
              >
                {ms / 1000}s
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl aether-card border border-slate-800/80 space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Sockets Activos</span>
            <Wifi className="w-4 h-4" style={{ color: accentColor }} />
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{stats?.activeSockets || 0}</span>
            <span className="text-[11px] font-mono text-slate-400">({stats?.authenticatedSockets || 0} aut)</span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium truncate">Conexiones TCP en vivo</p>
        </div>

        <div className="p-4 rounded-2xl aether-card border border-slate-800/80 space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Procesados/seg</span>
            <Zap className="w-4 h-4 text-amber-400" style={{ color: accentColor }} />
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{stats?.messagesPerSecond || 0}</span>
            <span className="text-[11px] font-mono text-slate-400">msg/s</span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium truncate">Total: {stats?.totalMessagesProcessed || 0} tramas</p>
        </div>

        <div className="p-4 rounded-2xl aether-card border border-slate-800/80 space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Alertas Heurísticas</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-400">{stats?.suspiciousEventsCount || 0}</span>
            <span className="text-[11px] font-bold text-rose-300">Anomalías</span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium truncate">Alertas de inundación/burst</p>
        </div>

        <div className="p-4 rounded-2xl aether-card border border-slate-800/80 space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>IPs Bloqueadas</span>
            <Ban className="w-4 h-4 text-purple-400" />
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-300">{stats?.autoBlockedIpsCount || 0}</span>
            <span className="text-[11px] font-bold text-purple-400">Firewall</span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium truncate">Aislamiento por heurística</p>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
        <button
          onClick={() => setActiveTab('live')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'live' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <Activity className="w-4 h-4" style={{ color: activeTab === 'live' ? accentColor : undefined }} />
          <span>Conexiones Sockets ({stats?.activeClients.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('heuristics')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'heuristics' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <Sliders className="w-4 h-4" style={{ color: activeTab === 'heuristics' ? accentColor : undefined }} />
          <span>Reglas Heurísticas ({stats?.heuristics.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('banned')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'banned' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <Ban className="w-4 h-4 text-purple-400" />
          <span>Firewall IPs ({stats?.bannedIps.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'logs' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span>Eventos en Vivo ({stats?.recentEvents.length || 0})</span>
        </button>
      </div>

      {/* TAB 1: LIVE CONNECTIONS TABLE */}
      {activeTab === 'live' && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center">
            <input
              type="text"
              placeholder="Filtrar por IP o Usuario..."
              value={selectedIpFilter}
              onChange={(e) => setSelectedIpFilter(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-[var(--accent)] w-full sm:w-72"
            />

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400">Ataque de prueba:</span>
              <button
                disabled={simulatingThreat}
                onClick={() => handleSimulateThreat('FLOOD')}
                className="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 text-[11px] font-bold transition-colors flex items-center gap-1"
              >
                <Play className="w-3 h-3" /> Inundación Flood
              </button>
              <button
                disabled={simulatingThreat}
                onClick={() => handleSimulateThreat('AUTH_BURST')}
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 text-[11px] font-bold transition-colors flex items-center gap-1"
              >
                <Play className="w-3 h-3" /> Auth Burst
              </button>
            </div>
          </div>

          <div className="aether-card border border-slate-800 rounded-2xl overflow-hidden shadow-xl max-w-full overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 border-collapse min-w-[650px]">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Dirección IP</th>
                  <th className="p-3">Usuario Identificado</th>
                  <th className="p-3">Sala Actual</th>
                  <th className="p-3">Tramas / 3s</th>
                  <th className="p-3">Estado Heurístico</th>
                  <th className="p-3 text-right">Acciones WAF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 font-mono text-xs">
                      No hay clientes WebSocket activos actualmente en la red.
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => (
                    <tr key={client.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        {client.ip}
                      </td>
                      <td className="p-3">
                        {client.userName ? (
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-200">{client.userName}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{client.userEmail}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Anónimo / Autenticando...</span>
                        )}
                      </td>
                      <td className="p-3 font-mono text-slate-300">
                        {client.roomId ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px]">
                            <MessageSquare className="w-3 h-3 text-[var(--accent)]" /> {client.roomId}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-200">
                        <span className={`px-2 py-0.5 rounded-md ${client.messageCountWindow > 5 ? 'bg-amber-500/20 text-amber-300 font-black' : 'bg-slate-950 text-slate-300'}`}>
                          {client.messageCountWindow} msg
                        </span>
                      </td>
                      <td className="p-3">
                        {client.status === 'suspicious' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            <AlertTriangle className="w-3 h-3" /> SOSPECHOSO
                          </span>
                        ) : client.status === 'blocked' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            <Ban className="w-3 h-3" /> BLOQUEADO
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> SEGURO
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleDisconnectSocket(client.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold"
                            title="Desconectar Socket"
                          >
                            Desconectar
                          </button>
                          <button
                            onClick={() => handleBanIp(client.ip, "Bloqueo manual desde Monitor WebSocket")}
                            className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-[11px] font-bold flex items-center gap-1"
                            title="Banear IP"
                          >
                            <Ban className="w-3 h-3" /> Ban IP
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
      )}

      {/* TAB 2: HEURISTICS CONFIGURATION */}
      {activeTab === 'heuristics' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {stats?.heuristics.map((h) => (
            <div key={h.id} className="p-5 rounded-2xl aether-card border border-slate-800/80 space-y-3 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-[var(--accent)]">
                    <ShieldCheck className="w-5 h-5" style={{ color: accentColor }} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{h.name}</h4>
                    <span className="text-[10px] font-mono text-slate-400">Acción WAF: {h.action}</span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={h.enabled}
                    onChange={(e) => handleToggleHeuristic(h.id, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent)]"></div>
                </label>
              </div>

              <p className="text-xs text-slate-300 font-medium">{h.description}</p>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">Umbral de Infracción:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={h.threshold}
                    onChange={(e) => handleToggleHeuristic(h.id, h.enabled, Number(e.target.value))}
                    className="w-20 bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg text-xs font-mono font-bold text-white text-center focus:outline-none focus:border-[var(--accent)]"
                  />
                  <span className="text-xs font-mono text-slate-400">{h.unit}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: BANNED IPS LIST */}
      {activeTab === 'banned' && (
        <div className="space-y-3">
          <div className="aether-card border border-slate-800 rounded-2xl overflow-hidden shadow-xl max-w-full overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 border-collapse min-w-[550px]">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">IP Bloqueada</th>
                  <th className="p-3">Causa de Bloqueo Heurístico</th>
                  <th className="p-3">Fecha de Bloqueo</th>
                  <th className="p-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {stats?.bannedIps.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500 font-mono text-xs">
                      No hay direcciones IP bloqueadas en el firewall actualmente.
                    </td>
                  </tr>
                ) : (
                  stats?.bannedIps.map((b) => (
                    <tr key={b.ip} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-rose-300 flex items-center gap-2">
                        <Ban className="w-3.5 h-3.5 text-rose-400" />
                        {b.ip}
                      </td>
                      <td className="p-3 text-slate-200">{b.reason}</td>
                      <td className="p-3 font-mono text-slate-400">
                        {new Date(b.bannedAt).toLocaleString('es-ES')}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleUnbanIp(b.ip)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-colors"
                        >
                          Desbloquear IP
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: RECENT EVENTS LOG */}
      {activeTab === 'logs' && (
        <div className="p-4 rounded-2xl aether-card border border-slate-800 space-y-3 font-mono text-xs max-h-[450px] overflow-y-auto scrollbar-thin">
          {stats?.recentEvents.length === 0 ? (
            <p className="p-8 text-center text-slate-500">No se registran eventos de seguridad de WebSocket por el momento.</p>
          ) : (
            stats?.recentEvents.map((ev) => (
              <div key={ev.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start gap-3">
                <span className="text-[10px] text-slate-500 shrink-0 mt-0.5">
                  {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                  ev.severity === 'critical' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                  ev.severity === 'alert' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  ev.severity === 'warn' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-blue-500/20 text-blue-300'
                }`}>
                  {ev.type}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-slate-200 font-bold break-all">{ev.detail}</p>
                  <p className="text-[10px] text-slate-500">Origen IP: {ev.ip}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
