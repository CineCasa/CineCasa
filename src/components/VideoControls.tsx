import { useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, Settings, SkipBack, SkipForward, RotateCcw } from 'lucide-react';

interface VideoControlsProps {
  player: any;
  currentTime: number;
  duration: number;
  volume: number;
  isPlaying: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onSeek?: (time: number) => void;
  onVolumeChange?: (volume: number) => void;
  onFullscreen?: () => void;
  onRewind?: () => void;
  onForward?: () => void;
}

const VideoControls: React.FC<VideoControlsProps> = ({
  player,
  currentTime,
  duration,
  volume,
  isPlaying,
  onPlay,
  onPause,
  onSeek,
  onVolumeChange,
  onFullscreen,
  onRewind,
  onForward,
}) => {
  const [showControls, setShowControls] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [quality, setQuality] = useState('auto');

  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(window.controlsTimeout);
      window.controlsTimeout = setTimeout(() => setShowControls(false), 3000);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      switch(e.key) {
        case ' ':
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
          e.preventDefault();
          onFullscreen?.();
          break;
        case 'm':
          e.preventDefault();
          setIsMuted(!isMuted);
          onVolumeChange?.(isMuted ? 1 : 0);
          break;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
      if (window.controlsTimeout) {
        clearTimeout(window.controlsTimeout);
      }
    };
  }, [isPlaying, currentTime, duration, volume, onPlay, onPause, onSeek, onVolumeChange, onFullscreen, isMuted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVolumeToggle = () => {
    setIsMuted(!isMuted);
    onVolumeChange?.(isMuted ? 1 : 0);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (player?.setPlaybackRate) {
      player.setPlaybackRate(speed);
    }
  };

  const handleQualityChange = (newQuality: string) => {
    setQuality(newQuality);
    if (player?.configure) {
      player.configure({ level: newQuality });
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickPercent = clickX / rect.width;
    const newTime = duration * clickPercent;
    onSeek?.(newTime);
  };

  if (!showControls) {
    return null;
  }

  return (
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none">
      {/* Top Controls */}
      <div className="absolute top-4 right-4 pointer-events-auto">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-all"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-16 right-4 bg-black/90 backdrop-blur-md rounded-lg p-4 pointer-events-auto min-w-[200px]">
          <h4 className="text-white font-semibold mb-3">Configurações</h4>
          
          {/* Speed Control */}
          <div className="mb-4">
            <label className="text-white/60 text-sm block mb-2">Velocidade</label>
            <div className="grid grid-cols-3 gap-2">
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                <button
                  key={speed}
                  onClick={() => handleSpeedChange(speed)}
                  className={`py-1 px-2 rounded text-xs transition-all ${
                    playbackSpeed === speed
                      ? 'bg-[#00A8E1] text-white'
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>

          {/* Quality Control */}
          <div>
            <label className="text-white/60 text-sm block mb-2">Qualidade</label>
            <div className="space-y-1">
              {['auto', '1080p', '720p', '480p', '360p'].map(q => (
                <button
                  key={q}
                  onClick={() => handleQualityChange(q)}
                  className={`w-full py-1 px-2 rounded text-xs text-left transition-all ${
                    quality === q
                      ? 'bg-[#00A8E1] text-white'
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  {q === 'auto' ? 'Automática' : q}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-auto">
        {/* Progress Bar */}
        <div className="mb-4">
          <div 
            className="relative w-full h-1 bg-white/20 rounded-full cursor-pointer group"
            onClick={handleProgressClick}
          >
            <div 
              className="absolute inset-y-0 left-0 bg-[#00A8E1] rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `${progress}%`, transform: 'translate(-50%, -50%)' }}
            />
          </div>
          <div className="flex justify-between text-white/60 text-xs mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Play/Pause */}
            <button
              onClick={isPlaying ? onPause : onPlay}
              className="text-white hover:text-[#00A8E1] transition-colors p-2"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>

            {/* Skip Back */}
            <button
              onClick={onRewind}
              className="text-white/80 hover:text-white transition-colors p-2"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            {/* Skip Forward */}
            <button
              onClick={onForward}
              className="text-white/80 hover:text-white transition-colors p-2"
            >
              <SkipForward className="w-5 h-5" />
            </button>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleVolumeToggle}
                className="text-white/80 hover:text-white transition-colors p-2"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              
              <div className="relative">
                <button
                  onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                  className="w-20 h-1 bg-white/20 rounded-full cursor-pointer"
                >
                  <div 
                    className="h-full bg-[#00A8E1] rounded-full"
                    style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                  />
                </button>
                
                {showVolumeSlider && (
                  <div className="absolute bottom-8 left-0 bg-black/90 backdrop-blur-md rounded-lg p-2">
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
                      className="w-32 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #00A8E1 0%, #00A8E1 ${isMuted ? 0 : volume * 100}%, rgba(255,255,255,0.2) ${isMuted ? 0 : volume * 100}%, rgba(255,255,255,0.2) 100%)`
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-4">
            {/* Current Speed/Quality Indicator */}
            <div className="text-white/60 text-sm">
              {playbackSpeed !== 1 && `${playbackSpeed}x`}
              {quality !== 'auto' && quality}
            </div>

            {/* Fullscreen */}
            <button
              onClick={onFullscreen}
              className="text-white/80 hover:text-white transition-colors p-2"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          background: #00A8E1;
          border-radius: 50%;
          cursor: pointer;
        }
        input[type="range"]::-moz-range-thumb {
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

export default VideoControls;
