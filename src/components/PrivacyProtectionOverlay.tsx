import React, { useEffect, useState } from 'react';
import { ShieldAlert, EyeOff, Radio, Camera, Video, MonitorX } from 'lucide-react';
import { drmProtection, DRMAlertEvent } from '../lib/drmProtection';
import { detectDevice, DeviceInfo } from '../lib/deviceDetector';

interface PrivacyProtectionOverlayProps {
  userEmail?: string;
  userId?: string;
  userIp?: string;
  antiSpyMode?: boolean;
}

export const PrivacyProtectionOverlay: React.FC<PrivacyProtectionOverlayProps> = () => {
  const [isWindowBlurred, setIsWindowBlurred] = useState(false);
  const [activeAlert, setActiveAlert] = useState<DRMAlertEvent | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => detectDevice());

  useEffect(() => {
    // 1. Initialize core hardware/browser DRM engine
    drmProtection.init();

    // 2. Subscribe to active DRM interception events
    const unsubscribe = drmProtection.subscribe((event) => {
      setActiveAlert(event);
      setTimeout(() => {
        setActiveAlert((prev) => (prev?.timestamp === event.timestamp ? null : prev));
      }, 5000);
    });

    // 3. Handle window blur & tab visibility
    const handleWindowBlur = () => {
      setIsWindowBlurred(true);
    };

    const handleWindowFocus = () => {
      setIsWindowBlurred(false);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsWindowBlurred(true);
      } else {
        setIsWindowBlurred(false);
      }
    };

    // 4. Update device info on resize
    const handleResize = () => {
      setDeviceInfo(detectDevice());
    };

    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('resize', handleResize);

    return () => {
      unsubscribe();
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <>
      {/* 1. ACTIVE DRM INTERCEPTION ALERT TOAST (Capture / Recording / Share Attempt) */}
      {activeAlert && (
        <div className="fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 z-[99999] w-[92vw] max-w-lg bg-rose-950/95 border-2 border-rose-500/90 text-rose-100 px-5 py-4 rounded-2xl shadow-[0_0_50px_rgba(244,63,94,0.4)] backdrop-blur-2xl flex items-start gap-4 animate-bounce">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-400 shrink-0 mt-0.5">
            {activeAlert.type === 'SCREEN_SHARE_ATTEMPT' ? (
              <Radio className="w-6 h-6 animate-pulse text-rose-400" />
            ) : activeAlert.type === 'SCREEN_RECORDING_ATTEMPT' ? (
              <Video className="w-6 h-6 animate-pulse text-rose-400" />
            ) : activeAlert.type === 'SCREENSHOT_ATTEMPT' ? (
              <Camera className="w-6 h-6 animate-pulse text-rose-400" />
            ) : (
              <ShieldAlert className="w-6 h-6 animate-pulse text-rose-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                <span>
                  {activeAlert.type === 'SCREEN_SHARE_ATTEMPT'
                    ? 'Transmisión / Emisión Bloqueada'
                    : activeAlert.type === 'SCREEN_RECORDING_ATTEMPT'
                    ? 'Grabación de Video Bloqueada'
                    : activeAlert.type === 'SCREENSHOT_ATTEMPT'
                    ? 'Captura de Pantalla Bloqueada'
                    : 'Protección DRM Activada'}
                </span>
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
              </span>
              <button 
                onClick={() => setActiveAlert(null)}
                className="text-rose-400 hover:text-white p-1 rounded-lg text-xs font-bold transition-colors"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-rose-200 font-semibold mt-1 leading-snug">
              {activeAlert.detail}
            </p>
            <div className="mt-2 flex items-center gap-2 text-[10px] text-rose-300/80 font-mono">
              <span className="px-2 py-0.5 rounded-md bg-rose-900/60 border border-rose-700/50">
                Portapapeles Sanitizado
              </span>
              <span className="px-2 py-0.5 rounded-md bg-rose-900/60 border border-rose-700/50">
                DRM E2EE Activo
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. WINDOW BLUR / SCREEN RECORDER OBFUSCATION CURTAIN */}
      {isWindowBlurred && (
        <div 
          onClick={() => setIsWindowBlurred(false)}
          className="fixed inset-0 z-[99990] bg-slate-950/96 backdrop-blur-3xl flex flex-col items-center justify-center p-6 text-center select-none cursor-pointer safe-top safe-bottom"
        >
          <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border-2 border-amber-500/40 flex items-center justify-center text-amber-400 mb-5 shadow-[0_0_40px_rgba(245,158,11,0.2)] animate-pulse">
            <MonitorX className="w-10 h-10" />
          </div>
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-mono font-bold mb-3 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            <span>Escudo de Privacidad Anti-Grabación</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2 justify-center">
            <span>Contenido Oculto por Protección DRM</span>
            <EyeOff className="w-5 h-5 text-amber-400" />
          </h2>

          <p className="text-slate-400 text-xs sm:text-sm max-w-md mt-2 font-medium leading-relaxed">
            La interfaz se ha protegido automáticamente al desenfocarse la ventana para evitar capturas o grabaciones por software en segundo plano (OBS, Discord, Snipping Tool).
          </p>

          <div className="mt-6 px-5 py-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-amber-300 text-xs font-bold flex items-center gap-3 shadow-xl hover:scale-105 transition-transform">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Toca o haz clic en cualquier lugar para restaurar la sesión</span>
          </div>

          {/* Device & Security Profile Tag */}
          <div className="mt-8 flex items-center gap-3 text-[11px] text-slate-500 font-mono">
            <span>{deviceInfo.os} • {deviceInfo.browser}</span>
            <span>•</span>
            <span>{deviceInfo.deviceType.toUpperCase()}</span>
            <span>•</span>
            <span className="text-emerald-500 font-semibold">CIFRADO E2EE</span>
          </div>
        </div>
      )}
    </>
  );
};
