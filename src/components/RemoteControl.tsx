import { useState, useEffect } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize2, Settings, ChevronLeft, ChevronRight, Home, Search, Menu } from "lucide-react";

interface RemoteControlProps {
  playerRef: any;
  onPlay?: () => void;
  onPause?: () => void;
  onSeek?: (time: number) => void;
  onVolumeChange?: (volume: number) => void;
  onFullscreen?: () => void;
  currentTime?: number;
  duration?: number;
  volume?: number;
  isPlaying?: boolean;
}

const RemoteControl = ({ 
  playerRef, 
  onPlay, 
  onPause, 
  onSeek, 
  onVolumeChange, 
  onFullscreen, 
  currentTime = 0, 
  duration = 0, 
  volume = 1, 
  isPlaying = false 
}: RemoteControlProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle remote with "M" key
      if (e.key === 'm' || e.key === 'M') {
        setIsVisible(prev => !prev);
        return;
      }

      // If remote is not visible, don't handle other keys
      if (!isVisible) return;

      switch(e.key) {
        case ' ':
        case 'Spacebar':
          e.preventDefault();
          isPlaying ? onPause?.() : onPlay?.();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onSeek?.(Math.max(0, currentTime - 10));
          break;
        case 'ArrowRight':
          e.preventDefault();
          onSeek?.(Math.min(duration, currentTime + 10));
          break;
        case 'ArrowUp':
          e.preventDefault();
          onVolumeChange?.(Math.min(1, volume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          onVolumeChange?.(Math.max(0, volume - 0.1));
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          onFullscreen?.();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          setIsMuted(prev => !prev);
          onVolumeChange?.(isMuted ? 1 : 0);
          break;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      // Show remote on mouse movement
      if (!isVisible) {
        setIsVisible(true);
        clearTimeout(window.remoteTimeout);
        window.remoteTimeout = setTimeout(() => setIsVisible(false), 3000);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousemove', handleMouseMove);
      if (window.remoteTimeout) {
        clearTimeout(window.remoteTimeout);
      }
    };
  }, [isVisible, isPlaying, currentTime, duration, volume, onPlay, onPause, onSeek, onVolumeChange, onFullscreen, isMuted]);

  const handleVolumeToggle = () => {
    setIsMuted(!isMuted);
    onVolumeChange?.(isMuted ? 1 : 0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!isVisible) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-black/80 backdrop-blur-md text-white p-3 rounded-full hover:bg-black/90 transition-all"
          title="Mostrar Controle Remoto (M)"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-black/90 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-white/20 min-w-[320px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Controle Remoto
        </h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-white/60 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-white/60 text-xs mb-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2">
          <div 
            className="bg-[#00A8E1] h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <button
          onClick={() => onSeek?.(Math.max(0, currentTime - 10))}
          className="text-white/60 hover:text-white transition-colors p-2"
          title="Voltar 10s (←)"
        >
          <SkipBack className="w-5 h-5" />
        </button>
        
        <button
          onClick={isPlaying ? onPause : onPlay}
          className="bg-[#00A8E1] text-white p-3 rounded-full hover:bg-[#0090c0] transition-colors"
          title={isPlaying ? "Pausar (Espaço)" : "Play (Espaço)"}
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>
        
        <button
          onClick={() => onSeek?.(Math.min(duration, currentTime + 10))}
          className="text-white/60 hover:text-white transition-colors p-2"
          title="Avançar 10s (→)"
        >
          <SkipForward className="w-5 h-5" />
        </button>
      </div>

      {/* Volume Control */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={handleVolumeToggle}
          className="text-white/60 hover:text-white transition-colors p-2"
          title="Mudo (M)"
        >
          {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
        
        <div className="flex-1">
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              const newVolume = parseFloat(e.target.value);
              onVolumeChange?.(newVolume);
              setIsMuted(newVolume === 0);
            }}
            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #00A8E1 0%, #00A8E1 ${isMuted ? 0 : volume * 100}%, rgba(255,255,255,0.2) ${isMuted ? 0 : volume * 100}%, rgba(255,255,255,0.2) 100%)`
            }}
          />
        </div>
        
        <span className="text-white/60 text-xs w-8 text-right">
          {Math.round((isMuted ? 0 : volume) * 100)}%
        </span>
      </div>

      {/* Additional Controls */}
      <div className="flex items-center justify-between">
        <button
          onClick={onFullscreen}
          className="text-white/60 hover:text-white transition-colors p-2"
          title="Tela Cheia (F)"
        >
          <Maximize2 className="w-5 h-5" />
        </button>
        
        <div className="text-white/40 text-xs">
          Pressione M para fechar
        </div>
      </div>

      {/* Keyboard Shortcuts Info */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="text-white/40 text-xs space-y-1">
          <div className="flex justify-between">
            <span>Play/Pausar:</span>
            <span>Espaço</span>
          </div>
          <div className="flex justify-between">
            <span>Pular:</span>
            <span>← →</span>
          </div>
          <div className="flex justify-between">
            <span>Volume:</span>
            <span>↑ ↓</span>
          </div>
          <div className="flex justify-between">
            <span>Tela Cheia:</span>
            <span>F</span>
          </div>
          <div className="flex justify-between">
            <span>Mudo:</span>
            <span>M</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          background: #00A8E1;
          border-radius: 50%;
          cursor: pointer;
        }
        .slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          background: #00A8E1;
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
};

export default RemoteControl;
