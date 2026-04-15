import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Play, Pause, RotateCcw, Volume2, VolumeX, Maximize2, Settings, Subtitles, Languages, X, ChevronLeft, SkipBack, SkipForward, Square, PictureInPicture2, Gauge, Cast, Users } from "lucide-react";
import { CastButton } from "./CastButton";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/components/AuthProvider';

interface NetflixPlayerProps {
  url: string;
  title: string;
  historyItem?: any;
  onClose: () => void;
  onNextEpisode?: () => void;
  hasNextEpisode?: boolean;
  seriesId?: string;
  episodeId?: string;
  onProgressUpdate?: (currentTime: number, duration: number) => void;
  contentType?: 'movie' | 'series';
  contentId?: string;
  seasonNumber?: number;
  episodeNumber?: number;
}

const NetflixPlayer = ({ 
  url, 
  title, 
  historyItem, 
  onClose, 
  onNextEpisode, 
  hasNextEpisode, 
  seriesId, 
  episodeId, 
  onProgressUpdate,
  contentType = 'movie',
  contentId,
  seasonNumber,
  episodeNumber
}: NetflixPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { user, profile } = useAuth();
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [volume, setVolume] = useState(1);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const controlsTimeout = useRef<NodeJS.Timeout | null>(null);
  const [showNextEpisode, setShowNextEpisode] = useState(false);
  const [nextEpisodeCountdown, setNextEpisodeCountdown] = useState(10);
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const [introEndTime, setIntroEndTime] = useState<number | null>(null);
  const [isPiPActive, setIsPiPActive] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(false);
  const [showSubtitlesMenu, setShowSubtitlesMenu] = useState(false);
  const [subtitleTracks, setSubtitleTracks] = useState<TextTrack[]>([]);
  const [currentSubtitleTrack, setCurrentSubtitleTrack] = useState<number>(-1);
  const [showAudioMenu, setShowAudioMenu] = useState(false);
  const [audioTracks, setAudioTracks] = useState<{id: number; label: string; language: string}[]>([]);
  const [currentAudioTrack, setCurrentAudioTrack] = useState<number>(0);
  const [showThumbnailPreview, setShowThumbnailPreview] = useState(false);
  const [thumbnailPreviewTime, setThumbnailPreviewTime] = useState(0);
  const [thumbnailPreviewPosition, setThumbnailPreviewPosition] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const progressSaveInterval = useRef<NodeJS.Timeout | null>(null);
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Save progress to watch_history
  const saveWatchHistory = async (currentTime: number, videoDuration: number) => {
    if (!user || !profile || !contentId) return;
    
    try {
      const progress = videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0;
      
      const { error } = await supabase.from('watch_history').upsert({
        profile_id: profile.id,
        content_id: contentId,
        content_type: contentType,
        titulo: title,
        poster: historyItem?.poster || '',
        progress: progress,
        duration: videoDuration,
        last_watched: new Date().toISOString()
      }, { onConflict: 'profile_id,content_id' });
      
      if (error) {
        console.error('[NetflixPlayer] Error saving watch history:', error);
      }
    } catch (err) {
      console.error('[NetflixPlayer] Failed to save watch history:', err);
    }
  };

  // Get user on mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  // Save watch history periodically
  useEffect(() => {
    if (!user || !profile || !contentId) return;
    
    progressSaveInterval.current = setInterval(() => {
      if (videoRef.current && duration > 0) {
        saveWatchHistory(videoRef.current.currentTime, duration);
      }
    }, 30000); // Save every 30 seconds

    return () => {
      if (progressSaveInterval.current) {
        clearInterval(progressSaveInterval.current);
      }
    };
  }, [user, profile, contentId, duration]);

  useEffect(() => {
    // Force landscape orientation on mobile when player opens
    const forceLandscape = async () => {
      if (screen.orientation && 'lock' in screen.orientation) {
        try {
          await (screen.orientation as any).lock('landscape');
          console.log('📱 Tela bloqueada em modo horizontal');
        } catch (error) {
          console.log('📱 Não foi possível bloquear orientação:', error);
        }
      }
    };

    // Check if mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      forceLandscape();
      // Request fullscreen on mobile for better experience
      const enterFullscreen = async () => {
        try {
          if (!document.fullscreenElement) {
            await document.documentElement.requestFullscreen();
            console.log('📱 Tela cheia ativada automaticamente');
          }
        } catch (error) {
          console.log('📱 Não foi possível ativar tela cheia:', error);
        }
      };
      enterFullscreen();
    }

    // Initial history save when player opens (progress 0 or previous)
    if (historyItem) {
      try {
        const historyStr = localStorage.getItem("paixaohist");
        let history = historyStr ? JSON.parse(historyStr) : [];
        const existing = history.find((h: any) => h.id === historyItem.id);
        const startProgress = existing?.progress || 0;
        
        history = history.filter((h: any) => h.id !== historyItem.id);
        history.unshift({ ...historyItem, timestamp: Date.now(), progress: startProgress });
        localStorage.setItem("paixaohist", JSON.stringify(history.slice(0, 50)));
      } catch (e) {
        console.error("Failed to init history:", e);
      }
    }

    // Cleanup: unlock orientation when player closes
    return () => {
      if (screen.orientation && 'unlock' in screen.orientation) {
        try {
          (screen.orientation as any).unlock();
          console.log('📱 Orientação da tela desbloqueada');
        } catch (error) {
          console.log('📱 Erro ao desbloquear orientação:', error);
        }
      }
    };
  }, [historyItem]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleClose = () => {
    // Unlock orientation before closing
    if (screen.orientation && 'unlock' in screen.orientation) {
      try {
        (screen.orientation as any).unlock();
        console.log('📱 Orientação desbloqueada ao fechar player');
      } catch (error) {
        console.log('📱 Erro ao desbloquear orientação:', error);
      }
    }
    onClose();
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setCurrentTime(current);
      setProgress((current / total) * 100);
      
      // Check if we should show skip intro button (between 0 and introEndTime)
      if (introEndTime && current > 0 && current < introEndTime) {
        setShowSkipIntro(true);
      } else {
        setShowSkipIntro(false);
      }
      
      // Check if we're near the end for next episode
      if (total > 0 && (total - current) < 30 && hasNextEpisode && !showNextEpisode) {
        setShowNextEpisode(true);
        setNextEpisodeCountdown(10);
        
        countdownInterval.current = setInterval(() => {
          setNextEpisodeCountdown((prev) => {
            if (prev <= 1) {
              if (onNextEpisode) onNextEpisode();
              setShowNextEpisode(false);
              if (countdownInterval.current) clearInterval(countdownInterval.current);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
      
      // Save progress every 10 seconds
      if (Math.floor(current) % 10 === 0) {
        saveProgress(current, total);
      }
    }
  };

  // Save progress to Supabase
  const saveProgress = async (current: number, total: number) => {
    if (!userId || !contentId) return;
    
    try {
      const progressData = {
        user_id: userId,
        content_type: contentType,
        [contentType === 'movie' ? 'cinema_id' : 'serie_id']: contentId,
        episode_id: episodeId || null,
        season_number: seasonNumber || null,
        current_time: current,
        duration: total,
        updated_at: new Date().toISOString()
      };
      
      // Upsert progress (insert or update)
      const { error } = await (supabase
        .from('watch_progress') as any)
        .upsert(progressData, {
          onConflict: 'user_id,' + (contentType === 'movie' ? 'cinema_id' : 'serie_id')
        });
      
      if (error) {
        console.error('Erro ao salvar progresso:', error);
      } else {
        console.log('✅ Progresso salvo no Supabase:', Math.round((current/total)*100) + '%');
      }
    } catch (err) {
      console.error('Erro ao salvar progresso no Supabase:', err);
    }
  };

  // Load video tracks when metadata is loaded
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      
      // Get subtitle tracks
      const tracks = videoRef.current.textTracks;
      const subtitleList: TextTrack[] = [];
      for (let i = 0; i < tracks.length; i++) {
        if (tracks[i].kind === 'subtitles' || tracks[i].kind === 'captions') {
          subtitleList.push(tracks[i]);
        }
      }
      setSubtitleTracks(subtitleList);
      
      // Get audio tracks (if available)
      const audioTrackList: {id: number; label: string; language: string}[] = [];
      if ((videoRef.current as any).audioTracks) {
        const audioTracks = (videoRef.current as any).audioTracks;
        for (let i = 0; i < audioTracks.length; i++) {
          audioTrackList.push({
            id: i,
            label: audioTracks[i].label || `Áudio ${i + 1}`,
            language: audioTracks[i].language || 'unknown'
          });
        }
      }
      setAudioTracks(audioTrackList);
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => setShowControls(false), 3000);
  };

  const formatTime = (time: number) => {
    const h = Math.floor(time / 3600);
    const m = Math.floor((time % 3600) / 60);
    const s = Math.floor(time % 60);
    return `${h > 0 ? h + ":" : ""}${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
      }
      if (progressSaveInterval.current) {
        clearInterval(progressSaveInterval.current);
      }
    };
  }, []);

  const skipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 10, duration);
    }
  };

  const skipBackward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 10, 0);
    }
  };

  const stopVideo = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const skipIntro = () => {
    if (videoRef.current && introEndTime) {
      videoRef.current.currentTime = introEndTime;
      setShowSkipIntro(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // Picture-in-Picture toggle
  const togglePiP = async () => {
    try {
      if (!document.pictureInPictureEnabled) {
        console.warn('Picture-in-Picture not supported');
        return;
      }

      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPiPActive(false);
      } else if (videoRef.current) {
        await videoRef.current.requestPictureInPicture();
        setIsPiPActive(true);
      }
    } catch (error) {
      console.error('PiP error:', error);
    }
  };

  // Playback speed control
  const changePlaybackSpeed = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
      setShowSpeedMenu(false);
    }
  };

  // Toggle subtitles menu
  const toggleSubtitlesMenu = () => {
    setShowSubtitlesMenu(!showSubtitlesMenu);
    setShowAudioMenu(false);
    setShowSpeedMenu(false);
  };

  // Change subtitle track
  const changeSubtitleTrack = (trackIndex: number) => {
    if (videoRef.current) {
      const tracks = videoRef.current.textTracks;
      
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
      setShowSubtitlesMenu(false);
    }
  };

  // Toggle audio menu
  const toggleAudioMenu = () => {
    setShowAudioMenu(!showAudioMenu);
    setShowSubtitlesMenu(false);
    setShowSpeedMenu(false);
  };

  // Change audio track
  const changeAudioTrack = (trackId: number) => {
    if (videoRef.current && (videoRef.current as any).audioTracks) {
      const audioTracks = (videoRef.current as any).audioTracks;
      if (audioTracks[trackId]) {
        audioTracks[trackId].enabled = true;
        for (let i = 0; i < audioTracks.length; i++) {
          if (i !== trackId) {
            audioTracks[i].enabled = false;
          }
        }
        setCurrentAudioTrack(trackId);
      }
    }
    setShowAudioMenu(false);
  };

  // Handle progress bar hover for thumbnail preview
  const handleProgressBarMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !videoRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const time = pct * duration;
    setThumbnailPreviewTime(time);
    setThumbnailPreviewPosition(pct * 100);
    setShowThumbnailPreview(true);
  };

  const handleProgressBarMouseLeave = () => {
    setShowThumbnailPreview(false);
  };

  // Capture video frame for thumbnail preview
  useEffect(() => {
    if (!showThumbnailPreview || !videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Seek to preview time and draw frame
    const wasPlaying = !video.paused;
    const currentTime = video.currentTime;
    
    // Save current time
    const originalTime = currentTime;
    
    // Seek to preview time
    video.currentTime = thumbnailPreviewTime;
    
    // Draw frame when seeked
    const handleSeeked = () => {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      // Restore original time
      video.currentTime = originalTime;
      if (wasPlaying) video.play();
      video.removeEventListener('seeked', handleSeeked);
    };
    
    video.addEventListener('seeked', handleSeeked);
    
    return () => {
      if (video) {
        video.removeEventListener('seeked', handleSeeked);
      }
    };
  }, [showThumbnailPreview, thumbnailPreviewTime]);

  useEffect(() => {
    const handlePiPChange = () => {
      setIsPiPActive(!!document.pictureInPictureElement);
    };

    document.addEventListener('enterpictureinpicture', handlePiPChange);
    document.addEventListener('leavepictureinpicture', handlePiPChange);

    return () => {
      document.removeEventListener('enterpictureinpicture', handlePiPChange);
      document.removeEventListener('leavepictureinpicture', handlePiPChange);
    };
  }, []);

  const isYouTube = url.includes("youtube.com") || url.includes("youtu.be");

  // Converter URL do YouTube para formato embed
  const getYouTubeEmbedUrl = (youtubeUrl: string): string => {
    // Extrair video ID de diferentes formatos de URL do YouTube
    const videoIdMatch = youtubeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;
    
    if (!videoId) {
      console.warn('⚠️ Não foi possível extrair video ID do YouTube URL:', youtubeUrl);
      return youtubeUrl; // Fallback para URL original
    }
    
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&mute=${isMuted ? 1 : 0}&modestbranding=1&rel=0&iv_load_policy=3`;
  };

  const youtubeEmbedUrl = isYouTube ? getYouTubeEmbedUrl(url) : url;

  const handleContainerInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
  };

  const renderSkipIntroButton = () => {
    if (!showSkipIntro) return null;
    return (
      <div className="absolute bottom-32 right-8 z-50 animate-fade-in">
        <button
          onClick={skipIntro}
          className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2"
        >
          Pular Intro
          <SkipForward size={18} />
        </button>
      </div>
    );
  };

  const renderNextEpisodeModal = () => {
    if (!showNextEpisode || !hasNextEpisode) return null;
    return (
      <div className="fixed bottom-20 right-4 md:right-8 bg-black/90 backdrop-blur-xl rounded-2xl p-6 z-[100] min-w-[280px] border border-white/20 shadow-2xl animate-scale-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
            <Play className="w-6 h-6 text-white ml-1" />
          </div>
          <div>
            <p className="text-white text-sm font-medium">Próximo episódio em</p>
            <p className="text-red-500 text-2xl font-bold">{nextEpisodeCountdown}s</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              if (countdownInterval.current) clearInterval(countdownInterval.current);
              setShowNextEpisode(false);
              if (onNextEpisode) onNextEpisode();
            }}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg text-sm font-bold transition-colors uppercase tracking-wider"
          >
            Assistir Agora
          </button>
          <button
            onClick={() => {
              if (countdownInterval.current) clearInterval(countdownInterval.current);
              setShowNextEpisode(false);
            }}
            className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  };

  const playerContent = (
    <div 
      className="fixed inset-0 z-[999999] bg-black flex items-center justify-center overflow-hidden pointer-events-auto"
      onMouseMove={(e) => {
        handleMouseMove();
        e.stopPropagation();
      }}
      onClick={handleContainerInteraction}
      onTouchStart={handleContainerInteraction}
    >
      {isYouTube ? (
        <iframe
          src={youtubeEmbedUrl}
          className="w-screen h-screen pointer-events-none"
          allow="autoplay; fullscreen"
          title={title}
        />
      ) : (
        <video
          ref={videoRef}
          src={url}
          className="w-full h-full object-contain"
          autoPlay
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onClick={togglePlay}
        />
      )}

      {/* Custom Styles as requested from the snippet */}
      <style dangerouslySetInnerHTML={{__html: `
        .overlay-controls {
          position: absolute; inset: auto 0 0 0; 
          background: linear-gradient(transparent, #000000dd);
          padding: clamp(16px, 4vh, 32px) clamp(24px, 4vw, 48px);
          display: flex; align-items: center; justify-content: space-between;
          opacity: 0; transform: translateY(100%);
          transition: opacity 0.3s ease, transform 0.3s ease;
          pointer-events: none;
        }
        .overlay-controls.show {
          opacity: 1; transform: none; pointer-events: auto;
        }
        .oc-btn {
          background: #ffffff26; border: none; color: #fff;
          font-size: clamp(20px, 4vw, 32px);
          width: clamp(48px, 6vw, 64px); height: clamp(48px, 6vw, 64px);
          border-radius: 50%; cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          display: inline-flex; align-items: center; justify-content: center;
          transition: transform 0.2s, background 0.2s;
        }
        .oc-btn:active, .oc-btn:hover { transform: scale(1.1); background: #ffffff4a; }
        .progress-bar-container {
          flex: 1; display: flex; flex-direction: column; gap: 8px; margin: 0 clamp(20px, 4vw, 40px);
        }
        .progress-bar {
          height: 6px; background: #ffffff4a; border-radius: 3px; position: relative; cursor: pointer;
        }
        .progress-bar div {
          height: 100%; background: var(--glow, #ffc107); border-radius: inherit; transition: width 0.1s linear;
        }
        .time-label {
          font-size: clamp(12px, 1.5vw, 16px); opacity: 0.9; color: white; text-align: right;
        }
        .top-bar {
          position: absolute; top: 0; left: 0; right: 0;
          padding: 24px 32px; display: flex; justify-content: space-between; align-items: center;
          background: linear-gradient(#000000dd, transparent);
          opacity: 0; transform: translateY(-100%);
          transition: opacity 0.3s ease, transform 0.3s ease;
          pointer-events: none;
        }
        .top-bar.show {
           opacity: 1; transform: none; pointer-events: auto;
        }
      `}} />

      <div className={`top-bar ${showControls ? 'show' : ''}`} onClick={handleContainerInteraction}>
        <button onClick={handleClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
          <ChevronLeft size={36} />
        </button>
        <h2 className="text-xl md:text-2xl font-bold text-white uppercase tracking-[0.2em]">{title}</h2>
        <button className="p-2 opacity-0 cursor-default">
           <X size={36} />
        </button>
      </div>

      <div className={`overlay-controls ${showControls ? 'show' : ''}`} onClick={handleContainerInteraction}>
        <div className="flex items-center gap-2">
          <button className="oc-btn" onClick={skipBackward} title="Voltar 10s">
            <SkipBack size={28} />
          </button>
          <button className="oc-btn" onClick={togglePlay}>
            {isPlaying ? <Pause size={32} /> : <Play size={32} />}
          </button>
          <button className="oc-btn" onClick={skipForward} title="Avançar 10s">
            <SkipForward size={28} />
          </button>
          <button className="oc-btn" onClick={stopVideo} title="Parar">
            <Square size={24} fill="currentColor" />
          </button>
        </div>

        <div className="progress-bar-container" ref={progressBarRef}>
          {showThumbnailPreview && !isYouTube && (
            <div 
              className="absolute bottom-full mb-2 transform -translate-x-1/2"
              style={{ left: `${thumbnailPreviewPosition}%` }}
            >
              <canvas
                ref={canvasRef}
                width={160}
                height={90}
                className="rounded-lg border-2 border-white/30 shadow-2xl bg-black"
              />
              <div className="text-center text-white text-xs mt-1 bg-black/80 px-2 py-0.5 rounded">
                {formatTime(thumbnailPreviewTime)}
              </div>
            </div>
          )}
          <div 
            className="progress-bar" 
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              if (videoRef.current) {
                videoRef.current.currentTime = pct * duration;
                setProgress(pct * 100);
              }
            }}
            onMouseMove={handleProgressBarMouseMove}
            onMouseLeave={handleProgressBarMouseLeave}
          >
            <div style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="flex justify-between items-center text-white/70">
          <span className="time-label">{formatTime(currentTime)} / {formatTime(duration)}</span>
          <div className="flex gap-3">
             <div className="relative">
               <button 
                 className={`p-2 rounded-full transition-colors ${subtitlesEnabled ? 'bg-white/40' : 'hover:bg-white/20'}`} 
                 title="Legendas/CC"
                 onClick={toggleSubtitlesMenu}
               >
                 <Subtitles size={20} className={subtitlesEnabled ? 'text-white' : 'text-gray-400'} />
               </button>
               {showSubtitlesMenu && (
                 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black/90 backdrop-blur rounded-lg p-2 min-w-[160px]">
                   <button
                     onClick={() => changeSubtitleTrack(-1)}
                     className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-white/10 transition-colors ${
                       currentSubtitleTrack === -1 ? 'text-red-500 font-bold' : 'text-white'
                     }`}
                   >
                     Desativadas
                   </button>
                   {subtitleTracks.map((track, index) => (
                     <button
                       key={index}
                       onClick={() => changeSubtitleTrack(index)}
                       className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-white/10 transition-colors ${
                         currentSubtitleTrack === index ? 'text-red-500 font-bold' : 'text-white'
                       }`}
                     >
                       {track.label || `Legenda ${index + 1}`} {track.language && `(${track.language})`}
                     </button>
                   ))}
                 </div>
               )}
             </div>

             <div className="relative">
               <button 
                 className={"p-2 rounded-full transition-colors " + (audioTracks.length > 0 ? "hover:bg-white/20" : "opacity-50 cursor-not-allowed")} 
                 title="Áudio/Idioma"
                 onClick={audioTracks.length > 0 ? toggleAudioMenu : undefined}
               >
                 <Languages size={20} className="text-gray-400" />
               </button>
               {showAudioMenu && audioTracks.length > 0 && (
                 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black/90 backdrop-blur rounded-lg p-2 min-w-[160px]">
                   {audioTracks.map((track) => (
                     <button
                       key={track.id}
                       onClick={() => changeAudioTrack(track.id)}
                       className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-white/10 transition-colors ${
                         currentAudioTrack === track.id ? 'text-red-500 font-bold' : 'text-white'
                       }`}
                     >
                       {track.label} {track.language !== 'unknown' && `(${track.language})`}
                     </button>
                   ))}
                 </div>
               )}
             </div>
             {/* Botão Assistir Juntos */}
             <button 
               className="p-2 hover:bg-white/20 rounded-full transition-colors" 
               onClick={() => {
                 const roomId = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 6);
                 const videoUrlParam = encodeURIComponent(url);
                 const watchUrl = `/watch.html?room=${roomId}&video=${videoUrlParam}`;
                 window.open(watchUrl, '_blank');
               }}
               title="Assistir Juntos"
             >
               <Users size={20} />
             </button>
             <button className="p-2 hover:bg-white/20 rounded-full transition-colors" title="Configurações">
               <Settings size={20} />
             </button>
             <button className="p-2 hover:bg-white/20 rounded-full transition-colors" onClick={toggleFullscreen} title="Tela Cheia">
               <Maximize2 size={20} />
             </button>
             <div className="relative">
               <button 
                 className="p-2 hover:bg-white/20 rounded-full transition-colors relative"
                 title={`Velocidade: ${playbackSpeed}x`}
                 onClick={() => setShowSpeedMenu(!showSpeedMenu)}
               >
                 <Gauge className="w-5 h-5 text-white" />
                 <span className="absolute -top-1 -right-1 text-[10px] bg-red-600 rounded-full w-4 h-4 flex items-center justify-center">
                   {playbackSpeed}x
                 </span>
               </button>
               {showSpeedMenu && (
                 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black/90 backdrop-blur rounded-lg p-2 min-w-[120px]">
                   {[0.5, 1, 1.25, 1.5, 2].map(speed => (
                     <button
                       key={speed}
                       onClick={() => changePlaybackSpeed(speed)}
                       className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-white/10 transition-colors ${
                         playbackSpeed === speed ? 'text-red-500 font-bold' : 'text-white'
                       }`}
                     >
                       {speed}x {speed === 1 && '(Normal)'}
                     </button>
                   ))}
                 </div>
               )}
             </div>
             {document.pictureInPictureEnabled && (
               <button 
                 className={"p-2 rounded-full transition-colors " + (isPiPActive ? "bg-white/40" : "hover:bg-white/20")}
                 title={isPiPActive ? "Sair do PiP" : "Picture in Picture"}
                 onClick={togglePiP}
               >
                 <PictureInPicture2 className="w-5 h-5 text-white" />
               </button>
             )}
             {/* Botão de Screen Cast */}
             <CastButton 
               mediaInfo={{
                 contentId: url,
                 contentType: 'video/mp4',
                 title: title,
                 poster: historyItem?.poster,
                 currentTime: currentTime,
                 duration: duration
               }}
               size="md"
               className="p-2 hover:bg-white/20 rounded-full transition-colors"
             />
             <button className="p-2 hover:bg-white/20 rounded-full transition-colors" onClick={() => setIsMuted(!isMuted)} title="Mudo">
               {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
             </button>
          </div>
        </div>
      </div>

      {renderSkipIntroButton()}
      {renderNextEpisodeModal()}
    </div>
  );

  return createPortal(playerContent, document.body);
};

export default NetflixPlayer;
