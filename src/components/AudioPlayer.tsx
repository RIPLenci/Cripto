import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, AlertCircle, RefreshCw, Download, Music } from 'lucide-react';

interface AudioPlayerProps {
  src: string;
  mimeType?: string;
  filename?: string;
  className?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, mimeType, filename, className = '' }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
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

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
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
          <div className="flex items-center gap-0.5 h-4 w-6 shrink-0 justify-center">
            {isPlaying ? (
              <>
                <span className="w-1 bg-[var(--accent)] rounded-full animate-bounce h-3" style={{ animationDelay: '0ms' }} />
                <span className="w-1 bg-[var(--accent)] rounded-full animate-bounce h-4" style={{ animationDelay: '150ms' }} />
                <span className="w-1 bg-[var(--accent)] rounded-full animate-bounce h-2" style={{ animationDelay: '300ms' }} />
              </>
            ) : (
              <Music className="w-3.5 h-3.5 text-slate-400" />
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
