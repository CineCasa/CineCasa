import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipBack, SkipForward, Settings, Subtitles, Gauge, PictureInPicture2, Cast, Users } from 'lucide-react';
import { CastButton } from './CastButton';

interface ClapprPlayerCDNProps {
  url: string;
  title: string;
  poster?: string;
  onClose: () => void;
  onNextEpisode?: () => void;
  hasNextEpisode?: boolean;
  historyItem?: any;
  onProgressUpdate?: (currentTime: number, duration: number) => void;
}

declare global {
  interface Window {
    Clappr?: any;
    LevelSelector?: any;
    PIPPlugin?: any;
    ChromecastPlugin?: any;
  }
}

const ClapprPlayerCDN: React.FC<ClapprPlayerCDNProps> = ({
  url,
  title,
  poster,
  onClose,
  onNextEpisode,
  hasNextEpisode,
  historyItem,
  onProgressUpdate,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load Clappr from CDN
  useEffect(() => {
    const loadClappr = async () => {
      if (window.Clappr) {
        setLoaded(true);
        return;
      }

      // Load Clappr CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/clappr@0.3.13/dist/clappr.min.css';
      document.head.appendChild(link);

      // Load Clappr JS
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/clappr@0.3.13/dist/clappr.min.js';
      script.onload = () => {
        // Load plugins after Clappr
        loadPlugins();
      };
      document.head.appendChild(script);
    };

    const loadPlugins = () => {
      // Load Level Selector for quality switching
      const levelScript = document.createElement('script');
      levelScript.src = 'https://cdn.jsdelivr.net/npm/clappr-level-selector-plugin@0.2.0/dist/clappr-level-selector-plugin.min.js';
      levelScript.onload = () => {
        setLoaded(true);
      };
      document.head.appendChild(levelScript);
    };

    loadClappr();

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, []);

  // Initialize player when Clappr is loaded
  useEffect(() => {
    if (!loaded || !containerRef.current || !window.Clappr) return;

    const player = new window.Clappr.Player({
      source: url,
      parentId: containerRef.current,
      width: '100%',
      height: '100%',
      autoPlay: true,
      poster: poster,
      mute: false,
      playback: {
        preload: 'metadata',
        controls: false, // We use custom controls
        playInline: true,
        recycleVideo: true,
      },
      events: {
        onReady: () => {
          setIsReady(true);
          setDuration(player.getDuration() || 0);
        },
        onPlay: () => setIsPlaying(true),
        onPause: () => setIsPlaying(false),
        onTimeUpdate: (pos: any) => {
          setCurrentTime(pos.current || 0);
          if (onProgressUpdate && pos.current && player.getDuration()) {
            onProgressUpdate(pos.current, player.getDuration());
          }
        },
        onVolumeUpdate: (vol: any) => {
          setVolume((vol.volume || 0) * 100);
          setIsMuted(vol.muted || false);
        },
        onFullscreen: () => setIsFullscreen(true),
        onExitFullscreen: () => setIsFullscreen(false),
        onError: (err: any) => console.error('[Clappr] Error:', err),
      },
    });

    playerRef.current = player;

    // Progress tracking
    progressIntervalRef.current = setInterval(() => {
      if (playerRef.current && isPlaying) {
        const current = playerRef.current.getCurrentTime();
        const dur = playerRef.current.getDuration();
        if (current && dur) {
          setCurrentTime(current);
          setDuration(dur);
        }
      }
    }, 1000);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      player.destroy();
    };
  }, [loaded, url, poster, onProgressUpdate, isPlaying]);

  // Auto-hide controls
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      if (isPlaying) {
        controlsTimeoutRef.current = setTimeout(() => {
          setShowControls(false);
        }, 3000);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying]);

  const togglePlayPause = useCallback(() => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pause();
      } else {
        playerRef.current.play();
      }
    }
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.mute(!isMuted);
    }
  }, [isMuted]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseInt(e.target.value);
    setVolume(vol);
    if (playerRef.current) {
      playerRef.current.setVolume(vol);
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const skip = useCallback((seconds: number) => {
    if (playerRef.current) {
      const current = playerRef.current.getCurrentTime();
      const newTime = Math.max(0, Math.min(current + seconds, duration));
      playerRef.current.seek(newTime);
      setCurrentTime(newTime);
    }
  }, [duration]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (playerRef.current) {
      playerRef.current.seek(time);
    }
  }, []);

  const changePlaybackRate = useCallback((rate: number) => {
    setPlaybackRate(rate);
    if (playerRef.current && playerRef.current.core) {
      const container = playerRef.current.core.getCurrentContainer();
      if (container && container.playback) {
        container.playback.el.playbackRate = rate;
      }
    }
    setShowSettings(false);
  }, []);

  const openWatchParty = useCallback(() => {
    const roomId = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 6);
    const videoUrlParam = encodeURIComponent(url);
    const watchUrl = `/watch.html?room=${roomId}&video=${videoUrlParam}`;
    window.open(watchUrl, '_blank');
  }, [url]);

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '0:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const playerContent = (
    <div className="fixed inset-0 bg-black z-50">
      {/* Loading Screen */}
      {!isReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-50">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4" />
          <p className="text-white/80">Carregando player...</p>
        </div>
      )}

      {/* Video Container */}
      <div 
        ref={containerRef}
        className="absolute inset-0"
        onClick={togglePlayPause}
      />

      {/* Custom Controls Overlay */}
      <div 
        className={`absolute inset-0 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <ChevronLeft size={28} className="text-white" />
              </button>
              <h2 className="text-white text-lg font-medium truncate max-w-md">{title}</h2>
            </div>
            
            {/* Assistir Juntos Button */}
            <button
              onClick={openWatchParty}
              className="flex items-center gap-2 px-4 py-2 bg-[#00A8E1] hover:bg-[#00A8E1]/80 rounded-full transition-colors text-white text-sm font-medium"
            >
              <Users size={18} />
              <span>Assistir Juntos</span>
            </button>
          </div>
        </div>

        {/* Center Play Button (when paused) */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={togglePlayPause}
              className="w-20 h-20 bg-[#00A8E1]/90 hover:bg-[#00A8E1] rounded-full flex items-center justify-center transition-transform hover:scale-110"
            >
              <Play size={40} className="text-white ml-1" fill="white" />
            </button>
          </div>
        )}

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-20 pb-4 px-4">
          {/* Progress Bar */}
          <div className="mb-4">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#00A8E1] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer hover:[&::-webkit-slider-thumb]:scale-125 transition-all"
              style={{
                background: `linear-gradient(to right, #00A8E1 ${progressPercent}%, rgba(255,255,255,0.3) ${progressPercent}%)`
              }}
            />
            <div className="flex justify-between text-white/80 text-sm mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Play/Pause */}
              <button
                onClick={togglePlayPause}
                className="p-3 hover:bg-white/20 rounded-full transition-colors"
              >
                {isPlaying ? (
                  <Pause size={24} className="text-white" fill="white" />
                ) : (
                  <Play size={24} className="text-white" fill="white" />
                )}
              </button>

              {/* Skip Backward */}
              <button
                onClick={() => skip(-10)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <SkipBack size={20} className="text-white" />
              </button>

              {/* Skip Forward */}
              <button
                onClick={() => skip(10)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <SkipForward size={20} className="text-white" />
              </button>

              {/* Volume */}
              <div className="flex items-center gap-2 group">
                <button
                  onClick={toggleMute}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX size={20} className="text-white" />
                  ) : (
                    <Volume2 size={20} className="text-white" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-0 group-hover:w-20 h-1 bg-white/30 rounded-full appearance-none cursor-pointer transition-all duration-300 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Playback Rate */}
              <div className="relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors relative"
                >
                  <Gauge size={20} className="text-white" />
                  <span className="absolute -top-1 -right-1 text-[10px] bg-[#00A8E1] rounded-full w-4 h-4 flex items-center justify-center text-white">
                    {playbackRate}x
                  </span>
                </button>
                
                {showSettings && (
                  <div className="absolute bottom-full right-0 mb-2 bg-black/90 backdrop-blur rounded-lg p-2 min-w-[120px]">
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => changePlaybackRate(rate)}
                        className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-white/10 transition-colors ${
                          playbackRate === rate ? 'text-[#00A8E1] font-bold' : 'text-white'
                        }`}
                      >
                        {rate === 1 ? 'Normal' : `${rate}x`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Subtitles */}
              <button className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <Subtitles size={20} className="text-white" />
              </button>

              {/* Chromecast */}
              <CastButton
                mediaInfo={{
                  contentId: url,
                  contentType: 'video/mp4',
                  title: title,
                  poster: poster,
                  currentTime: currentTime,
                  duration: duration,
                }}
                size="md"
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              />

              {/* Picture in Picture */}
              <button className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <PictureInPicture2 size={20} className="text-white" />
              </button>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                {isFullscreen ? (
                  <Minimize size={20} className="text-white" />
                ) : (
                  <Maximize size={20} className="text-white" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(playerContent, document.body);
};

export default ClapprPlayerCDN;
