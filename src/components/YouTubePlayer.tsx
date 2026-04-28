import React, { useRef, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, 
  SkipBack, SkipForward, Settings, Subtitles, PictureInPicture2,
  ChevronRight, ChevronLeft, RotateCcw
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { usePlayer } from '@/contexts/PlayerContext';
import { useElitePlayer } from '@/hooks/useElitePlayer';

interface YouTubePlayerProps {
  url: string;
  title: string;
  poster?: string;
  onClose: () => void;
  onNextEpisode?: () => void;
  onPreviousEpisode?: () => void;
  hasNextEpisode?: boolean;
  hasPreviousEpisode?: boolean;
  contentId?: string;
  contentType?: 'movie' | 'series';
  episodeId?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  resumeFrom?: number;
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ 
  url: originalUrl, 
  title, 
  poster, 
  onClose,
  onNextEpisode,
  onPreviousEpisode,
  hasNextEpisode,
  hasPreviousEpisode,
  contentId,
  contentType,
  episodeId,
  seasonNumber,
  episodeNumber,
  resumeFrom = 0
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const doubleClickRef = useRef({ count: 0, timer: null as NodeJS.Timeout | null, x: 0 });
  
  const { toggleMiniPlayer } = usePlayer();
  const { videoUrl } = useElitePlayer({
    url: originalUrl,
    contentId: contentId || '',
    contentType: contentType || 'movie',
    title,
    poster,
    episodeId,
    seasonNumber,
    episodeNumber,
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showSkipAnim, setShowSkipAnim] = useState<{show: boolean; side: 'left' | 'right' | null}>({show: false, side: null});
  const [hoverTime, setHoverTime] = useState(0);
  const [showHover, setShowHover] = useState(false);
  const [hoverX, setHoverX] = useState(0);

  // Auto-hide controls
  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true);
      return;
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
      setShowSettings(false);
    }, 3000);
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying, showControls]);

  // YouTube keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      const video = videoRef.current;
      if (!video) return;

      setShowControls(true);

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'arrowleft':
          e.preventDefault();
          video.currentTime -= 5;
          break;
        case 'arrowright':
          e.preventDefault();
          video.currentTime += 5;
          break;
        case 'j':
          e.preventDefault();
          video.currentTime -= 10;
          break;
        case 'l':
          e.preventDefault();
          video.currentTime += 10;
          break;
        case 'arrowup':
          e.preventDefault();
          video.volume = Math.min(1, video.volume + 0.05);
          setVolume(Math.round(video.volume * 100));
          break;
        case 'arrowdown':
          e.preventDefault();
          video.volume = Math.max(0, video.volume - 0.05);
          setVolume(Math.round(video.volume * 100));
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'i':
          e.preventDefault();
          toggleMiniPlayer();
          break;
        case 't':
          e.preventDefault();
          break;
        case 'n':
          e.preventDefault();
          if (hasNextEpisode && onNextEpisode) onNextEpisode();
          break;
        case 'p':
          e.preventDefault();
          if (hasPreviousEpisode && onPreviousEpisode) onPreviousEpisode();
          break;
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          e.preventDefault();
          video.currentTime = (video.duration || 0) * (parseInt(e.key) / 10);
          break;
        case '>':
          e.preventDefault();
          changeSpeed(1);
          break;
        case '<':
          e.preventDefault();
          changeSpeed(-1);
          break;
        case 'escape':
          if (isFullscreen) {
            e.preventDefault();
            toggleFullscreen();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, hasNextEpisode, onNextEpisode, hasPreviousEpisode, onPreviousEpisode, isFullscreen]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    isPlaying ? video.pause() : video.play();
  }, [isPlaying]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video) {
      setCurrentTime(video.currentTime);
      setDuration(video.duration || 0);
    }
  };

  const handleProgress = () => {
    const video = videoRef.current;
    if (video && video.buffered.length > 0) {
      setIsBuffering(video.currentTime >= video.buffered.end(video.buffered.length - 1) - 0.5 && !video.paused);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !videoRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = pos * (videoRef.current.duration || 0);
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleProgressHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverTime(pos * duration);
    setHoverX(e.clientX - rect.left);
    setShowHover(true);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (video) {
      video.muted = !video.muted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (video) {
      const vol = parseInt(e.target.value);
      video.volume = vol / 100;
      setVolume(vol);
      if (vol > 0 && video.muted) {
        video.muted = false;
        setIsMuted(false);
      }
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await (containerRef.current || document.documentElement).requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  const changeSpeed = (direction: number) => {
    const video = videoRef.current;
    if (!video) return;
    const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
    const idx = speeds.indexOf(video.playbackRate);
    const newIdx = Math.max(0, Math.min(speeds.length - 1, idx + direction));
    video.playbackRate = speeds[newIdx];
    setPlaybackRate(speeds[newIdx]);
  };

  const setSpeed = (speed: number) => {
    const video = videoRef.current;
    if (video) {
      video.playbackRate = speed;
      setPlaybackRate(speed);
    }
    setShowSettings(false);
  };

  // Double-click handler for YouTube-style skip
  const handleVideoClick = (e: React.MouseEvent) => {
    const video = videoRef.current;
    if (!video) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const isLeftSide = clickX < rect.width / 2;

    if (doubleClickRef.current.timer) clearTimeout(doubleClickRef.current.timer);

    doubleClickRef.current.count++;

    if (doubleClickRef.current.count === 1) {
      doubleClickRef.current.timer = setTimeout(() => {
        doubleClickRef.current.count = 0;
        togglePlay();
      }, 250);
    } else if (doubleClickRef.current.count === 2) {
      doubleClickRef.current.count = 0;
      clearTimeout(doubleClickRef.current.timer!);
      
      video.currentTime += isLeftSide ? -10 : 10;
      
      setShowSkipAnim({show: true, side: isLeftSide ? 'left' : 'right'});
      setTimeout(() => setShowSkipAnim({show: false, side: null}), 800);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return hrs > 0 
      ? `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      : `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return createPortal(
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-black z-[9999]"
      onMouseMove={() => {
        setShowControls(true);
        if (isPlaying) {
          if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
          controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
        }
      }}
    >
      {/* Video Container */}
      <div className="absolute inset-0 flex items-center justify-center">
        <video
          ref={videoRef}
          src={videoUrl || originalUrl}
          poster={poster}
          className="w-full h-full object-contain"
          onTimeUpdate={handleTimeUpdate}
          onProgress={handleProgress}
          onClick={handleVideoClick}
          playsInline
          preload="metadata"
        />
      </div>

      {/* Header Bar */}
      <div className={`absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent z-10 transition-opacity ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition"
          >
            <ChevronLeft size={28} className="text-white" />
          </button>
          <h2 className="text-white font-medium text-lg truncate max-w-lg">{title}</h2>
        </div>
      </div>

      {/* Buffering Spinner */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="w-12 h-12 border-4 border-white/20 border-t-red-600 rounded-full animate-spin" />
        </div>
      )}

      {/* Skip Animation Overlays */}
      {showSkipAnim.show && showSkipAnim.side === 'left' && (
        <div className="absolute left-0 top-0 bottom-0 w-1/3 bg-gradient-to-r from-black/40 to-transparent flex items-center justify-center z-20 animate-pulse">
          <div className="flex flex-col items-center">
            <SkipBack size={48} className="text-white" />
            <span className="text-white text-2xl font-bold mt-2">10s</span>
          </div>
        </div>
      )}
      {showSkipAnim.show && showSkipAnim.side === 'right' && (
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-black/40 to-transparent flex items-center justify-center z-20 animate-pulse">
          <div className="flex flex-col items-center">
            <SkipForward size={48} className="text-white" />
            <span className="text-white text-2xl font-bold mt-2">10s</span>
          </div>
        </div>
      )}

      {/* Center Play Button (paused) */}
      {!isPlaying && !isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <button
            onClick={togglePlay}
            className="pointer-events-auto w-20 h-20 bg-red-600/90 hover:bg-red-600 rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-2xl"
          >
            <Play size={40} className="text-white ml-1" fill="white" />
          </button>
        </div>
      )}

      {/* Controls Overlay */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent pt-16 pb-4 px-4 z-30 transition-opacity ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        
        {/* Progress Bar */}
        <div 
          ref={progressRef}
          className="relative w-full h-2 mb-4 cursor-pointer group"
          onClick={handleSeek}
          onMouseMove={handleProgressHover}
          onMouseLeave={() => setShowHover(false)}
        >
          {/* Hover Preview Tooltip */}
          {showHover && duration > 0 && (
            <div 
              className="absolute -top-12 bg-black/90 text-white text-xs px-2 py-1 rounded transform -translate-x-1/2 pointer-events-none"
              style={{ left: hoverX }}
            >
              {formatTime(hoverTime)}
            </div>
          )}
          
          {/* Background Track */}
          <div className="absolute inset-0 bg-white/20 rounded-full overflow-hidden">
            {/* Progress Fill */}
            <div 
              className="h-full bg-red-600 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          
          {/* Draggable Thumb (visible on hover) */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
            style={{ left: `calc(${progressPercent}% - 8px)` }}
          />
        </div>

        {/* Time Display */}
        <div className="flex justify-between text-white/80 text-xs mb-3">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Control Buttons Row */}
        <div className="flex items-center justify-between">
          {/* Left Controls */}
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <button 
              onClick={togglePlay}
              className="p-2 hover:bg-white/20 rounded-full transition"
            >
              {isPlaying ? (
                <Pause size={28} className="text-white" fill="white" />
              ) : (
                <Play size={28} className="text-white ml-1" fill="white" />
              )}
            </button>

            {/* Previous Episode */}
            {hasPreviousEpisode && onPreviousEpisode && (
              <button 
                onClick={onPreviousEpisode}
                className="p-2 hover:bg-white/20 rounded-full transition hidden sm:block"
                title="Episódio anterior (P)"
              >
                <SkipBack size={24} className="text-white" />
              </button>
            )}

            {/* Skip Backward */}
            <button 
              onClick={() => { const v = videoRef.current; if (v) v.currentTime -= 10; }}
              className="p-2 hover:bg-white/20 rounded-full transition hidden sm:block"
              title="Voltar 10s (J)"
            >
              <RotateCcw size={20} className="text-white" />
            </button>

            {/* Skip Forward */}
            <button 
              onClick={() => { const v = videoRef.current; if (v) v.currentTime += 10; }}
              className="p-2 hover:bg-white/20 rounded-full transition hidden sm:block"
              title="Avançar 10s (L)"
            >
              <RotateCcw size={20} className="text-white scale-x-[-1]" />
            </button>

            {/* Next Episode */}
            {hasNextEpisode && onNextEpisode && (
              <button 
                onClick={onNextEpisode}
                className="p-2 hover:bg-white/20 rounded-full transition hidden sm:block"
                title="Próximo episódio (N)"
              >
                <ChevronRight size={24} className="text-white" />
              </button>
            )}

            {/* Volume Control */}
            <div className="flex items-center gap-2 group">
              <button 
                onClick={toggleMute}
                className="p-2 hover:bg-white/20 rounded-full transition"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX size={24} className="text-white" />
                ) : (
                  <Volume2 size={24} className="text-white" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-0 group-hover:w-24 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer transition-all [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
              />
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Playback Speed Button */}
            <div className="relative">
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 hover:bg-white/20 rounded-full transition"
                title="Velocidade"
              >
                <span className="text-white text-sm font-medium">{playbackRate}x</span>
              </button>
              
              {/* Speed Menu */}
              {showSettings && (
                <div className="absolute bottom-full right-0 mb-2 bg-black/95 rounded-lg p-2 min-w-[100px] shadow-xl border border-white/10">
                  {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => setSpeed(speed)}
                      className={`w-full text-left px-3 py-2 text-sm rounded transition ${
                        playbackRate === speed ? 'bg-red-600 text-white' : 'text-white hover:bg-white/10'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Subtitles Toggle */}
            <button 
              onClick={() => setShowSubtitles(!showSubtitles)}
              className={`p-2 hover:bg-white/20 rounded-full transition ${showSubtitles ? 'bg-white/20' : ''}`}
              title="Legendas (C)"
            >
              <Subtitles size={24} className="text-white" />
            </button>

            {/* Mini Player */}
            <button 
              onClick={toggleMiniPlayer}
              className="p-2 hover:bg-white/20 rounded-full transition hidden sm:block"
              title="Mini player (I)"
            >
              <PictureInPicture2 size={24} className="text-white" />
            </button>

            {/* Fullscreen */}
            <button 
              onClick={toggleFullscreen}
              className="p-2 hover:bg-white/20 rounded-full transition"
              title="Tela cheia (F)"
            >
              {isFullscreen ? (
                <Minimize size={24} className="text-white" />
              ) : (
                <Maximize size={24} className="text-white" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default YouTubePlayer;
