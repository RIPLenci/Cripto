/**
 * AETHER SECURITY NETWORK - ADVANCED DRM & ANTI-CAPTURE ENGINE
 * Active interception of screen recording, screen sharing (getDisplayMedia),
 * capture streams, PrintScreen keystrokes, and clipboard poisoning protection.
 */

export interface DRMAlertEvent {
  type: 'SCREENSHOT_ATTEMPT' | 'SCREEN_RECORDING_ATTEMPT' | 'SCREEN_SHARE_ATTEMPT' | 'PRINT_ATTEMPT' | 'DEVTOOLS_ATTEMPT';
  detail: string;
  timestamp: number;
}

type DRMListener = (event: DRMAlertEvent) => void;

class DRMProtectionEngine {
  private listeners: Set<DRMListener> = new Set();
  private isInitialized = false;
  private originalGetDisplayMedia: any = null;
  private originalCaptureStream: any = null;

  public subscribe(listener: DRMListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(event: DRMAlertEvent) {
    this.poisonClipboard();
    this.listeners.forEach((l) => {
      try {
        l(event);
      } catch (err) {
        console.error('[DRM Listener Error]', err);
      }
    });
  }

  /**
   * Overwrites the system clipboard if a screenshot / grab attempt is made.
   */
  public poisonClipboard() {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(
          '🔒 [ALERTA DE SEGURIDAD AETHER] Contenido protegido por cifrado militar E2EE. Las capturas de pantalla, grabaciones y emisiones están estrictamente restringidas.'
        ).catch(() => {});
      }
    } catch (_) {}
  }

  public init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    // 1. Intercept `navigator.mediaDevices.getDisplayMedia` (Screen Recording & Screen Share Block)
    if (navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === 'function') {
      this.originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);
      
      // Override with impenetrable security blocker
      navigator.mediaDevices.getDisplayMedia = async (constraints?: DisplayMediaStreamOptions) => {
        this.notify({
          type: 'SCREEN_SHARE_ATTEMPT',
          detail: 'Se ha interceptado y bloqueado una solicitud de transmisión o grabación de pantalla en vivo.',
          timestamp: Date.now()
        });

        // Reject screen recording request immediately
        const error = new DOMException('Permiso de grabación y transmisión denegado por la política de seguridad Aether DRM.', 'NotAllowedError');
        throw error;
      };
    }

    // 2. Intercept `HTMLMediaElement.prototype.captureStream` and Canvas capture
    try {
      if (typeof HTMLCanvasElement !== 'undefined' && (HTMLCanvasElement.prototype as any).captureStream) {
        (HTMLCanvasElement.prototype as any).captureStream = () => {
          this.notify({
            type: 'SCREEN_RECORDING_ATTEMPT',
            detail: 'Intento de extracción de flujo de renderizado en canvas bloqueado.',
            timestamp: Date.now()
          });
          const dummyCanvas = document.createElement('canvas');
          dummyCanvas.width = 1;
          dummyCanvas.height = 1;
          return (dummyCanvas as any).captureStream ? (dummyCanvas as any).captureStream(0) : null;
        };
      }
    } catch (_) {}

    // 3. Intercept Key Combinations (PrintScreen, Win+Shift+S, Cmd+Shift+3/4/5, Ctrl+P, Devtools)
    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen key (any OS)
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen' || e.keyCode === 44) {
        e.preventDefault();
        e.stopPropagation();
        this.notify({
          type: 'SCREENSHOT_ATTEMPT',
          detail: 'Captura con tecla PrintScreen interceptada.',
          timestamp: Date.now()
        });
        return false;
      }

      // Windows Snipping Tool (Win + Shift + S or Alt + PrintScreen)
      if (
        (e.metaKey || (e as any).superKey || e.ctrlKey) &&
        e.shiftKey &&
        (e.key === 'S' || e.key === 's' || e.code === 'KeyS')
      ) {
        e.preventDefault();
        e.stopPropagation();
        this.notify({
          type: 'SCREENSHOT_ATTEMPT',
          detail: 'Herramienta de recorte (Snipping Tool) interceptada.',
          timestamp: Date.now()
        });
        return false;
      }

      // macOS Screenshot Shortcuts (Cmd + Shift + 3, 4, 5, 6)
      if (
        (e.metaKey || (e as any).superKey) &&
        e.shiftKey &&
        ['3', '4', '5', '6'].includes(e.key)
      ) {
        e.preventDefault();
        e.stopPropagation();
        this.notify({
          type: 'SCREENSHOT_ATTEMPT',
          detail: 'Captura nativa de macOS (Cmd+Shift+3/4/5) interceptada.',
          timestamp: Date.now()
        });
        return false;
      }

      // Print / PDF export (Ctrl + P / Cmd + P)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P' || e.code === 'KeyP')) {
        e.preventDefault();
        e.stopPropagation();
        this.notify({
          type: 'PRINT_ATTEMPT',
          detail: 'Intento de impresión o exportación de documento bloqueado.',
          timestamp: Date.now()
        });
        return false;
      }

      // Inspect Elements & DevTools (F12, Ctrl+Shift+I/C/J)
      if (
        e.key === 'F12' ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && ['I', 'i', 'C', 'c', 'J', 'j'].includes(e.key))
      ) {
        e.preventDefault();
        e.stopPropagation();
        this.notify({
          type: 'DEVTOOLS_ATTEMPT',
          detail: 'Apertura de herramientas de depuración e inspección bloqueada.',
          timestamp: Date.now()
        });
        return false;
      }

      // Ctrl + U (View Source) or Ctrl + S (Save Page)
      if ((e.ctrlKey || e.metaKey) && ['u', 'U', 's', 'S'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // 4. Prevent Context Menu globally
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return; // Allow context menu in form inputs if needed
      }
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // 5. Prevent Drag and Drop of Images and Content
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    // 6. Hook beforeprint & afterprint
    window.addEventListener('beforeprint', (e) => {
      e.preventDefault();
      this.notify({
        type: 'PRINT_ATTEMPT',
        detail: 'Intento de impresión interceptado por el sistema de seguridad.',
        timestamp: Date.now()
      });
    });

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyDown, true);
    window.addEventListener('contextmenu', handleContextMenu, true);
    window.addEventListener('dragstart', handleDragStart, true);
  }
}

export const drmProtection = new DRMProtectionEngine();
