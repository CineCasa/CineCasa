import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X, ChevronLeft, Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipBack, SkipForward, Settings, Subtitles, Gauge, PictureInPicture2, Cast, Users, MonitorPlay, ChevronRight, RotateCcw, Square, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { CastButton } from './CastButton';
import { useElitePlayer } from '@/hooks/useElitePlayer';
import { isArchiveOrgUrl } from '@/utils/videoProxy';
import { usePlayer } from '@/contexts/PlayerContext';

// Helper to detect YouTube URLs
const isYoutubeUrl = (url: string): boolean => {
  if (!url) return false;
  return url.includes('youtube.com/embed/') || url.includes('youtube.com/watch') || url.includes('youtu.be/');
};

interface VideoJSPlayerProps {
  url: string;
  title: string;
  poster?: string;
  onClose: () => void;
  onNextEpisode?: () => void;
  hasNextEpisode?: boolean;
  historyItem?: any;
  onProgressUpdate?: (currentTime: number, duration: number) => void;
  contentId?: string;
  contentType?: 'movie' | 'series';
  episodeId?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  resumeFrom?: number;
}

declare global {
  interface Window {
    videojs?: any;
    VideoPlayerThumbnails?: any;
  }
}

// Componente para gerar preview de thumbnail do vídeo
const ThumbnailPreview: React.FC<{ time: number; videoRef?: React.RefObject<HTMLVideoElement>; videoUrl?: string; poster?: string }> = ({ time, videoRef, videoUrl, poster }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasError, setHasError] = useState(false);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const tempVideoRef = useRef<HTMLVideoElement | null>(null);

  // Local formatTime function for error state
  const formatTimeLocal = (seconds: number): string => {
    if (isNaN(seconds)) return '0:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  };

  useEffect(() => {
    // Limpar debounce anterior
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debug: log dos props recebidos
    console.log('[ThumbnailPreview] Props:', { time, hasVideoRef: !!videoRef?.current, videoUrl: !!videoUrl, poster: !!poster, posterUrl: poster?.substring(0, 50) });

    // Debounce de 100ms para evitar múltiplos seeks
    debounceRef.current = setTimeout(async () => {
      if (!canvasRef.current) {
        console.log('[ThumbnailPreview] No canvas ref');
        setHasError(true);
        return;
      }

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        console.log('[ThumbnailPreview] No canvas context');
        setHasError(true);
        return;
      }

      try {
        // Primeiro tentar usar o videoRef atual (se disponível e sem CORS)
        if (videoRef?.current && videoRef.current.videoWidth > 0) {
          const video = videoRef.current;
          console.log('[ThumbnailPreview] Trying videoRef, videoWidth:', video.videoWidth, 'src:', video.src?.substring(0, 50));
          
          // Tentar desenhar frame atual - se falhar por CORS, usamos fallback
          try {
            canvas.width = 160;
            canvas.height = 90;
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Testar se canvas está tainted
            canvas.toDataURL('image/jpeg', 0.1);
            
            // Se chegou aqui, o vídeo não está tainted
            // Agora criar um vídeo temporário para fazer seek
            console.log('[ThumbnailPreview] Video not tainted, using temp video for seek');
            await captureFrameWithTempVideo(video.src || video.currentSrc, time, canvas, ctx, setThumbnail, setHasError);
            return;
          } catch (corsErr) {
            console.log('[ThumbnailPreview] CORS detected on videoRef, using fallback approach');
            // CORS error - usar vídeo temporário com crossOrigin
          }
        } else {
          console.log('[ThumbnailPreview] videoRef not available or not ready, videoWidth:', videoRef?.current?.videoWidth);
        }

        // Fallback: criar vídeo temporário com crossOrigin
        if (videoUrl) {
          console.log('[ThumbnailPreview] Using videoUrl fallback:', videoUrl.substring(0, 50));
          await captureFrameWithTempVideo(videoUrl, time, canvas, ctx, setThumbnail, setHasError);
        } else if (poster) {
          // Último fallback: usar poster
          console.log('[ThumbnailPreview] Using poster fallback:', poster.substring(0, 50));
          await loadPosterAsThumbnail(poster, canvas, ctx, setThumbnail, setHasError);
        } else {
          console.log('[ThumbnailPreview] No videoUrl or poster available');
          setHasError(true);
        }
      } catch (err) {
        console.error('[ThumbnailPreview] Error generating thumbnail:', err);
        setHasError(true);
      }
    }, 100);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (tempVideoRef.current) {
        tempVideoRef.current.pause();
        tempVideoRef.current.src = '';
        tempVideoRef.current.load();
        tempVideoRef.current = null;
      }
    };
  }, [time, videoRef, videoUrl, poster]);

  // Função auxiliar para capturar frame usando vídeo temporário
  const captureFrameWithTempVideo = async (
    src: string, 
    seekTime: number, 
    canvas: HTMLCanvasElement, 
    ctx: CanvasRenderingContext2D,
    setThumb: (url: string) => void,
    setErr: (err: boolean) => void
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Limpar vídeo temporário anterior
      if (tempVideoRef.current) {
        tempVideoRef.current.pause();
        tempVideoRef.current.src = '';
        tempVideoRef.current.load();
      }

      // Criar novo vídeo temporário
      const tempVideo = document.createElement('video');
      tempVideo.crossOrigin = 'anonymous';
      tempVideo.preload = 'metadata';
      tempVideo.muted = true;
      tempVideo.playsInline = true;
      tempVideo.style.display = 'none';
      document.body.appendChild(tempVideo);
      tempVideoRef.current = tempVideo;

      let isResolved = false;
      const timeout = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          cleanup();
          setErr(true);
          reject(new Error('Thumbnail generation timeout'));
        }
      }, 3000);

      const cleanup = () => {
        clearTimeout(timeout);
        tempVideo.removeEventListener('seeked', onSeeked);
        tempVideo.removeEventListener('error', onError);
        tempVideo.removeEventListener('loadedmetadata', onLoadedMetadata);
        if (tempVideo.parentNode) {
          tempVideo.parentNode.removeChild(tempVideo);
        }
      };

      const onError = () => {
        if (!isResolved) {
          isResolved = true;
          cleanup();
          setErr(true);
          reject(new Error('Video load error'));
        }
      };

      const onSeeked = () => {
        if (isResolved) return;
        
        try {
          canvas.width = 160;
          canvas.height = 90;
          ctx.fillStyle = '#000';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setThumb(dataUrl);
          setErr(false);
          
          isResolved = true;
          cleanup();
          resolve();
        } catch (err) {
          console.error('[ThumbnailPreview] Canvas error:', err);
          if (!isResolved) {
            isResolved = true;
            cleanup();
            setErr(true);
            reject(err);
          }
        }
      };

      const onLoadedMetadata = () => {
        if (seekTime > tempVideo.duration) {
          tempVideo.currentTime = tempVideo.duration * 0.5;
        } else {
          tempVideo.currentTime = seekTime;
        }
      };

      tempVideo.addEventListener('seeked', onSeeked, { once: true });
      tempVideo.addEventListener('error', onError, { once: true });
      tempVideo.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });
      
      tempVideo.src = src;
      tempVideo.load();
    });
  };

  // Função auxiliar para usar poster como thumbnail
  const loadPosterAsThumbnail = async (
    posterUrl: string,
    canvas: HTMLCanvasElement, 
    ctx: CanvasRenderingContext2D,
    setThumb: (url: string) => void,
    setErr: (err: boolean) => void
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          canvas.width = 160;
          canvas.height = 90;
          ctx.fillStyle = '#000';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Crop to 16:9 aspect ratio
          const imgRatio = img.width / img.height;
          const canvasRatio = 160 / 90;
          let sx = 0, sy = 0, sw = img.width, sh = img.height;
          
          if (imgRatio > canvasRatio) {
            sw = img.height * canvasRatio;
            sx = (img.width - sw) / 2;
          } else {
            sh = img.width / canvasRatio;
            sy = (img.height - sh) / 2;
          }
          
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 160, 90);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setThumb(dataUrl);
          setErr(false);
          resolve();
        } catch (err) {
          setErr(true);
          reject(err);
        }
      };
      
      img.onerror = () => {
        setErr(true);
        reject(new Error('Failed to load poster'));
      };
      
      img.src = posterUrl;
    });
  };

  if (hasError || !thumbnail) {
    return (
      <div className="w-28 h-16 bg-gradient-to-br from-gray-800 to-gray-900 rounded flex flex-col items-center justify-center border border-white/10">
        <Clock className="w-5 h-5 text-gray-500 mb-1" />
        <span className="text-gray-400 text-[10px]">{formatTimeLocal(time)}</span>
      </div>
    );
  }

  return (
    <img
      src={thumbnail}
      alt="Preview"
      className="w-28 h-16 rounded border border-white/10 bg-black object-cover"
    />
  );
};

const VideoJSPlayer: React.FC<VideoJSPlayerProps> = ({
  url: originalUrl,
  title,
  poster,
  onClose,
  onNextEpisode,
  hasNextEpisode: propHasNextEpisode,
  historyItem,
  onProgressUpdate,
  contentId,
  contentType,
  episodeId,
  seasonNumber,
  episodeNumber,
  resumeFrom = 0,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const thumbnailRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  // Elite Player Hook - Cloudflare Worker + JWT + Supabase Sync
  const {
    videoUrl,
    isLoading: eliteLoading,
    error: eliteError,
    savedProgress,
    saveProgress,
    hasNextEpisode: eliteHasNextEpisode,
  } = useElitePlayer({
    url: originalUrl,
    contentId: contentId || '',
    contentType: contentType || 'movie',
    title,
    poster,
    episodeId,
    seasonNumber,
    episodeNumber,
  });
  
  // Estados do player
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  
  // Definir hasNextEpisode combinando prop e hook
  const hasNextEpisode = propHasNextEpisode || eliteHasNextEpisode || false;
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
  
  // Estados avançados
  // Mini Player state from global context
  const { isMiniPlayer, toggleMiniPlayer: contextToggleMiniPlayer } = usePlayer();
  
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [resumeTime, setResumeTime] = useState(0);
  const [showNextEpisodeDialog, setShowNextEpisodeDialog] = useState(false);
  const [nextEpisodeCountdown, setNextEpisodeCountdown] = useState(10);
  const [showThumbnail, setShowThumbnail] = useState(false);
  const [thumbnailTime, setThumbnailTime] = useState(0);
  const [thumbnailPosition, setThumbnailPosition] = useState(0);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(false);
  const [currentSubtitleTrack, setCurrentSubtitleTrack] = useState(-1);
  const [subtitleTracks, setSubtitleTracks] = useState<TextTrack[]>([]);
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);
  
  // Estados de áudio
  const [audioTracks, setAudioTracks] = useState<Array<{id: number; label: string; language: string}>>([]);
  const [currentAudioTrack, setCurrentAudioTrack] = useState(0);
  const [showAudioMenu, setShowAudioMenu] = useState(false);
  
  // Gestos mobile
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const nextEpisodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const saveProgressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const thumbnailCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isInitializedRef = useRef(false);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  // Para URLs do YouTube, setar isReady imediatamente já que usamos iframe nativo
  useEffect(() => {
    if (videoUrl && isYoutubeUrl(videoUrl)) {
      console.log('[VideoJSPlayer] YouTube URL detectada, setando isReady=true imediatamente');
      setIsReady(true);
    }
  }, [videoUrl]);

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
    // Skip if already initialized
    if (isInitializedRef.current) return;
    
    // Small delay to ensure DOM is ready (AnimatePresence may delay mounting)
    const initTimeout = setTimeout(() => {
      if (!loaded || !videoRef.current || !window.videojs || !videoUrl) return;
      
      // Mark as initialized to prevent double initialization
      isInitializedRef.current = true;
      
      console.log('[VideoJSPlayer] Initializing player...');

      const player = window.videojs(videoRef.current, {
      html5: {
        vhs: {
          overrideNative: true,
          limitRenditionByPlayerDimensions: true,
          useDevicePixelRatio: true,
          limitRenditionByPlayerDimensionsOnSwitch: true,
        },
      },
      autoplay: true,
      muted: false,
      volume: 1.0,
      controls: false, // Custom controls
      fluid: true,
      preload: 'metadata', // Performance: preload metadata only
      poster: poster,
      sources: [
        {
          src: videoUrl,
          type: isArchiveOrgUrl(videoUrl) ? 'video/mp4' : 'application/x-mpegURL',
        },
      ],
    });
    
    // Garantir que o áudio está ativado
    player.muted(false);
    player.volume(1.0);

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
      
      // Extract audio tracks (DUAL AUDIO)
      if (player.audioTracks && player.audioTracks()) {
        const audioTrackList = player.audioTracks();
        const tracks: Array<{id: number; label: string; language: string}> = [];
        
        console.log(`[VideoJSPlayer] Found ${audioTrackList.length} audio tracks`);
        
        for (let i = 0; i < audioTrackList.length; i++) {
          const track = audioTrackList[i];
          console.log(`[VideoJSPlayer] Audio track ${i}:`, {
            label: track.label,
            language: track.language,
            enabled: track.enabled,
            kind: track.kind
          });
          tracks.push({
            id: i,
            label: track.label || `Faixa ${i + 1}`,
            language: track.language || 'unknown',
          });
        }
        
        if (tracks.length > 0) {
          console.log('[VideoJSPlayer] Setting audio tracks:', tracks);
          setAudioTracks(tracks);
          // Find current enabled track
          for (let i = 0; i < audioTrackList.length; i++) {
            if (audioTrackList[i].enabled) {
              console.log('[VideoJSPlayer] Current enabled track:', i);
              setCurrentAudioTrack(i);
              break;
            }
          }
        }
      } else {
        console.log('[VideoJSPlayer] No audio tracks available');
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

    // Detectar fim do vídeo para auto-play próximo episódio (5 segundos)
    player.on('ended', () => {
      if (eliteHasNextEpisode && onNextEpisode) {
        setShowNextEpisodeDialog(true);
        setNextEpisodeCountdown(5); // Contador de 5 segundos
        
        nextEpisodeTimeoutRef.current = setInterval(() => {
          setNextEpisodeCountdown((prev) => {
            if (prev <= 1) {
              if (nextEpisodeTimeoutRef.current) {
                clearInterval(nextEpisodeTimeoutRef.current);
              }
              onNextEpisode();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    });

    // FALLBACK: Se vídeo falhar, tentar URL original
    player.on('error', () => {
      const error = player.error();
      console.error('[VideoJSPlayer] Video error:', error);
      
      // Se era URL proxyada, tentar URL original como fallback
      if (videoUrl !== originalUrl && isArchiveOrgUrl(originalUrl)) {
        console.log('[VideoJSPlayer] Fallback: tentando URL original...');
        player.src({
          src: originalUrl,
          type: 'video/mp4'
        });
        player.play();
      }
    });

    }, 100); // 100ms delay for DOM to be ready

    return () => {
      clearTimeout(initTimeout);
    };
  }, [loaded, videoUrl, poster, onProgressUpdate, eliteHasNextEpisode, onNextEpisode, saveProgress]);

  // Cleanup player on unmount
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
      // Reset initialization flag for future renders
      isInitializedRef.current = false;
    };
  }, []);

  // Efeito para mostrar resume dialog quando o vídeo carregar
  useEffect(() => {
    // Usar savedProgress do elite hook ou resumeFrom prop
    const progressToResume = savedProgress > 0 ? savedProgress : resumeFrom;
    if (isReady && progressToResume > 30) { // Só mostrar se já assistiu mais de 30 segundos
      setResumeTime(progressToResume);
      setShowResumeDialog(true);
      if (playerRef.current) {
        playerRef.current.pause();
      }
    }
  }, [isReady, resumeFrom, savedProgress]);

  // Salvar progresso usando elite hook (já com throttle de 10s)
  const saveWatchHistory = useCallback(async (current: number, dur: number) => {
    if (!user || !profile || !contentId) return;
    
    // Usar o saveProgress do elite hook (throttled a cada 10s)
    saveProgress(current, dur);
    
    // Backup: também salvar via Supabase direto para garantir
    try {
      const progressPercent = dur > 0 ? (current / dur) * 100 : 0;
      
      const watchData = {
        profile_id: profile.id,
        content_id: contentId,
        content_type: contentType === 'series' ? 'series' : 'movie',
        titulo: title,
        poster: poster || '',
        progress: Math.round(progressPercent),
        duration: Math.round(dur),
        current_time: Math.round(current),
        last_watched: new Date().toISOString(),
        episode_id: episodeId || null,
        season_number: seasonNumber ?? null,
        episode_number: episodeNumber ?? null,
      };
      
      const { error } = await (supabase.from('watch_history') as any).upsert(watchData, { 
        onConflict: 'profile_id,content_id,content_type,episode_id' 
      });
      
      if (error) {
        console.error('[VideoJSPlayer] Error saving watch history:', error);
      }
    } catch (err) {
      console.error('[VideoJSPlayer] Failed to save watch history:', err);
    }
  }, [user, profile, contentId, contentType, title, poster, episodeId, seasonNumber, episodeNumber, saveProgress]);

  // Efeito para salvar progresso periodicamente
  useEffect(() => {
    if (!isReady || !user) return;

    saveProgressIntervalRef.current = setInterval(() => {
      if (playerRef.current && currentTime > 0 && duration > 0) {
        saveWatchHistory(currentTime, duration);
      }
    }, 30000); // Salvar a cada 30 segundos

    return () => {
      if (saveProgressIntervalRef.current) {
        clearInterval(saveProgressIntervalRef.current);
      }
      // Salvar uma última vez ao desmontar
      if (currentTime > 0 && duration > 0) {
        saveWatchHistory(currentTime, duration);
      }
    };
  }, [isReady, user, currentTime, duration, saveWatchHistory]);

  // Controle de orientação para mobile (apenas quando entra em fullscreen manualmente)
  useEffect(() => {
    const handleOrientationChange = async () => {
      if (!isFullscreen) {
        // Sair do fullscreen - desbloquear orientação
        try {
          const screenOrientation = (screen as any).orientation;
          if (screenOrientation?.unlock) {
            await screenOrientation.unlock();
            console.log('[VideoJSPlayer] Screen orientation unlocked');
          }
        } catch (err) {
          console.log('[VideoJSPlayer] Could not unlock orientation:', err);
        }
      } else {
        // Entrar em fullscreen - tentar bloquear em landscape (apenas mobile)
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );
        
        if (isMobile) {
          try {
            const screenOrientation = (screen as any).orientation;
            if (screenOrientation?.lock) {
              await screenOrientation.lock('landscape');
              console.log('[VideoJSPlayer] Screen locked to landscape');
            }
          } catch (err) {
            console.log('[VideoJSPlayer] Could not lock orientation:', err);
          }
        }
      }
    };

    handleOrientationChange();
  }, [isFullscreen]);

  // Auto-hide controls - esconde após 3s quando vídeo está tocando
  useEffect(() => {
    // Limpa timeout anterior
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    if (isPlaying) {
      // Inicia timer para esconder controles após 3 segundos
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    } else {
      // Quando pausado, sempre mostra controles
      setShowControls(true);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying]);

  // Funções de controle declaradas antes do handleKeyDown (v3 - cache bust 2026-04-19)
  console.log('[VideoJSPlayer] Initializing control functions v3');
  
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

  // Mostrar controles quando mouse se move
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
    };
  }, [isPlaying]);

  // Keyboard handler - definido fora do useEffect para reuso
  const handleKeyDown = useCallback((e: KeyboardEvent | React.KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skip(-5);
          break;
        case 'ArrowRight':
          e.preventDefault();
          skip(5);
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (playerRef.current) {
            const newVol = Math.min(100, volume + 5);
            playerRef.current.volume(newVol / 100);
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (playerRef.current) {
            const newVol = Math.max(0, volume - 5);
            playerRef.current.volume(newVol / 100);
          }
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'Escape':
          if (isFullscreen) {
            e.preventDefault();
            toggleFullscreen();
          }
          break;
        case 'n':
          if (hasNextEpisode && onNextEpisode) {
            e.preventDefault();
            onNextEpisode();
          }
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
          if (playerRef.current && duration) {
            const percent = parseInt(e.key) / 10;
            const time = percent * duration;
            playerRef.current.currentTime(time);
            setCurrentTime(time);
          }
          break;
      }
    }, [isPlaying, volume, isFullscreen, duration, hasNextEpisode, onNextEpisode, togglePlayPause, skip, toggleMute, toggleFullscreen]);

  // Keyboard shortcuts useEffect
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => handleKeyDown(e);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [handleKeyDown]);

  // Funções adicionais de controle
  const handleStop = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.pause();
      playerRef.current.currentTime(0);
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, []);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseInt(e.target.value);
    setVolume(vol);
    if (playerRef.current) {
      playerRef.current.volume(vol / 100);
    }
  }, []);

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
    const videoUrlParam = encodeURIComponent(videoUrl || originalUrl);
    const watchUrl = `/watch.html?room=${roomId}&video=${videoUrlParam}`;
    window.open(watchUrl, '_blank');
  }, [videoUrl, originalUrl]);

  // Resume - continuar assistindo
  const handleResume = useCallback(() => {
    if (playerRef.current && resumeTime > 0) {
      playerRef.current.currentTime(resumeTime);
      setCurrentTime(resumeTime);
    }
    setShowResumeDialog(false);
  }, [resumeTime]);

  const handleStartFromBeginning = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.currentTime(0);
      setCurrentTime(0);
    }
    setShowResumeDialog(false);
  }, []);

  // Auto-play próximo episódio
  const startNextEpisodeCountdown = useCallback(() => {
    if (!hasNextEpisode || !onNextEpisode) return;
    
    setShowNextEpisodeDialog(true);
    setNextEpisodeCountdown(10);
    
    nextEpisodeTimeoutRef.current = setInterval(() => {
      setNextEpisodeCountdown((prev) => {
        if (prev <= 1) {
          if (nextEpisodeTimeoutRef.current) {
            clearInterval(nextEpisodeTimeoutRef.current);
          }
          onNextEpisode();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [hasNextEpisode, onNextEpisode]);

  const cancelNextEpisode = useCallback(() => {
    if (nextEpisodeTimeoutRef.current) {
      clearInterval(nextEpisodeTimeoutRef.current);
    }
    setShowNextEpisodeDialog(false);
  }, []);

  // Thumbnail preview na barra de progresso
  const handleProgressBarMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !duration) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const time = Math.max(0, Math.min(pos * duration, duration));
    
    setThumbnailTime(time);
    setThumbnailPosition(e.clientX - rect.left);
    setShowThumbnail(true);
  }, [duration]);

  const handleProgressBarMouseLeave = useCallback(() => {
    setShowThumbnail(false);
  }, []);

  const handleProgressBarClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !playerRef.current || !duration) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const time = Math.max(0, Math.min(pos * duration, duration));
    
    playerRef.current.currentTime(time);
    setCurrentTime(time);
  }, [duration]);

  // Mini player toggle
  const handleToggleMiniPlayer = useCallback(() => {
    console.log('[VideoJSPlayer] Toggling mini player, current state:', isMiniPlayer);
    contextToggleMiniPlayer();
  }, [isMiniPlayer, contextToggleMiniPlayer]);

  // Audio track selector
  const changeAudioTrack = useCallback((trackId: number) => {
    console.log('[VideoJSPlayer] Changing audio track to:', trackId);
    if (playerRef.current && playerRef.current.audioTracks) {
      const tracks = playerRef.current.audioTracks();
      console.log('[VideoJSPlayer] Available tracks:', tracks.length);
      for (let i = 0; i < tracks.length; i++) {
        const wasEnabled = tracks[i].enabled;
        tracks[i].enabled = (i === trackId);
        console.log(`[VideoJSPlayer] Track ${i} (${tracks[i].label}): ${wasEnabled} -> ${tracks[i].enabled}`);
      }
      setCurrentAudioTrack(trackId);
    } else {
      console.warn('[VideoJSPlayer] Cannot change audio track - player or audioTracks not available');
    }
    setShowAudioMenu(false);
  }, []);

  // Subtitle selector
  const changeSubtitleTrack = useCallback((trackIndex: number) => {
    if (playerRef.current && playerRef.current.textTracks) {
      const tracks = playerRef.current.textTracks();
      
      // Disable all tracks first
      for (let i = 0; i < tracks.length; i++) {
        tracks[i].mode = 'disabled';
      }
      
      // Enable selected track
      if (trackIndex >= 0 && tracks[trackIndex]) {
        tracks[trackIndex].mode = 'showing';
        setSubtitlesEnabled(true);
      } else {
        setSubtitlesEnabled(false);
      }
      
      setCurrentSubtitleTrack(trackIndex);
    }
    setShowSubtitleMenu(false);
  }, []);

  // Mobile touch gestures
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
    setIsSwiping(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isSwiping || !playerRef.current) return;
    
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    const diffX = touchStartX - touchX;
    const diffY = touchStartY - touchY;
    
    // Horizontal swipe for seeking
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      const seekTime = diffX > 0 ? -10 : 10;
      skip(seekTime);
      setIsSwiping(false);
    }
  }, [isSwiping, touchStartX, touchStartY, skip]);

  const handleTouchEnd = useCallback(() => {
    setIsSwiping(false);
  }, []);

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

  // Auto fullscreen e rotação landscape em mobile quando player abrir
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalWidth = document.body.style.width;
    const originalHeight = document.body.style.height;
    
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    
    // Auto fullscreen + landscape em mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    
    if (isMobile) {
      // Tentar entrar em fullscreen automaticamente
      const enterFullscreen = async () => {
        try {
          const element = playerContainerRef.current || document.documentElement;
          if (element.requestFullscreen) {
            await element.requestFullscreen();
          } else if ((element as any).webkitRequestFullscreen) {
            await (element as any).webkitRequestFullscreen();
          } else if ((element as any).msRequestFullscreen) {
            await (element as any).msRequestFullscreen();
          }
          setIsFullscreen(true);
          
          // Bloquear em landscape
          const screenOrientation = (screen as any).orientation;
          if (screenOrientation?.lock) {
            await screenOrientation.lock('landscape');
            console.log('[VideoJSPlayer] Auto: Screen locked to landscape');
          }
        } catch (err) {
          console.log('[VideoJSPlayer] Auto fullscreen failed (user interaction required):', err);
        }
      };
      
      // Tentar após pequeno delay para garantir que DOM está pronto
      setTimeout(enterFullscreen, 500);
    }
    
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = originalWidth;
      document.body.style.height = originalHeight;
      
      // Desbloquear orientação ao sair
      if (isMobile) {
        const screenOrientation = (screen as any).orientation;
        if (screenOrientation?.unlock) {
          screenOrientation.unlock();
        }
      }
    };
  }, []);

  const playerContent = (
    <div
      ref={playerContainerRef}
      className={`fixed bg-black overflow-hidden ${
        isMiniPlayer
          ? 'z-[2147483647] rounded-xl shadow-2xl border-2 border-white/30 mini-player-active'
          : 'inset-0 z-[9999]'
      }`}
      style={{
        position: 'fixed',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        ...(isMiniPlayer ? {
          bottom: '80px',
          right: '20px',
          width: '360px',
          height: '202px',
          top: 'auto',
          left: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
        } : {
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
        })
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      tabIndex={0}
      onKeyDown={(e) => {
        // Mostrar controles ao pressionar qualquer tecla
        setShowControls(true);
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
        if (isPlaying) {
          controlsTimeoutRef.current = setTimeout(() => {
            setShowControls(false);
          }, 3000);
        }
        // Chamar o handler de teclado existente
        handleKeyDown(e);
      }}
    >
      {/* Loading Screen */}
      {!isReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-50">
          <div className="w-16 h-16 border-4 border-[#00A8E1]/20 border-t-[#00A8E1] rounded-full animate-spin mb-4" />
          <p className="text-white/80 text-lg">Carregando player...</p>
        </div>
      )}

      {/* Video Element */}
      <div className="absolute inset-0 flex items-center justify-center z-10" style={{ 
        width: isMiniPlayer ? '100%' : '100vw', 
        height: isMiniPlayer ? '100%' : '100vh' 
      }}>
        {isYoutubeUrl(videoUrl || '') ? (
          /* YouTube iframe player for trailers */
          <iframe
            src={videoUrl?.includes('?') 
              ? `${videoUrl}&autoplay=1&playsinline=1&rel=0&modestbranding=1` 
              : `${videoUrl}?autoplay=1&playsinline=1&rel=0&modestbranding=1`}
            className="w-full h-full"
            style={{
              width: '100%',
              height: '100%',
              border: 'none'
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            title={title}
          />
        ) : (
          /* Video.js player for regular videos */
          <video
            ref={videoRef}
            className="video-js vjs-fluid vjs-big-play-centered"
            style={{
              width: '100%',
              height: '100%',
              maxHeight: '100vh',
              maxWidth: '100vw',
              objectFit: 'contain',
              backgroundColor: '#000'
            }}
            poster={poster}
            preload="auto"
            crossOrigin="anonymous"
          >
            <source src={videoUrl} type={isArchiveOrgUrl(videoUrl) ? 'video/mp4' : 'application/x-mpegURL'} />
          </video>
        )}
      </div>

      {/* Interaction Layer - captura clicks/toque sempre */}
      <div 
        className="absolute inset-0 z-30"
        onClick={(e) => {
          // Mostrar controles ao clicar
          setShowControls(true);
          if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
          }
          if (isPlaying) {
            controlsTimeoutRef.current = setTimeout(() => {
              setShowControls(false);
            }, 3000);
          }
          // Também alternar play/pause
          togglePlayPause();
        }}
        onTouchStart={(e) => {
          // Mostrar controles ao tocar na tela - não esconder automaticamente no mobile
          setShowControls(true);
          if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
          }
          // No mobile, manter controles visíveis por mais tempo (5s) para melhor UX
          if (isPlaying) {
            controlsTimeoutRef.current = setTimeout(() => {
              setShowControls(false);
            }, 5000);
          }
        }}
        onMouseMove={(e) => {
          // Mostrar controles ao mover mouse
          setShowControls(true);
          if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
          }
          if (isPlaying) {
            controlsTimeoutRef.current = setTimeout(() => {
              setShowControls(false);
            }, 3000);
          }
        }}
      />

      {/* Custom Controls Overlay */}
      <div 
        className={`absolute inset-0 transition-opacity duration-300 z-40 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-2 md:p-4 bg-gradient-to-b from-black/90 via-black/50 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => { 
                  e.stopPropagation(); 
                  console.log('[VideoJSPlayer] Botão voltar clicado - chamando onClose');
                  onClose();
                }}
                className="p-3 md:p-2 hover:bg-white/20 rounded-full transition-colors touch-button"
                title="Voltar"
                style={{ minWidth: '44px', minHeight: '44px' }}
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
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent pt-4 pb-4 px-4 md:pt-24 md:pb-6 md:px-6">
          {/* Progress Bar Container */}
          <div 
            className="mb-6 group relative"
            ref={progressBarRef}
            onMouseMove={handleProgressBarMouseMove}
            onMouseLeave={handleProgressBarMouseLeave}
            onClick={handleProgressBarClick}
          >
            {/* Preview Thumbnail - aparece bem acima da barra de progresso */}
            {showThumbnail && (
              <div
                className="absolute -top-40 bg-black/90 rounded-lg p-2 transform -translate-x-1/2 pointer-events-none select-none z-[40] border border-white/20 shadow-2xl"
                style={{ left: thumbnailPosition }}
              >
                <div className="text-white text-xs mb-1 text-center font-medium">{formatTime(thumbnailTime)}</div>
                <div className="w-28 h-16 overflow-hidden rounded border border-white/10 bg-black">
                  <ThumbnailPreview time={thumbnailTime} videoRef={videoRef} videoUrl={originalUrl} poster={poster} />
                </div>
                {/* Seta indicadora apontando para baixo */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black/90 rotate-45 border-r border-b border-white/20"></div>
              </div>
            )}
            
            {/* Buffered bar */}
            <div className="relative w-full h-1.5 bg-white/20 rounded-full overflow-hidden cursor-pointer">
              <div 
                className="absolute h-full bg-white/30 rounded-full"
                style={{ width: `${bufferedPercent}%` }}
              />
              {/* Progress bar */}
              <div 
                className="absolute h-full bg-[#00A8E1] rounded-full"
                style={{ width: `${progressPercent}%` }}
              >
                {/* Handle */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#00A8E1] rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg transform scale-0 group-hover:scale-100" />
              </div>
              {/* Invisible seek input */}
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={(e) => { e.stopPropagation(); handleSeek(e); }}
                onClick={(e) => e.stopPropagation()}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
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

              {/* Stop */}
              <button
                onClick={(e) => { e.stopPropagation(); handleStop(); }}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                title="Parar"
              >
                <Square size={24} className="text-white" fill="white" />
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

              {/* Next Episode */}
              {hasNextEpisode && (
                <button 
                  onClick={(e) => { e.stopPropagation(); if (onNextEpisode) onNextEpisode(); }}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  title="Próximo Episódio"
                >
                  <ChevronRight size={22} className="text-white" />
                </button>
              )}

              {/* Mini Player */}
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  e.preventDefault();
                  console.log('[VideoJSPlayer] Mini player button CLICKED, current state:', isMiniPlayer);
                  handleToggleMiniPlayer(); 
                }}
                className={`p-2 rounded-full transition-all pointer-events-auto cursor-pointer z-[9999] ${isMiniPlayer ? 'bg-[#00A8E1] scale-110' : 'hover:bg-white/20'}`}
                title={isMiniPlayer ? 'Sair do Mini Player' : 'Mini Player'}
                type="button"
                style={{ pointerEvents: 'auto', touchAction: 'manipulation' }}
              >
                <PictureInPicture2 size={22} className="text-white" />
              </button>

              {/* Audio Track Selector - Mobile Optimized */}
              {audioTracks.length > 1 && (
                <div className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowAudioMenu(!showAudioMenu); setShowSubtitleMenu(false); }}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    title="Selecionar áudio"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                    <span className="hidden sm:inline">{audioTracks.find(t => t.id === currentAudioTrack)?.label || 'Áudio'}</span>
                    <span className="sm:hidden">{currentAudioTrack + 1}/{audioTracks.length}</span>
                  </button>
                  
                  {showAudioMenu && (
                    <div 
                      className="absolute bottom-full right-0 mb-2 bg-black/95 backdrop-blur rounded-lg p-2 min-w-[180px] shadow-2xl border border-white/10 z-50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="text-xs text-gray-400 px-3 py-1 border-b border-white/10 mb-1">
                        Selecionar idioma
                      </div>
                      {audioTracks.map((track) => (
                        <button
                          key={track.id}
                          onClick={() => changeAudioTrack(track.id)}
                          className={`w-full text-left px-3 py-2.5 text-sm rounded transition-colors flex items-center gap-2 ${
                            currentAudioTrack === track.id ? 'bg-[#00A8E1] text-white font-medium' : 'text-white hover:bg-white/10'
                          }`}
                        >
                          {currentAudioTrack === track.id && (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                          <span className={currentAudioTrack === track.id ? '' : 'pl-6'}>
                            {track.label}
                          </span>
                          {track.language !== 'unknown' && (
                            <span className="text-xs opacity-60 ml-auto">({track.language})</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Chromecast */}
              <CastButton
                mediaInfo={{
                  contentId: videoUrl || originalUrl,
                  contentType: 'video/mp4',
                  title: title,
                  poster: poster,
                  currentTime: currentTime,
                  duration: duration,
                }}
                size="md"
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              />

              {/* Subtitles */}
              <div className="relative">
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowSubtitleMenu(!showSubtitleMenu); setShowAudioMenu(false); }}
                  className={`p-2 hover:bg-white/20 rounded-full transition-colors ${subtitlesEnabled ? 'text-[#00A8E1]' : ''}`}
                >
                  <Subtitles size={22} className="text-white" />
                </button>
                
                {showSubtitleMenu && (
                  <div 
                    className="absolute bottom-full right-0 mb-2 bg-black/95 backdrop-blur rounded-lg p-2 min-w-[120px] shadow-2xl border border-white/10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => changeSubtitleTrack(-1)}
                      className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                        currentSubtitleTrack === -1 ? 'bg-[#00A8E1] text-white font-medium' : 'text-white hover:bg-white/10'
                      }`}
                    >
                      Desligado
                    </button>
                    {subtitleTracks.map((track, index) => (
                      <button
                        key={index}
                        onClick={() => changeSubtitleTrack(index)}
                        className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                          currentSubtitleTrack === index ? 'bg-[#00A8E1] text-white font-medium' : 'text-white hover:bg-white/10'
                        }`}
                      >
                        {track.label || `Legenda ${index + 1}`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

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

      {/* Resume Dialog */}
      {showResumeDialog && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50">
          <div className="bg-[#141414] border border-white/10 rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-[#00A8E1]/20 rounded-full flex items-center justify-center">
                <Play size={24} className="text-[#00A8E1]" />
              </div>
              <h3 className="text-white text-xl font-bold">Continuar assistindo?</h3>
            </div>
            <p className="text-white/70 mb-6">
              Você parou em {formatTime(resumeTime)}. Deseja continuar de onde parou ou começar do início?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleResume}
                className="flex-1 bg-[#00A8E1] hover:bg-[#00A8E1]/80 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Continuar
              </button>
              <button
                onClick={handleStartFromBeginning}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Do início
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Next Episode Dialog - Netflix Style */}
      {showNextEpisodeDialog && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-50">
          <div className="relative max-w-2xl w-full mx-8">
            {/* Logo CineCasa */}
            <div className="flex justify-center mb-6">
              <img 
                src="/logo.png" 
                alt="CineCasa" 
                className="h-12 w-auto object-contain opacity-80"
              />
            </div>
            
            {/* Countdown Circle */}
            <div className="flex flex-col items-center">
              <div className="relative w-24 h-24 mb-6">
                {/* Background circle */}
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="4"
                    fill="none"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="#E50914"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={251}
                    strokeDashoffset={251 * (nextEpisodeCountdown / 10)}
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>
                {/* Countdown number */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">{nextEpisodeCountdown}</span>
                </div>
              </div>
              
              <h3 className="text-white text-2xl font-semibold mb-2">
                Próximo episódio em {nextEpisodeCountdown}s
              </h3>
              <p className="text-gray-400 mb-8">
                Prepare-se para continuar assistindo
              </p>
              
              <div className="flex gap-4">
                <button
                  onClick={cancelNextEpisode}
                  className="px-8 py-3 bg-transparent border-2 border-white/30 hover:border-white text-white font-medium rounded transition-all duration-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    cancelNextEpisode();
                    if (onNextEpisode) onNextEpisode();
                  }}
                  className="px-8 py-3 bg-[#E50914] hover:bg-[#B20710] text-white font-medium rounded transition-all duration-300"
                >
                  Assistir Agora
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Watermark CineCasa - canto superior direito - TRANSPARENTE */}
      <div className="absolute top-4 right-4 z-30 pointer-events-none">
        <div className="flex items-center gap-2 opacity-40 hover:opacity-80 transition-opacity duration-300">
          <img 
            src="/logo.png" 
            alt="CineCasa" 
            className="h-8 w-auto object-contain"
            style={{ 
              filter: 'drop-shadow(0 0 8px rgba(0, 229, 255, 0.7)) brightness(1.2)',
              mixBlendMode: 'screen'
            }}
          />
        </div>
      </div>

      {/* Neon Skin CSS Injection */}
      <style>{`
        /* Video.js Neon Skin */
        .video-js .vjs-progress-holder {
          background: rgba(255, 255, 255, 0.2) !important;
        }
        .video-js .vjs-play-progress {
          background: #00E5FF !important;
          box-shadow: 0 0 10px rgba(0, 229, 255, 0.5) !important;
        }
        .video-js .vjs-load-progress {
          background: rgba(255, 255, 255, 0.3) !important;
        }
        .video-js .vjs-slider:focus {
          box-shadow: 0 0 15px rgba(0, 229, 255, 0.5) !important;
        }
        /* Neon controls */
        .neon-progress-bar {
          background: linear-gradient(90deg, #00E5FF 0%, #00B8D4 100%);
          box-shadow: 0 0 12px rgba(0, 229, 255, 0.4);
        }
        .neon-button {
          filter: drop-shadow(0 0 4px rgba(0, 229, 255, 0.3));
          transition: all 0.2s ease;
        }
        .neon-button:hover {
          filter: drop-shadow(0 0 8px rgba(0, 229, 255, 0.6));
          transform: scale(1.05);
        }
        .neon-icon {
          color: #00E5FF !important;
          filter: drop-shadow(0 0 4px rgba(0, 229, 255, 0.5));
        }
        /* Mobile touch targets */
        @media (pointer: coarse) {
          .touch-button {
            min-width: 48px !important;
            min-height: 48px !important;
            padding: 12px !important;
          }
          .touch-progress {
            height: 20px !important;
          }
        }
      `}</style>
    </div>
  );

  // Use Portal to render outside of React tree for proper z-index handling
  return createPortal(playerContent, document.body);
};

export default VideoJSPlayer;
