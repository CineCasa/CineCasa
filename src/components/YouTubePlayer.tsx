import React, { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

/**
 * CORREÇÕES + NOVAS FEATURES:
 * 1. YouTube IFrame API real (não mais iframe cego)
 * 2. Resume automático a partir de resumeFrom (time_position do banco)
 * 3. Salva progresso em user_progress a cada 10s via onStateChange
 * 4. Preview thumbnails via TMDB backdrops na scrubber customizada
 * 5. Overlay "Próximo episódio" estilo Netflix nos últimos 20s
 */

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YouTubePlayerProps {
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
  tmdbId?: string;
  tmdbType?: 'movie' | 'tv';
  onNextEpisode?: () => void;
  hasNextEpisode?: boolean;
  nextEpisodeTitle?: string;
}

function extractYouTubeId(url: string): string {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&\s]+)/,
    /(?:youtu\.be\/)([^?\s]+)/,
    /(?:youtube\.com\/embed\/)([^?\s]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m?.[1]) return m[1];
  }
  return url;
}

async function fetchTmdbThumbnails(
  tmdbId: string,
  tmdbType: 'movie' | 'tv',
  duration: number
): Promise<{ time: number; url: string }[]> {
  if (!tmdbId || !duration) return [];
  try {
    const endpoint =
      tmdbType === 'tv'
        ? `https://api.themoviedb.org/3/tv/${tmdbId}/images?language=null`
        : `https://api.themoviedb.org/3/movie/${tmdbId}/images?language=null`;
    const res = await fetch(endpoint, {
      headers: {
        Authorization:
          'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiYjc3YjQwNDUwYzEyZTMwOGI1MjJiYzk4MGEzN2Y1ZSIsInN1YiI6IjYzNjA4MzI5MTA5ZGVjMDA3YzJiODQzZCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.zstR6WPo8T1vFiTTUy6X0un-paY6AljxTLU2IJN8t-o',
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const backdrops: any[] = (data.backdrops || []).slice(0, 20);
    if (!backdrops.length) return [];
    const step = duration / backdrops.length;
    return backdrops.map((b: any, i: number) => ({
      time: Math.round(i * step),
      url: `https://image.tmdb.org/t/p/w300${b.file_path}`,
    }));
  } catch {
    return [];
  }
}

export default function YouTubePlayer({
  url,
  title,
  poster,
  onClose,
  contentId,
  contentType = 'movie',
  episodeId,
  seasonNumber,
  episodeNumber,
  resumeFrom = 0,
  tmdbId,
  tmdbType = 'movie',
  onNextEpisode,
  hasNextEpisode = false,
  nextEpisodeTitle,
}: YouTubePlayerProps) {
  const { user } = useAuth();
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout>();
  const lastSavedRef = useRef<number>(0);
  const thumbnailsRef = useRef<{ time: number; url: string }[]>([]);
  const scrubberRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const [playerReady, setPlayerReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(100);
  const [showControls, setShowControls] = useState(true);
  const controlsTimerRef = useRef<NodeJS.Timeout>();
  const [showNextEp, setShowNextEp] = useState(false);
  const [nextEpCountdown, setNextEpCountdown] = useState(10);
  const countdownRef = useRef<NodeJS.Timeout>();

  // Preview scrubber
  const [preview, setPreview] = useState<{ visible: boolean; x: number; url: string; timeStr: string }>({
    visible: false, x: 0, url: '', timeStr: '',
  });

  const videoId = extractYouTubeId(url);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Salva progresso no Supabase
  const saveProgress = useCallback(
    async (ct: number, dur: number, force = false) => {
      if (!user?.id || !contentId || !dur) return;
      if (!force && Math.abs(ct - lastSavedRef.current) < 10) return;
      lastSavedRef.current = ct;
      const progress = Math.min(Math.round((ct / dur) * 100), 100);
      await supabase.from('user_progress').upsert(
        {
          user_id: user.id,
          content_id: contentId,
          content_type: contentType,
          progress,
          current_time: Math.round(ct),
          time_position: Math.round(ct),
          duration: Math.round(dur),
          episode_id: episodeId ?? null,
          season_number: seasonNumber ?? null,
          episode_number: episodeNumber ?? null,
          title,
          last_watched: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,content_id' }
      );
    },
    [user?.id, contentId, contentType, episodeId, seasonNumber, episodeNumber, title]
  );

  const getThumbnailForTime = useCallback((time: number) => {
    const thumbs = thumbnailsRef.current;
    if (!thumbs.length) return '';
    let closest = thumbs[0];
    for (const t of thumbs) {
      if (Math.abs(t.time - time) < Math.abs(closest.time - time)) closest = t;
    }
    return closest.url;
  }, []);

  // Iniciar YouTube IFrame API
  useEffect(() => {
    const initPlayer = () => {
      if (!containerRef.current) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,        // escondemos os controles nativos
          rel: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          cc_load_policy: 0,
          fs: 0,
          start: resumeFrom > 0 ? Math.floor(resumeFrom) : undefined,
        },
        events: {
          onReady: async (e: any) => {
            setPlayerReady(true);
            const dur = e.target.getDuration();
            setDuration(dur);
            if (resumeFrom > 0) e.target.seekTo(resumeFrom, true);
            e.target.playVideo();

            // Carregar thumbnails
            if (tmdbId) {
              thumbnailsRef.current = await fetchTmdbThumbnails(tmdbId, tmdbType, dur);
            }

            // Poll para atualizar barra de progresso a cada 500ms
            pollRef.current = setInterval(() => {
              if (!playerRef.current) return;
              const ct = playerRef.current.getCurrentTime?.() || 0;
              const dur2 = playerRef.current.getDuration?.() || 0;
              const bufferedFrac = playerRef.current.getVideoLoadedFraction?.() || 0;
              setCurrentTime(ct);
              setDuration(dur2);
              setBuffered(bufferedFrac * dur2);
              saveProgress(ct, dur2);

              // Próximo episódio: últimos 20s
              if (hasNextEpisode && dur2 > 0 && dur2 - ct <= 20 && dur2 - ct > 0) {
                setShowNextEp(true);
              }
            }, 500);
          },
          onStateChange: (e: any) => {
            // YT.PlayerState: -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued
            setIsPlaying(e.data === 1);
            if (e.data === 2 || e.data === 0) {
              const ct = playerRef.current?.getCurrentTime?.() || 0;
              const dur = playerRef.current?.getDuration?.() || 0;
              saveProgress(ct, dur, true);
            }
            if (e.data === 0 && hasNextEpisode) {
              setShowNextEp(true);
              setNextEpCountdown(10);
              let c = 10;
              countdownRef.current = setInterval(() => {
                c--;
                setNextEpCountdown(c);
                if (c <= 0) { clearInterval(countdownRef.current); onNextEpisode?.(); }
              }, 1000);
            }
          },
        },
      });
    };

    if (window.YT?.Player) {
      initPlayer();
    } else {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      clearInterval(pollRef.current);
      clearInterval(countdownRef.current);
      clearTimeout(controlsTimerRef.current);
      if (playerRef.current) {
        const ct = playerRef.current.getCurrentTime?.() || 0;
        const dur = playerRef.current.getDuration?.() || 0;
        if (dur > 0) saveProgress(ct, dur, true);
        playerRef.current.destroy?.();
        playerRef.current = null;
      }
    };
  }, [videoId]);

  // Auto-hide controls
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const ct = playerRef.current?.getCurrentTime?.() || 0;
        const dur = playerRef.current?.getDuration?.() || 0;
        if (dur > 0) saveProgress(ct, dur, true);
        onClose();
      }
      if (e.key === ' ') { togglePlay(); e.preventDefault(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) playerRef.current.pauseVideo?.();
    else playerRef.current.playVideo?.();
  };

  const handleClose = () => {
    const ct = playerRef.current?.getCurrentTime?.() || 0;
    const dur = playerRef.current?.getDuration?.() || 0;
    if (dur > 0) saveProgress(ct, dur, true);
    onClose();
  };

  // Scrubber seek
  const handleScrubberClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrubberRef.current || !duration) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const seekTime = Math.max(0, Math.min(ratio * duration, duration));
    playerRef.current?.seekTo?.(seekTime, true);
    setCurrentTime(seekTime);
  };

  const handleScrubberMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrubberRef.current || !duration) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const hoverTime = Math.max(0, Math.min(ratio * duration, duration));
    const thumbUrl = getThumbnailForTime(hoverTime);
    setPreview({
      visible: !!thumbUrl,
      x: e.clientX - rect.left,
      url: thumbUrl,
      timeStr: formatTime(hoverTime),
    });
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div
      className="fixed inset-0 bg-black z-50 flex flex-col select-none"
      onMouseMove={resetControlsTimer}
      onClick={resetControlsTimer}
    >
      {/* YouTube iframe — sem controles nativos */}
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: isPlaying && !showControls ? 'none' : 'auto' }}
        onClick={togglePlay}
      />

      {/* Overlay de controles */}
      <div
        className={`absolute inset-0 flex flex-col justify-between transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 25%, transparent 75%, rgba(0,0,0,0.85) 100%)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-white text-sm md:text-base font-semibold truncate max-w-xs md:max-w-lg">{title}</h2>
          <button
            onClick={handleClose}
            className="text-white px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm"
          >
            ✕ Fechar
          </button>
        </div>

        {/* Controles inferiores */}
        <div className="px-4 pb-4 space-y-2" onClick={e => e.stopPropagation()}>
          {/* Scrubber com preview */}
          <div className="relative">
            {/* Thumbnail preview */}
            {preview.visible && preview.url && (
              <div
                className="absolute pointer-events-none z-20 bottom-full mb-2"
                style={{ left: preview.x, transform: 'translateX(-50%)' }}
              >
                <div className="bg-black rounded overflow-hidden shadow-2xl border border-white/20">
                  <img src={preview.url} alt="preview" className="w-40 h-24 object-cover" loading="lazy" />
                  <div className="text-center text-white text-xs py-1 bg-black/80 font-mono">{preview.timeStr}</div>
                </div>
              </div>
            )}

            {/* Barra */}
            <div
              ref={scrubberRef}
              className="relative h-1 bg-white/30 rounded-full cursor-pointer group hover:h-2 transition-all"
              onClick={handleScrubberClick}
              onMouseMove={handleScrubberMouseMove}
              onMouseLeave={() => setPreview(p => ({ ...p, visible: false }))}
            >
              {/* Buffered */}
              <div
                className="absolute top-0 left-0 h-full bg-white/40 rounded-full"
                style={{ width: `${bufferedPct}%` }}
              />
              {/* Progress */}
              <div
                className="absolute top-0 left-0 h-full bg-[#00d9ff] rounded-full"
                style={{ width: `${progressPct}%` }}
              />
              {/* Thumb */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `${progressPct}%`, transform: 'translateX(-50%) translateY(-50%)' }}
              />
            </div>
          </div>

          {/* Botões */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Play/Pause */}
              <button onClick={togglePlay} className="text-white hover:text-[#00d9ff] transition-colors">
                {isPlaying ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              {/* Volume */}
              <button
                onClick={() => {
                  const newMuted = !isMuted;
                  setIsMuted(newMuted);
                  if (newMuted) playerRef.current?.mute?.();
                  else playerRef.current?.unMute?.();
                }}
                className="text-white hover:text-[#00d9ff] transition-colors"
              >
                {isMuted ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                  </svg>
                )}
              </button>

              {/* Tempo */}
              <span className="text-white text-xs font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Velocidade */}
            <div className="flex items-center gap-2">
              {[0.5, 1, 1.25, 1.5, 2].map(rate => (
                <button
                  key={rate}
                  onClick={() => playerRef.current?.setPlaybackRate?.(rate)}
                  className="text-xs text-gray-400 hover:text-white px-1.5 py-0.5 rounded transition-colors"
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Próximo episódio overlay — estilo Netflix */}
      {showNextEp && hasNextEpisode && (
        <div className="absolute bottom-24 right-6 z-30 flex flex-col items-end gap-2">
          <div className="text-sm text-gray-300">
            Próximo episódio em <span className="text-white font-bold">{nextEpCountdown}s</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { clearInterval(countdownRef.current); setShowNextEp(false); }}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => { clearInterval(countdownRef.current); setShowNextEp(false); onNextEpisode?.(); }}
              className="px-5 py-2 bg-white text-black font-bold text-sm rounded-lg hover:bg-gray-200 flex items-center gap-2"
            >
              ▶ Próximo episódio
            </button>
          </div>
          {nextEpisodeTitle && (
            <div className="text-xs text-gray-400 max-w-xs text-right truncate">{nextEpisodeTitle}</div>
          )}
        </div>
      )}

      {/* Loading */}
      {!playerReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="text-center">
            {poster && (
              <img src={poster} alt={title} className="w-32 h-48 object-cover rounded-lg mx-auto mb-4 opacity-40" />
            )}
            <div className="w-10 h-10 border-4 border-[#00d9ff] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-gray-400 text-sm mt-3">Carregando {title}...</p>
          </div>
        </div>
      )}
    </div>
  );
}
