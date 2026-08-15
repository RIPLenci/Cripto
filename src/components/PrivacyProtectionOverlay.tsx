import React, { useEffect, useState } from 'react';
import { ShieldAlert, Lock, EyeOff } from 'lucide-react';

interface PrivacyProtectionOverlayProps {
  userEmail?: string;
}

export const PrivacyProtectionOverlay: React.FC<PrivacyProtectionOverlayProps> = ({ userEmail }) => {
  const [isWindowBlurred, setIsWindowBlurred] = useState(false);
  const [captureBlockedToast, setCaptureBlockedToast] = useState(false);

  const triggerAntiCaptureToast = () => {
    setCaptureBlockedToast(true);
    // Clear clipboard content if PrintScreen was attempted
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText("🔒 CONTENIDO PROTEGIDO Y CIFRADO POR AETHER NETWORK - CAPTURAS DE PANTALLA RESTRINGIDAS.").catch(() => {});
    }
    setTimeout(() => {
      setCaptureBlockedToast(false);
    }, 4500);
  };

  useEffect(() => {
    // 1. Listen for key combinations (PrintScreen, Meta+Shift+S, Meta+Shift+3/4/5, Ctrl+P, F12, etc.)
    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen key
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen' || e.keyCode === 44) {
        e.preventDefault();
        e.stopPropagation();
        triggerAntiCaptureToast();
        return false;
      }

      // Windows Snipping Tool: Meta + Shift + S or Alt + PrintScreen
      if ((e.metaKey || (e as any).superKey || e.ctrlKey) && e.shiftKey && (e.key === 'S' || e.key === 's' || e.code === 'KeyS')) {
        e.preventDefault();
        e.stopPropagation();
        triggerAntiCaptureToast();
        return false;
      }

      // Mac Screenshot: Cmd + Shift + 3 / 4 / 5
      if ((e.metaKey || (e as any).superKey) && e.shiftKey && ['3', '4', '5'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        triggerAntiCaptureToast();
        return false;
      }

      // Print: Ctrl + P / Cmd + P
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P' || e.code === 'KeyP')) {
        e.preventDefault();
        e.stopPropagation();
        triggerAntiCaptureToast();
        return false;
      }

      // DevTools & Screen Grabber Shortcuts: F12, Ctrl+Shift+I, Ctrl+Shift+C
      if (e.key === 'F12' || ((e.ctrlKey || e.metaKey) && e.shiftKey && ['I', 'i', 'C', 'c', 'J', 'j'].includes(e.key))) {
        e.preventDefault();
        e.stopPropagation();
        triggerAntiCaptureToast();
        return false;
      }
    };

    // 2. Listen for window blur / visibility changes (Screen recorder or window capture tool focus switch)
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

    // 3. Prevent Context Menu (Right Click)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      triggerAntiCaptureToast();
      return false;
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyDown, true);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyDown, true);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  return (
    <>
      {/* Anti-Capture Attempt Toast Alert */}
      {captureBlockedToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] bg-rose-950/95 border-2 border-rose-500/80 text-rose-100 px-6 py-3.5 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-3 animate-bounce">
          <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
              <span>Protección Anti-Captura Activada</span>
              <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            </div>
            <p className="text-[11px] text-rose-200/90 font-medium mt-0.5">
              Se ha detectado un intento de captura o grabación. Portapapeles limpiado por privacidad Aether.
            </p>
          </div>
        </div>
      )}

      {/* Window Blur Privacy Screen Shield */}
      {isWindowBlurred && (
        <div className="fixed inset-0 z-[9995] bg-slate-950/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center select-none animate-fadeIn">
          <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 shadow-2xl shadow-amber-500/10 animate-pulse">
            <Lock className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Vista Oculta por Protección de Privacidad</span>
            <EyeOff className="w-6 h-6 text-amber-400" />
          </h2>
          <p className="text-slate-400 text-sm max-w-md mt-2 font-medium">
            El contenido de la pantalla ha sido bloqueado preventivamente para impedir la captura de video o grabación por aplicaciones externas.
          </p>
          <div className="mt-6 px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-amber-300 text-xs font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            <span>Haz clic dentro de la ventana para desbloquear la sesión</span>
          </div>
        </div>
      )}
    </>
  );
};
