import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, AlertCircle, RefreshCw, Download, Music } from 'lucide-react';

interface AudioPlayerProps {
  src: string;
  mimeType?: string;
  filename?: string;
  className?: string;
}

// Global AudioContext and source map to prevent re-instantiation limits
const sharedAudioCtx = { current: null as AudioContext | null };
const sourceNodeMap = new WeakMap<HTMLAudioElement, MediaElementAudioSourceNode>();

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, mimeType, filename, className = '' }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const barsRef = useRef<(HTMLSpanElement | null)[]>([]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  // Convert base64 Data URL to Blob Object URL for maximum browser compatibility
  useEffect(() => {
    let activeUrl: string | null = null;
    if (src.startsWith('data:')) {
      try {
        const parts = src.split(',');
        const mimeMatch = parts[0].match(/:(.*?);/);
        const type = mimeMatch ? mimeMatch[1] : (mimeType || 'audio/webm');
        const b64Data = parts[1];
        
        const byteCharacters = atob(b64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type });
        activeUrl = URL.createObjectURL(blob);
        setObjectUrl(activeUrl);
      } catch (err) {
        console.warn('Fallback to direct src for audio due to blob conversion:', err);
        setObjectUrl(src);
      }
    } else {
      setObjectUrl(src);
    }

    setHasError(false);
    setIsPlaying(false);
    setCurrentTime(0);

    return () => {
      if (activeUrl && activeUrl.startsWith('blob:')) {
        URL.revokeObjectURL(activeUrl);
      }
    };
  }, [src, mimeType]);

  const initWebAudio = () => {
    if (!audioRef.current) return;
    try {
      if (!sharedAudioCtx.current) {
        sharedAudioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (sharedAudioCtx.current.state === 'suspended') {
        sharedAudioCtx.current.resume();
      }

      if (!analyserRef.current) {
        analyserRef.current = sharedAudioCtx.current.createAnalyser();
        analyserRef.current.fftSize = 64; // Generates 32 bins, perfect for 5 bars
      }

      let source = sourceNodeMap.get(audioRef.current);
      if (!source) {
        source = sharedAudioCtx.current.createMediaElementSource(audioRef.current);
        sourceNodeMap.set(audioRef.current, source);
      }
      
      // Ensure clean connection
      try { source.disconnect(); } catch (e) {}
      
      source.connect(analyserRef.current);
      analyserRef.current.connect(sharedAudioCtx.current.destination);
    } catch (e) {
      console.warn("Web Audio API error (using fallback animation):", e);
    }
  };

  const drawVisualizer = () => {
    if (!analyserRef.current) return;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    const numBars = 5;
    const step = Math.floor((bufferLength / 2) / numBars); // Use lower half of frequencies for speech

    for (let i = 0; i < numBars; i++) {
      let sum = 0;
      for (let j = 0; j < step; j++) {
        sum += dataArray[i * step + j];
      }
      const average = sum / step;
      const height = Math.max(4, (average / 255) * 20); // 4px to 20px

      if (barsRef.current[i]) {
        barsRef.current[i]!.style.height = `${height}px`;
        barsRef.current[i]!.style.opacity = `${Math.max(0.4, average / 255)}`;
      }
    }
    
    animationRef.current = requestAnimationFrame(drawVisualizer);
  };

  useEffect(() => {
    if (isPlaying) {
      drawVisualizer();
    } else {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      // Reset heights gently
      for (let i = 0; i < 5; i++) {
        if (barsRef.current[i]) {
          barsRef.current[i]!.style.height = '4px';
          barsRef.current[i]!.style.opacity = '0.5';
        }
      }
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      initWebAudio();
      audioRef.current.play().catch(err => {
        console.error('Error al reproducir audio:', err);
        setHasError(true);
      });
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
      setHasError(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds) || !isFinite(timeInSeconds)) return '00:00';
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const reloadAudio = () => {
    setHasError(false);
    if (audioRef.current) {
      audioRef.current.load();
    }
  };

  return (
    <div className={`p-3 rounded-xl bg-slate-900/90 border border-slate-700/60 shadow-lg space-y-2 text-slate-100 ${className}`}>
      {/* Hidden audio element */}
      {objectUrl && (
        <audio
          ref={audioRef}
          src={objectUrl}
          crossOrigin="anonymous"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentTime(0);
          }}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onError={() => setHasError(true)}
          preload="metadata"
        />
      )}

      {hasError ? (
        <div className="flex items-center justify-between p-2 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-medium text-[11px]">Error en formato audio.</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={reloadAudio}
              className="p-1 hover:bg-rose-500/20 rounded-md text-rose-300 transition-colors"
              title="Reintentar reproducción"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <a
              href={src}
              download={filename || 'Nota_de_voz.webm'}
              className="p-1 hover:bg-rose-500/20 rounded-md text-rose-300 transition-colors"
              title="Descargar audio"
            >
              <Download className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2.5">
          {/* Play/Pause Button */}
          <button
            onClick={togglePlay}
            className="w-8 h-8 rounded-full bg-[var(--accent)] hover:opacity-90 text-white flex items-center justify-center shrink-0 shadow-md transition-all active:scale-95"
            title={isPlaying ? 'Pausar' : 'Reproducir'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          {/* Equalizer Animation / Icon */}
          <div className="flex items-center gap-[2px] h-6 w-8 shrink-0 justify-center">
            {isPlaying ? (
              <>
                {[0, 1, 2, 3, 4].map(i => (
                  <span
                    key={i}
                    ref={el => { barsRef.current[i] = el; }}
                    className="w-1 bg-[var(--accent)] rounded-full transition-all duration-75 ease-out"
                    style={{ height: '4px', opacity: 0.5 }}
                  />
                ))}
              </>
            ) : (
              <Music className="w-3.5 h-3.5 text-slate-400 self-center" />
            )}
          </div>

          {/* Progress Bar & Time */}
          <div className="flex-1 space-y-1">
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
            />
          </div>

          {/* Mute Button */}
          <button
            onClick={toggleMute}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors shrink-0"
            title={isMuted ? 'Activar sonido' : 'Silenciar'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      )}
    </div>
  );
};
