import React, { useEffect, useRef, useState, useCallback } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import 'videojs-youtube';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  Settings, 
  SkipBack, 
  SkipForward, 
  X, 
  PictureInPicture, 
  Subtitles, 
  Hd, 
  MoreVertical,
  Rewind,
  FastForward,
  Cast
} from 'lucide-react';
import screenCastService, { CastDevice } from '../services/screenCastService';

interface VideoJSPlayerProps {
  url: string;
  title: string;
  poster?: string;
  onClose: () => void;
  contentId?: string;
  contentType?: string;
  episodeId?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  resumeFrom?: number;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

interface QualityLevel {
  height: number;
  width: number;
  bitrate: number;
  label: string;
}

interface SettingsMenu {
  quality: boolean;
  speed: boolean;
  subtitles: boolean;
  main: boolean;
}

export default function VideoJSPlayer({
  url,
  title,
  poster,
  onClose,
  resumeFrom = 0,
  onNext,
  onPrevious,
  hasNext = false,
  hasPrevious = false
}: VideoJSPlayerProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettings, setShowSettings] = useState<SettingsMenu>({ quality: false, speed: false, subtitles: false, main: false });
  const [buffered, setBuffered] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [qualityLevels, setQualityLevels] = useState<QualityLevel[]>([]);
  const [currentQuality, setCurrentQuality] = useState<string>('Auto');
  const [isPiP, setIsPiP] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);
  const [subtitleTracks, setSubtitleTracks] = useState<any[]>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState<string>('off');
  const [castDevices, setCastDevices] = useState<CastDevice[]>([]);
  const [isCasting, setIsCasting] = useState(false);
  const [showCastMenu, setShowCastMenu] = useState(false);

  useEffect(() => {
    if (!videoRef.current) return;

    const videoElement = document.createElement('video-js');
    videoElement.classList.add('vjs-big-play-centered');
    videoRef.current.appendChild(videoElement);

    // Detectar tipo de vídeo e configurar fonte apropriada
    const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
    const videoType = getVideoType(url);

    const playerOptions: any = {
      html5: {
        vhs: {
          overrideNative: true,
          limitRenditionByPlayerDimensions: true,
          useDevicePixelRatio: true,
          smoothQualityChange: true,
          handlePartialData: true,
          enableLowInitialPlaylist: true
        },
        nativeAudioTracks: false,
        nativeVideoTracks: false,
        hls: {
          overrideNative: true
        }
      },
      controls: false,
      fluid: true,
      responsive: true,
      preload: 'auto',
      poster: poster,
      playbackRates: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
      techOrder: isYouTube ? ['youtube', 'html5'] : ['html5'],
      sources: [{
        src: url,
        type: videoType
      }],
      youtube: {
        ytControls: 0,
        customVars: {
          wmode: 'transparent',
          rel: 0,
          showinfo: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          disablekb: 1
        }
      },
      controlBar: {
        children: []
      }
    };

    const player = videojs(videoElement, playerOptions, () => {
      console.log('[VideoJS] Player ready');
      setIsLoading(false);
      
      // Carregar quality levels
      if (player.qualityLevels) {
        const ql = player.qualityLevels();
        const levels: QualityLevel[] = [];
        for (let i = 0; i < ql.length; i++) {
          const level = ql[i];
          levels.push({
            height: level.height,
            width: level.width,
            bitrate: level.bitrate,
            label: `${level.height}p`
          });
        }
        setQualityLevels(levels);
      }

      // Carregar legendas
      if (player.textTracks()) {
        const tracks: any[] = [];
        const textTracks = player.textTracks();
        for (let i = 0; i < textTracks.length; i++) {
          const track = textTracks[i];
          if (track.kind === 'subtitles' || track.kind === 'captions') {
            tracks.push({
              id: track.id,
              label: track.label || `Track ${i + 1}`,
              language: track.language
            });
          }
        }
        setSubtitleTracks(tracks);
      }

      if (resumeFrom > 0) {
        player.currentTime(resumeFrom);
      }
      player.play().catch((err: any) => {
        console.log('[VideoJS] Autoplay prevented:', err);
      });
    });

    playerRef.current = player;

    // Event listeners
    player.on('play', () => setIsPlaying(true));
    player.on('pause', () => setIsPlaying(false));
    player.on('timeupdate', () => {
      setCurrentTime(player.currentTime() || 0);
      setDuration(player.duration() || 0);
      const buf = player.buffered();
      if (buf && buf.length > 0) {
        setBuffered(buf.end(buf.length - 1));
      }
    });
    player.on('volumechange', () => {
      setVolume(player.volume() || 0);
      setIsMuted(player.muted() || false);
    });
    player.on('fullscreenchange', () => {
      setIsFullscreen(player.isFullscreen());
    });
    player.on('waiting', () => setIsLoading(true));
    player.on('playing', () => setIsLoading(false));
    player.on('loadedmetadata', () => {
      setDuration(player.duration() || 0);
    });
    player.on('ratechange', () => {
      setPlaybackRate(player.playbackRate());
    });
    player.on('enterpictureinpicture', () => setIsPiP(true));
    player.on('leavepictureinpicture', () => setIsPiP(false));

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [url, poster, resumeFrom]);

  // Initialize screen cast service
  useEffect(() => {
    screenCastService.initialize().then(() => {
      setCastDevices(screenCastService.getAvailableDevices());
    });

    const handleCastStateChange = () => {
      setCastDevices(screenCastService.getAvailableDevices());
      setIsCasting(screenCastService.isCasting());
    };

    screenCastService.on('castStateChanged', handleCastStateChange);
    screenCastService.on('connected', handleCastStateChange);
    screenCastService.on('disconnected', handleCastStateChange);

    return () => {
      screenCastService.off('castStateChanged', handleCastStateChange);
      screenCastService.off('connected', handleCastStateChange);
      screenCastService.off('disconnected', handleCastStateChange);
    };
  }, []);

  const togglePiP = useCallback(() => {
    if (!playerRef.current) return;
    const videoElement = playerRef.current.el().querySelector('video');
    if (!videoElement) return;

    if (document.pictureInPictureElement) {
      document.exitPictureInPicture();
    } else if (videoElement.requestPictureInPicture) {
      videoElement.requestPictureInPicture();
    }
  }, []);

  const changeQuality = useCallback((index: number) => {
    if (!playerRef.current) return;
    const ql = playerRef.current.qualityLevels();
    if (!ql) return;

    if (index === -1) {
      // Auto
      for (let i = 0; i < ql.length; i++) {
        ql[i].enabled = true;
      }
      setCurrentQuality('Auto');
    } else {
      for (let i = 0; i < ql.length; i++) {
        ql[i].enabled = (i === index);
      }
      setCurrentQuality(qualityLevels[index]?.label || 'Auto');
    }
    setShowSettings({ ...showSettings, quality: false });
  }, [qualityLevels, showSettings]);

  const changeSubtitle = useCallback((trackId: string) => {
    if (!playerRef.current) return;
    const textTracks = playerRef.current.textTracks();
    
    for (let i = 0; i < textTracks.length; i++) {
      const track = textTracks[i];
      if (track.kind === 'subtitles' || track.kind === 'captions') {
        track.mode = (track.id === trackId) ? 'showing' : 'hidden';
      }
    }
    setCurrentSubtitle(trackId);
    setShowSettings({ ...showSettings, subtitles: false });
  }, [showSettings]);

  const changeSpeed = useCallback((rate: number) => {
    if (!playerRef.current) return;
    playerRef.current.playbackRate(rate);
    setPlaybackRate(rate);
    setShowSettings({ ...showSettings, speed: false });
  }, [showSettings]);

  const handleCastConnect = useCallback(async (deviceId: string) => {
    const success = await screenCastService.connect(deviceId);
    if (success) {
      // Load media on cast device
      await screenCastService.loadMedia({
        contentId: url,
        contentType: getVideoType(url),
        title: title,
        poster: poster,
        duration: duration,
        currentTime: currentTime
      });
    }
    setShowCastMenu(false);
  }, [url, title, poster, duration, currentTime]);

  const handleCastDisconnect = useCallback(async () => {
    await screenCastService.disconnect();
    setShowCastMenu(false);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!playerRef.current) return;
      
      // Don't trigger shortcuts if user is typing in an input
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      
      switch (e.key.toLowerCase()) {
        case 'escape':
          if (isFullscreen) {
            playerRef.current.exitFullscreen();
          } else {
            onClose();
          }
          break;
        case ' ':
        case 'k':
          e.preventDefault();
          if (isPlaying) playerRef.current.pause();
          else playerRef.current.play();
          break;
        case 'f':
          e.preventDefault();
          if (isFullscreen) playerRef.current.exitFullscreen();
          else playerRef.current.requestFullscreen();
          break;
        case 'm':
          playerRef.current.muted(!isMuted);
          break;
        case 'p':
          e.preventDefault();
          togglePiP();
          break;
        case 'c':
          e.preventDefault();
          if (castDevices.length > 0) {
            setShowCastMenu(!showCastMenu);
          }
          break;
        case 'arrowright':
        case 'l':
          e.preventDefault();
          playerRef.current.currentTime(currentTime + 5);
          break;
        case 'arrowleft':
        case 'j':
          e.preventDefault();
          playerRef.current.currentTime(currentTime - 5);
          break;
        case 'arrowup':
          e.preventDefault();
          const newVolUp = Math.min(1, volume + 0.1);
          playerRef.current.volume(newVolUp);
          break;
        case 'arrowdown':
          e.preventDefault();
          const newVolDown = Math.max(0, volume - 0.1);
          playerRef.current.volume(newVolDown);
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
          const percent = parseInt(e.key) * 10;
          playerRef.current.currentTime((duration * percent) / 100);
          break;
        case '>':
          e.preventDefault();
          playerRef.current.playbackRate(Math.min(2, playbackRate + 0.25));
          break;
        case '<':
          e.preventDefault();
          playerRef.current.playbackRate(Math.max(0.25, playbackRate - 0.25));
          break;
        case '.':
          e.preventDefault();
          onNext?.();
          break;
        case ',':
          e.preventDefault();
          onPrevious?.();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isFullscreen, isPlaying, currentTime, volume, isMuted, duration, playbackRate, togglePiP, onNext, onPrevious, castDevices, showCastMenu]);

  const fmt = (s: number) => { if (!s || isNaN(s)) return '0:00'; const h = Math.floor(s/3600); const m = Math.floor((s%3600)/60); const sec = Math.floor(s%60); return h > 0 ? `${h}:${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}` : `${m}:${sec.toString().padStart(2,'0')}`; };

  const handleProgressHover = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || duration === 0) return;
    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    const time = percent * duration;
    setPreviewTime(time);
    setShowPreview(true);
  }, [duration]);

  const handleProgressLeave = useCallback(() => {
    setShowPreview(false);
  }, []);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !playerRef.current || duration === 0) return;
    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    const time = percent * duration;
    playerRef.current.currentTime(time);
    setCurrentTime(time);
  }, [duration]);

  const formatQualityLabel = (level: QualityLevel) => {
    if (level.height >= 2160) return '4K';
    if (level.height >= 1080) return '1080p';
    if (level.height >= 720) return '720p';
    if (level.height >= 480) return '480p';
    return `${level.height}p`;
  };

  return (
    <div className="fixed inset-0 bg-black z-[9999] flex flex-col" ref={containerRef}>
      <div className={`flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/90 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center gap-3">
          <h2 className="text-white text-lg font-semibold truncate max-w-md">{title}</h2>
          {qualityLevels.length > 0 && (
            <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded flex items-center gap-1">
              <Hd size={12} />
              {currentQuality}
            </span>
          )}
        </div>
        <button onClick={onClose} className="text-white hover:text-gray-300 transition-colors p-2 rounded-lg bg-white/10 hover:bg-white/20">
          <X size={24} />
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center relative" onMouseMove={() => { setShowControls(true); if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current); if (isPlaying) controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000); }} onClick={() => { if (playerRef.current) { if (isPlaying) playerRef.current.pause(); else playerRef.current.play(); } }} onDoubleClick={() => { if (playerRef.current) { if (isFullscreen) playerRef.current.exitFullscreen(); else playerRef.current.requestFullscreen(); } }}>
        <div className="w-full h-full max-w-[100vw] max-h-[100vh]"><div ref={videoRef} className="w-full h-full" /></div>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none">
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              <span className="text-white text-sm">Carregando...</span>
            </div>
          </div>
        )}

        {/* Center Play Button */}
        {!isPlaying && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-24 h-24 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Play size={48} className="text-white ml-2" />
            </div>
          </div>
        )}

        {/* Skip Buttons */}
        {hasPrevious && (
          <button
            onClick={(e) => { e.stopPropagation(); onPrevious?.(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors p-3 rounded-full bg-black/40 hover:bg-black/60"
          >
            <SkipBack size={32} />
          </button>
        )}
        {hasNext && (
          <button
            onClick={(e) => { e.stopPropagation(); onNext?.(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors p-3 rounded-full bg-black/40 hover:bg-black/60"
          >
            <SkipForward size={32} />
          </button>
        )}

        {/* Controls Bar */}
        <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent px-4 pb-4 pt-16 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          
          {/* Progress Bar */}
          <div 
            ref={progressRef}
            className="relative w-full h-2 bg-white/20 rounded-full mb-4 cursor-pointer group"
            onMouseMove={handleProgressHover}
            onMouseLeave={handleProgressLeave}
            onClick={handleProgressClick}
          >
            {/* Buffered */}
            <div 
              className="absolute h-full bg-white/40 rounded-full" 
              style={{ width: `${duration > 0 ? (buffered / duration) * 100 : 0}%` }} 
            />
            {/* Progress */}
            <div 
              className="absolute h-full bg-red-600 rounded-full transition-all duration-100" 
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }} 
            />
            {/* Handle */}
            <div 
              className="absolute h-4 w-4 bg-red-600 rounded-full -translate-y-1/2 top-1/2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg pointer-events-none" 
              style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }} 
            />
            {/* Preview Time */}
            {showPreview && (
              <div 
                className="absolute -top-8 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap"
                style={{ left: `${duration > 0 ? (previewTime / duration) * 100 : 0}%`, transform: 'translateX(-50%)' }}
              >
                {fmt(previewTime)}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Play/Pause */}
              <button 
                onClick={(e) => { e.stopPropagation(); if (playerRef.current) { if (isPlaying) playerRef.current.pause(); else playerRef.current.play(); } }} 
                className="text-white hover:text-gray-300 transition-colors p-1"
              >
                {isPlaying ? <Pause size={32} /> : <Play size={32} />}
              </button>

              {/* Skip Backward 10s */}
              <button 
                onClick={(e) => { e.stopPropagation(); if (playerRef.current) playerRef.current.currentTime(currentTime - 10); }} 
                className="text-white hover:text-gray-300 transition-colors p-1"
                title="Retroceder 10s"
              >
                <Rewind size={20} />
              </button>

              {/* Skip Forward 10s */}
              <button 
                onClick={(e) => { e.stopPropagation(); if (playerRef.current) playerRef.current.currentTime(currentTime + 10); }} 
                className="text-white hover:text-gray-300 transition-colors p-1"
                title="Avançar 10s"
              >
                <FastForward size={20} />
              </button>

              {/* Volume */}
              <div className="flex items-center gap-2 group/vol">
                <button 
                  onClick={(e) => { e.stopPropagation(); if (playerRef.current) playerRef.current.muted(!isMuted); }} 
                  className="text-white hover:text-gray-300 transition-colors"
                >
                  {isMuted || volume === 0 ? <VolumeX size={24} /> : <Volume2 size={24} />}
                </button>
                <div className="w-0 overflow-hidden group-hover/vol:w-28 transition-all duration-200">
                  <input 
                    type="range" 
                    min={0} 
                    max={1} 
                    step={0.05} 
                    value={isMuted ? 0 : volume} 
                    onChange={(e) => { const v = parseFloat(e.target.value); if (playerRef.current) { playerRef.current.volume(v); playerRef.current.muted(v === 0); } }} 
                    onClick={(e) => e.stopPropagation()} 
                    className="w-24 h-1 accent-red-600 cursor-pointer" 
                  />
                </div>
              </div>

              {/* Time */}
              <div className="flex items-center gap-2 text-white text-sm font-medium">
                <span>{fmt(currentTime)}</span>
                <span className="text-white/50">/</span>
                <span className="text-white/70">{fmt(duration)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Subtitles */}
              {subtitleTracks.length > 0 && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowSettings({ ...showSettings, subtitles: !showSettings.subtitles, main: false, quality: false, speed: false }); }} 
                  className="text-white hover:text-gray-300 transition-colors p-1 relative"
                  title="Legendas"
                >
                  <Subtitles size={22} />
                  {currentSubtitle !== 'off' && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-600 rounded-full" />}
                </button>
              )}

              {/* Picture in Picture */}
              <button 
                onClick={(e) => { e.stopPropagation(); togglePiP(); }} 
                className="text-white hover:text-gray-300 transition-colors p-1"
                title="Picture-in-Picture"
              >
                <PictureInPicture size={22} />
              </button>

              {/* Cast */}
              {castDevices.length > 0 && (
                <div className="relative">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowCastMenu(!showCastMenu); }} 
                    className={`text-white hover:text-gray-300 transition-colors p-1 ${isCasting ? 'text-red-500' : ''}`}
                    title="Compartilhar tela"
                  >
                    <Cast size={22} />
                  </button>

                  {/* Cast Menu */}
                  {showCastMenu && (
                    <div className="absolute bottom-full right-0 mb-2 bg-black/95 rounded-lg p-2 min-w-[180px] shadow-2xl border border-white/10">
                      <div className="text-white text-xs mb-2 px-2 font-semibold opacity-60">Dispositivos</div>
                      {isCasting ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCastDisconnect(); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-white/10 text-red-500"
                        >
                          <Cast size={16} />
                          Desconectar
                        </button>
                      ) : (
                        castDevices.map(device => (
                          <button
                            key={device.id}
                            onClick={(e) => { e.stopPropagation(); handleCastConnect(device.id); }}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-white/10 ${device.status === 'connected' ? 'text-red-500' : 'text-white'}`}
                          >
                            <Cast size={16} />
                            {device.name}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Settings */}
              <div className="relative">
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowSettings({ ...showSettings, main: !showSettings.main, quality: false, speed: false, subtitles: false }); }} 
                  className="text-white hover:text-gray-300 transition-colors p-1"
                  title="Configurações"
                >
                  <Settings size={22} />
                </button>

                {/* Main Settings Menu */}
                {showSettings.main && (
                  <div className="absolute bottom-full right-0 mb-2 bg-black/95 rounded-lg p-2 min-w-[180px] shadow-2xl border border-white/10">
                    {/* Quality */}
                    {qualityLevels.length > 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowSettings({ ...showSettings, main: false, quality: true }); }}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm rounded hover:bg-white/10 text-white"
                      >
                        <span>Qualidade</span>
                        <span className="text-white/60 flex items-center gap-1">
                          {currentQuality}
                          <MoreVertical size={14} />
                        </span>
                      </button>
                    )}
                    
                    {/* Speed */}
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowSettings({ ...showSettings, main: false, speed: true }); }}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm rounded hover:bg-white/10 text-white"
                    >
                      <span>Velocidade</span>
                      <span className="text-white/60 flex items-center gap-1">
                        {playbackRate}x
                        <MoreVertical size={14} />
                      </span>
                    </button>

                    {/* Subtitles */}
                    {subtitleTracks.length > 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowSettings({ ...showSettings, main: false, subtitles: true }); }}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm rounded hover:bg-white/10 text-white"
                      >
                        <span>Legendas</span>
                        <span className="text-white/60 flex items-center gap-1">
                          {currentSubtitle === 'off' ? 'Off' : 'On'}
                          <MoreVertical size={14} />
                        </span>
                      </button>
                    )}
                  </div>
                )}

                {/* Quality Submenu */}
                {showSettings.quality && (
                  <div className="absolute bottom-full right-0 mb-2 bg-black/95 rounded-lg p-2 min-w-[140px] shadow-2xl border border-white/10">
                    <button
                      onClick={(e) => { e.stopPropagation(); changeQuality(-1); }}
                      className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-white/10 ${currentQuality === 'Auto' ? 'text-red-500 font-semibold' : 'text-white'}`}
                    >
                      Auto
                    </button>
                    {qualityLevels.map((level, index) => (
                      <button
                        key={index}
                        onClick={(e) => { e.stopPropagation(); changeQuality(index); }}
                        className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-white/10 ${currentQuality === formatQualityLabel(level) ? 'text-red-500 font-semibold' : 'text-white'}`}
                      >
                        {formatQualityLabel(level)}
                      </button>
                    ))}
                  </div>
                )}

                {/* Speed Submenu */}
                {showSettings.speed && (
                  <div className="absolute bottom-full right-0 mb-2 bg-black/95 rounded-lg p-2 min-w-[120px] shadow-2xl border border-white/10">
                    <div className="text-white text-xs mb-2 px-2 font-semibold opacity-60">Velocidade</div>
                    {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(rate => (
                      <button
                        key={rate}
                        onClick={(e) => { e.stopPropagation(); changeSpeed(rate); }}
                        className={`w-full text-left px-3 py-1.5 text-sm rounded hover:bg-white/10 ${playbackRate === rate ? 'text-red-500 font-semibold' : 'text-white'}`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                )}

                {/* Subtitles Submenu */}
                {showSettings.subtitles && (
                  <div className="absolute bottom-full right-0 mb-2 bg-black/95 rounded-lg p-2 min-w-[160px] shadow-2xl border border-white/10">
                    <div className="text-white text-xs mb-2 px-2 font-semibold opacity-60">Legendas</div>
                    <button
                      onClick={(e) => { e.stopPropagation(); changeSubtitle('off'); }}
                      className={`w-full text-left px-3 py-1.5 text-sm rounded hover:bg-white/10 ${currentSubtitle === 'off' ? 'text-red-500 font-semibold' : 'text-white'}`}
                    >
                      Off
                    </button>
                    {subtitleTracks.map(track => (
                      <button
                        key={track.id}
                        onClick={(e) => { e.stopPropagation(); changeSubtitle(track.id); }}
                        className={`w-full text-left px-3 py-1.5 text-sm rounded hover:bg-white/10 ${currentSubtitle === track.id ? 'text-red-500 font-semibold' : 'text-white'}`}
                      >
                        {track.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Fullscreen */}
              <button 
                onClick={(e) => { e.stopPropagation(); if (playerRef.current) { if (isFullscreen) playerRef.current.exitFullscreen(); else playerRef.current.requestFullscreen(); } }} 
                className="text-white hover:text-gray-300 transition-colors p-1"
                title="Tela cheia"
              >
                {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Info */}
      <div className="absolute bottom-20 left-4 text-white/40 text-xs hidden md:block">
        <span className="opacity-0 hover:opacity-100 transition-opacity">Shortcuts: Espaço=Play, F=Fullscreen, M=Mute, ←→=Seek, ↑↓=Volume, P=PiP, C=Cast</span>
      </div>
    </div>
  );
}

function getVideoType(url: string): string {
  // YouTube URLs
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'video/youtube';
  }
  // HLS streams
  if (url.includes('.m3u8')) return 'application/x-mpegURL';
  // DASH streams
  if (url.includes('.mpd')) return 'application/dash+xml';
  // MP4 videos
  if (url.includes('.mp4')) return 'video/mp4';
  // WebM videos
  if (url.includes('.webm')) return 'video/webm';
  // OGG videos
  if (url.includes('.ogv') || url.includes('.ogg')) return 'video/ogg';
  // Default to MP4
  return 'video/mp4';
}
