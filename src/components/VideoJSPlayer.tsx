import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipBack, SkipForward, Settings, Subtitles, Gauge, PictureInPicture2, Cast, Users, MonitorPlay } from 'lucide-react';

interface VideoJSPlayerProps {
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
    videojs?: any;
  }
}

const VideoJSPlayer: React.FC<VideoJSPlayerProps> = ({
  url,
  title,
  poster,
  onClose,
  onNextEpisode,
  hasNextEpisode,
  historyItem,
  onProgressUpdate,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
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
  const [showQuality, setShowQuality] = useState(false);
  const [qualities, setQualities] = useState<Array<{label: string; value: string}>>([]);
  const [currentQuality, setCurrentQuality] = useState<string>('auto');
  const [loaded, setLoaded] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load Video.js from CDN
  useEffect(() => {
    const loadVideoJS = async () => {
      if (window.videojs) {
        setLoaded(true);
        return;
      }

      // Load Video.js CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://vjs.zencdn.net/8.6.1/video-js.css';
      document.head.appendChild(link);

      // Load Video.js
      const script = document.createElement('script');
      script.src = 'https://vjs.zencdn.net/8.6.1/video.min.js';
      script.onload = () => {
        setLoaded(true);
      };
      document.head.appendChild(script);
    };

    loadVideoJS();

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
      }
    };
  }, []);

  // Initialize player when Video.js is loaded
  useEffect(() => {
    if (!loaded || !videoRef.current || !window.videojs) return;

    const player = window.videojs(videoRef.current, {
      html5: {
        vhs: {
          overrideNative: true,
          limitRenditionByPlayerDimensions: true,
          useDevicePixelRatio: true,
        },
      },
      autoplay: true,
      controls: false, // Custom controls
      fluid: true,
      preload: 'auto',
    });

    playerRef.current = player;

    // Player events
    player.on('ready', () => {
      setIsReady(true);
      setDuration(player.duration() || 0);
      
      // Extract quality levels
      if (player.qualityLevels) {
        const qualityLevels = player.qualityLevels();
        const levels: Array<{label: string; value: string}> = [];
        
        for (let i = 0; i < qualityLevels.length; i++) {
          const level = qualityLevels[i];
          levels.push({
            label: `${level.height}p`,
            value: String(i),
          });
        }
        
        if (levels.length > 0) {
          levels.unshift({ label: 'Auto', value: 'auto' });
          setQualities(levels);
        }
      }
    });

    player.on('play', () => setIsPlaying(true));
    player.on('pause', () => setIsPlaying(false));
    player.on('timeupdate', () => {
      const current = player.currentTime() || 0;
      const dur = player.duration() || 0;
      setCurrentTime(current);
      setDuration(dur);
      
      if (onProgressUpdate && current && dur) {
        onProgressUpdate(current, dur);
      }
    });
    player.on('volumechange', () => {
      setVolume((player.volume() || 0) * 100);
      setIsMuted(player.muted() || false);
    });
    player.on('fullscreenchange', () => {
      setIsFullscreen(player.isFullscreen() || false);
    });
    player.on('progress', () => {
      const buf = player.buffered();
      if (buf && buf.length > 0) {
        setBuffered(buf.end(buf.length - 1));
      }
    });

    return () => {
      player.dispose();
    };
  }, [loaded, url, poster, onProgressUpdate]);

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
      playerRef.current.muted(!isMuted);
    }
  }, [isMuted]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseInt(e.target.value);
    setVolume(vol);
    if (playerRef.current) {
      playerRef.current.volume(vol / 100);
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (playerRef.current) {
      if (isFullscreen) {
        playerRef.current.exitFullscreen();
      } else {
        playerRef.current.requestFullscreen();
      }
    }
  }, [isFullscreen]);

  const skip = useCallback((seconds: number) => {
    if (playerRef.current) {
      const current = playerRef.current.currentTime();
      const newTime = Math.max(0, Math.min(current + seconds, duration));
      playerRef.current.currentTime(newTime);
      setCurrentTime(newTime);
    }
  }, [duration]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (playerRef.current) {
      playerRef.current.currentTime(time);
    }
  }, []);

  const changePlaybackRate = useCallback((rate: number) => {
    setPlaybackRate(rate);
    if (playerRef.current) {
      playerRef.current.playbackRate(rate);
    }
    setShowSettings(false);
  }, []);

  const changeQuality = useCallback((quality: string) => {
    setCurrentQuality(quality);
    if (playerRef.current && playerRef.current.qualityLevels) {
      const qualityLevels = playerRef.current.qualityLevels();
      if (quality === 'auto') {
        qualityLevels.enabled_ = true;
      } else {
        const index = parseInt(quality);
        for (let i = 0; i < qualityLevels.length; i++) {
          qualityLevels[i].enabled = (i === index);
        }
      }
    }
    setShowQuality(false);
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
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0;

  const playerContent = (
    <div className="fixed inset-0 bg-black z-50">
      {/* Loading Screen */}
      {!isReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-50">
          <div className="w-16 h-16 border-4 border-[#00A8E1]/20 border-t-[#00A8E1] rounded-full animate-spin mb-4" />
          <p className="text-white/80 text-lg">Carregando player...</p>
        </div>
      )}

      {/* Video Element */}
      <div className="absolute inset-0">
        <video
          ref={videoRef}
          className="video-js vjs-fluid vjs-big-play-centered"
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          poster={poster}
          preload="auto"
        >
          <source src={url} type="application/x-mpegURL" />
          <source src={url} type="video/mp4" />
        </video>
      </div>

      {/* Custom Controls Overlay */}
      <div 
        className={`absolute inset-0 transition-opacity duration-300 z-40 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={togglePlayPause}
      >
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/90 via-black/50 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <ChevronLeft size={28} className="text-white" />
              </button>
              <h2 className="text-white text-lg font-medium truncate max-w-md">{title}</h2>
            </div>
            
            {/* Assistir Juntos Button */}
            <button
              onClick={(e) => { e.stopPropagation(); openWatchParty(); }}
              className="flex items-center gap-2 px-4 py-2 bg-[#00A8E1] hover:bg-[#00A8E1]/80 rounded-full transition-colors text-white text-sm font-medium"
            >
              <Users size={18} />
              <span>Assistir Juntos</span>
            </button>
          </div>
        </div>

        {/* Center Play Button (when paused) */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <button
              onClick={(e) => { e.stopPropagation(); togglePlayPause(); }}
              className="w-24 h-24 bg-[#00A8E1]/90 hover:bg-[#00A8E1] rounded-full flex items-center justify-center transition-transform hover:scale-110 pointer-events-auto shadow-2xl"
            >
              <Play size={48} className="text-white ml-2" fill="white" />
            </button>
          </div>
        )}

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent pt-24 pb-6 px-6">
          {/* Progress Bar Container */}
          <div className="mb-6 group">
            {/* Buffered bar */}
            <div className="relative w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="absolute h-full bg-white/30 rounded-full"
                style={{ width: `${bufferedPercent}%` }}
              />
              {/* Progress bar */}
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={(e) => { e.stopPropagation(); handleSeek(e); }}
                onClick={(e) => e.stopPropagation()}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              {/* Visual progress */}
              <div 
                className="absolute h-full bg-[#00A8E1] rounded-full"
                style={{ width: `${progressPercent}%` }}
              >
                {/* Handle */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#00A8E1] rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg transform scale-0 group-hover:scale-100" />
              </div>
            </div>
            
            {/* Time Display */}
            <div className="flex justify-between text-white/80 text-sm mt-2 font-medium">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Play/Pause */}
              <button
                onClick={(e) => { e.stopPropagation(); togglePlayPause(); }}
                className="p-3 hover:bg-white/20 rounded-full transition-colors"
              >
                {isPlaying ? (
                  <Pause size={28} className="text-white" fill="white" />
                ) : (
                  <Play size={28} className="text-white" fill="white" />
                )}
              </button>

              {/* Skip Backward */}
              <button
                onClick={(e) => { e.stopPropagation(); skip(-10); }}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <SkipBack size={24} className="text-white" />
              </button>

              {/* Skip Forward */}
              <button
                onClick={(e) => { e.stopPropagation(); skip(10); }}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <SkipForward size={24} className="text-white" />
              </button>

              {/* Volume */}
              <div className="flex items-center gap-2 group">
                <button
                  onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX size={22} className="text-white" />
                  ) : (
                    <Volume2 size={22} className="text-white" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => { e.stopPropagation(); handleVolumeChange(e); }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-0 group-hover:w-24 h-1 bg-white/30 rounded-full appearance-none cursor-pointer transition-all duration-300 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                />
              </div>

              {/* Quality Selector */}
              {qualities.length > 0 && (
                <div className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowQuality(!showQuality); setShowSettings(false); }}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    {currentQuality === 'auto' ? 'Auto' : qualities.find(q => q.value === currentQuality)?.label || currentQuality}
                  </button>
                  
                  {showQuality && (
                    <div 
                      className="absolute bottom-full left-0 mb-2 bg-black/95 backdrop-blur rounded-lg p-2 min-w-[100px] shadow-2xl border border-white/10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {qualities.map((quality) => (
                        <button
                          key={quality.value}
                          onClick={() => changeQuality(quality.value)}
                          className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                            currentQuality === quality.value ? 'bg-[#00A8E1] text-white font-medium' : 'text-white hover:bg-white/10'
                          }`}
                        >
                          {quality.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Playback Rate */}
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); setShowQuality(false); }}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors relative"
                >
                  <Gauge size={22} className="text-white" />
                  <span className="absolute -top-1 -right-1 text-[9px] bg-[#00A8E1] rounded-full w-4 h-4 flex items-center justify-center text-white font-bold">
                    {playbackRate}x
                  </span>
                </button>
                
                {showSettings && (
                  <div 
                    className="absolute bottom-full right-0 mb-2 bg-black/95 backdrop-blur rounded-lg p-2 min-w-[100px] shadow-2xl border border-white/10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => changePlaybackRate(rate)}
                        className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                          playbackRate === rate ? 'bg-[#00A8E1] text-white font-medium' : 'text-white hover:bg-white/10'
                        }`}
                      >
                        {rate === 1 ? 'Normal' : `${rate}x`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Subtitles */}
              <button 
                onClick={(e) => e.stopPropagation()}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <Subtitles size={22} className="text-white" />
              </button>

              {/* Picture in Picture */}
              <button 
                onClick={(e) => e.stopPropagation()}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <PictureInPicture2 size={22} className="text-white" />
              </button>

              {/* Fullscreen */}
              <button
                onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                {isFullscreen ? (
                  <Minimize size={22} className="text-white" />
                ) : (
                  <Maximize size={22} className="text-white" />
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

export default VideoJSPlayer;
