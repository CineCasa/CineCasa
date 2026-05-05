import React, { useEffect, useRef, useState, useCallback } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import 'videojs-youtube';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, SkipBack, SkipForward, X } from 'lucide-react';

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

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
          handlePartialData: true
        },
        nativeAudioTracks: false,
        nativeVideoTracks: false
      },
      controls: true,
      fluid: true,
      responsive: true,
      preload: 'auto',
      poster: poster,
      playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
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
          modestbranding: 1
        }
      }
    };

    const player = videojs(videoElement, playerOptions, () => {
      console.log('[VideoJS] Player ready');
      setIsLoading(false);
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

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [url, poster, resumeFrom]);

  // YouTube keyboard shortcuts
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
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isFullscreen, isPlaying, currentTime, volume, isMuted, duration]);

  const fmt = (s: number) => { if (!s || isNaN(s)) return '0:00'; const h = Math.floor(s/3600); const m = Math.floor((s%3600)/60); const sec = Math.floor(s%60); return h > 0 ? `${h}:${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}` : `${m}:${sec.toString().padStart(2,'0')}`; };
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col" ref={containerRef}>
      <div className={`flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <h2 className="text-white text-lg font-semibold truncate max-w-md">{title}</h2>
        <button onClick={onClose} className="text-white hover:text-gray-300 transition-colors p-2 rounded-lg bg-white/10 hover:bg-white/20"><X size={24} /></button>
      </div>
      <div className="flex-1 flex items-center justify-center relative" onMouseMove={() => { setShowControls(true); if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current); if (isPlaying) controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000); }} onClick={() => { if (playerRef.current) { if (isPlaying) playerRef.current.pause(); else playerRef.current.play(); } }} onDoubleClick={() => { if (playerRef.current) { if (isFullscreen) playerRef.current.exitFullscreen(); else playerRef.current.requestFullscreen(); } }}>
        <div className="w-full h-full max-w-[100vw] max-h-[100vh]"><div ref={videoRef} className="w-full h-full" /></div>
        {isLoading && <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none"><div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin" /></div>}
        {!isPlaying && !isLoading && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="w-20 h-20 bg-black/60 rounded-full flex items-center justify-center"><Play size={40} className="text-white ml-1" /></div></div>}
        <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-4 pb-6 pt-12 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="relative w-full h-1 bg-white/30 rounded-full mb-4 cursor-pointer group">
            <div className="absolute h-full bg-white/40 rounded-full" style={{ width: `${duration > 0 ? (buffered / duration) * 100 : 0}%` }} />
            <div className="absolute h-full bg-red-600 rounded-full" style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }} />
            <input type="range" min={0} max={duration || 0} value={currentTime} onChange={(e) => { const t = parseFloat(e.target.value); if (playerRef.current) { playerRef.current.currentTime(t); setCurrentTime(t); } }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            <div className="absolute h-3 w-3 bg-red-600 rounded-full -translate-y-1/2 top-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={(e) => { e.stopPropagation(); if (playerRef.current) { if (isPlaying) playerRef.current.pause(); else playerRef.current.play(); } }} className="text-white hover:text-gray-300 transition-colors">{isPlaying ? <Pause size={28} /> : <Play size={28} />}</button>
              {hasPrevious && <button onClick={(e) => { e.stopPropagation(); onPrevious?.(); }} className="text-white hover:text-gray-300 transition-colors"><SkipBack size={24} /></button>}
              {hasNext && <button onClick={(e) => { e.stopPropagation(); onNext?.(); }} className="text-white hover:text-gray-300 transition-colors"><SkipForward size={24} /></button>}
              <div className="flex items-center gap-2 group/vol">
                <button onClick={(e) => { e.stopPropagation(); if (playerRef.current) playerRef.current.muted(!isMuted); }} className="text-white hover:text-gray-300 transition-colors">{isMuted || volume === 0 ? <VolumeX size={24} /> : <Volume2 size={24} />}</button>
                <div className="w-0 overflow-hidden group-hover/vol:w-24 transition-all duration-200">
                  <input type="range" min={0} max={1} step={0.05} value={isMuted ? 0 : volume} onChange={(e) => { const v = parseFloat(e.target.value); if (playerRef.current) { playerRef.current.volume(v); playerRef.current.muted(v === 0); } }} onClick={(e) => e.stopPropagation()} className="w-20 h-1 accent-white cursor-pointer" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-white text-sm">
                <span>{fmt(currentTime)}</span>
                <span className="text-white/50">/</span>
                <span className="text-white/70">{fmt(duration)}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <button onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }} className="text-white hover:text-gray-300 transition-colors p-1"><Settings size={22} /></button>
                {showSettings && (
                  <div className="absolute bottom-full right-0 mb-2 bg-black/95 rounded-lg p-2 min-w-[120px]">
                    <div className="text-white text-xs mb-2 px-2 font-semibold">Velocidade</div>
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                      <button key={rate} onClick={(e) => { e.stopPropagation(); if (playerRef.current) { playerRef.current.playbackRate(rate); setPlaybackRate(rate); } setShowSettings(false); }} className={`w-full text-left px-3 py-1.5 text-sm rounded hover:bg-white/10 ${playbackRate === rate ? 'text-red-500 font-semibold' : 'text-white'}`}>{rate}x</button>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={(e) => { e.stopPropagation(); if (playerRef.current) { if (isFullscreen) playerRef.current.exitFullscreen(); else playerRef.current.requestFullscreen(); } }} className="text-white hover:text-gray-300 transition-colors p-1">{isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}</button>
            </div>
          </div>
        </div>
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
