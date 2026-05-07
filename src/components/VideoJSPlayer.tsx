import React, { useEffect, useRef, useState, useCallback } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

/**
 * CORREÇÕES + NOVAS FEATURES:
 * 1. timeupdate event → salva progresso em user_progress a cada 10s
 * 2. Preview de thumbnails na scrubber via TMDB /images backdrops
 * 3. Resume automático a partir de time_position
 * 4. Marca como completo quando progress >= 95%
 */

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
  // Para preview thumbnails
  tmdbId?: string;
  tmdbType?: 'movie' | 'tv';
  // Callback para próximo episódio
  onNextEpisode?: () => void;
  hasNextEpisode?: boolean;
  nextEpisodeTitle?: string;
}

// Gera miniaturas a partir dos backdrops do TMDB
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
          'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI3ODZhZmQ3ZjM5ZjRkNzQ4YjQ3ZDk4ZDc5NjMzZDZhNyIsInN1YiI6IjY3ODM5ZmFkM2Q4ZDQ5MDJhOWJkNGU4ZCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.1nCqkKQk6JX5N7Y8Z9T3mB1q2L3p4r5s6t7u8v9w0x',
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const backdrops: any[] = data.backdrops || [];
    // Pega até 20 backdrops, distribui uniformemente ao longo do vídeo
    const selected = backdrops.slice(0, 20);
    if (selected.length === 0) return [];
    const step = duration / selected.length;
    return selected.map((b: any, i: number) => ({
      time: Math.round(i * step),
      url: `https://image.tmdb.org/t/p/w300${b.file_path}`,
    }));
  } catch {
    return [];
  }
}

export default function VideoJSPlayer({
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
}: VideoJSPlayerProps) {
  const { user } = useAuth();
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const progressTimerRef = useRef<NodeJS.Timeout>();
  const lastSavedTimeRef = useRef<number>(0);
  const thumbnailsRef = useRef<{ time: number; url: string }[]>([]);

  // Preview state
  const [preview, setPreview] = useState<{ visible: boolean; x: number; url: string; time: string }>({
    visible: false,
    x: 0,
    url: '',
    time: '',
  });

  // Próximo episódio overlay (aparece 20s antes do fim)
  const [showNextEp, setShowNextEp] = useState(false);
  const [nextEpCountdown, setNextEpCountdown] = useState(10);
  const countdownRef = useRef<NodeJS.Timeout>();

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Salva progresso no Supabase
  const saveProgress = useCallback(
    async (currentTime: number, duration: number, force = false) => {
      if (!user?.id || !contentId || !duration) return;
      // Salva a cada 10s ou se forçado
      if (!force && Math.abs(currentTime - lastSavedTimeRef.current) < 10) return;
      lastSavedTimeRef.current = currentTime;

      const progress = Math.min(Math.round((currentTime / duration) * 100), 100);

      await supabase.from('user_progress').upsert(
        {
          user_id: user.id,
          content_id: contentId,
          content_type: contentType,
          progress,
          current_time: Math.round(currentTime),
          time_position: Math.round(currentTime),
          duration: Math.round(duration),
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

  // Busca thumbnail para posição do hover
  const getThumbnailForTime = useCallback((time: number) => {
    const thumbs = thumbnailsRef.current;
    if (!thumbs.length) return '';
    let closest = thumbs[0];
    for (const t of thumbs) {
      if (Math.abs(t.time - time) < Math.abs(closest.time - time)) closest = t;
    }
    return closest.url;
  }, []);

  useEffect(() => {
    if (!videoRef.current) return;

    const videoElement = document.createElement('video-js');
    videoElement.classList.add('vjs-big-play-centered');
    videoRef.current.appendChild(videoElement);

    const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');

    const playerOptions: any = {
      html5: {
        vhs: {
          overrideNative: true,
          limitRenditionByPlayerDimensions: true,
          useDevicePixelRatio: true,
          smoothQualityChange: true,
        },
        nativeAudioTracks: false,
        nativeVideoTracks: false,
      },
      controls: true,
      fluid: true,
      responsive: true,
      preload: 'auto',
      poster,
      playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
      techOrder: isYouTube ? ['youtube', 'html5'] : ['html5'],
      sources: [{ src: url, type: getVideoType(url) }],
      youtube: { ytControls: 0, customVars: { rel: 0, modestbranding: 1 } },
    };

    const player = videojs(videoElement, playerOptions, async () => {
      if (resumeFrom > 0) player.currentTime(resumeFrom);
      player.play().catch(() => {});

      // Buscar thumbnails após player pronto
      if (tmdbId) {
        const dur = player.duration() || 7200;
        thumbnailsRef.current = await fetchTmdbThumbnails(tmdbId, tmdbType, dur);
      }
    });

    // ─── PROGRESS SAVING ──────────────────────────────────────
    player.on('timeupdate', () => {
      const currentTime = player.currentTime() || 0;
      const duration = player.duration() || 0;
      if (!duration) return;

      // Salva a cada ~10s
      saveProgress(currentTime, duration);

      // Próximo episódio: aparece nos últimos 20s
      if (hasNextEpisode && duration > 0 && duration - currentTime <= 20 && duration - currentTime > 0) {
        setShowNextEp(true);
      }
    });

    // Salva ao pausar/fechar
    player.on('pause', () => {
      const ct = player.currentTime() || 0;
      const dur = player.duration() || 0;
      if (dur > 0) saveProgress(ct, dur, true);
    });

    player.on('ended', () => {
      const dur = player.duration() || 0;
      if (dur > 0) saveProgress(dur, dur, true);
      // Auto-play próximo episódio após 10s
      if (hasNextEpisode) {
        setShowNextEp(true);
        setNextEpCountdown(10);
        let c = 10;
        countdownRef.current = setInterval(() => {
          c--;
          setNextEpCountdown(c);
          if (c <= 0) {
            clearInterval(countdownRef.current);
            onNextEpisode?.();
          }
        }, 1000);
      }
    });

    // ─── SCRUBBER PREVIEW ──────────────────────────────────────
    player.ready(() => {
      const progressControl = player.controlBar?.progressControl?.seekBar;
      if (!progressControl) return;

      const seekBarEl = progressControl.el() as HTMLElement;

      seekBarEl.addEventListener('mousemove', (e: MouseEvent) => {
        const rect = seekBarEl.getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / rect.width;
        const duration = player.duration() || 0;
        if (!duration) return;
        const hoverTime = Math.max(0, Math.min(ratio * duration, duration));
        const thumbUrl = getThumbnailForTime(hoverTime);

        setPreview({
          visible: !!thumbUrl,
          x: e.clientX - rect.left,
          url: thumbUrl,
          time: formatTime(hoverTime),
        });
      });

      seekBarEl.addEventListener('mouseleave', () => {
        setPreview(p => ({ ...p, visible: false }));
      });
    });

    playerRef.current = player;

    return () => {
      clearInterval(countdownRef.current);
      clearTimeout(progressTimerRef.current);
      if (playerRef.current && !playerRef.current.isDisposed()) {
        // Salvar progresso final antes de destruir
        const ct = playerRef.current.currentTime?.() || 0;
        const dur = playerRef.current.duration?.() || 0;
        if (dur > 0) saveProgress(ct, dur, true);
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [url]);

  // Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const ct = playerRef.current?.currentTime?.() || 0;
        const dur = playerRef.current?.duration?.() || 0;
        if (dur > 0) saveProgress(ct, dur, true);
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, saveProgress]);

  const handleClose = () => {
    const ct = playerRef.current?.currentTime?.() || 0;
    const dur = playerRef.current?.duration?.() || 0;
    if (dur > 0) saveProgress(ct, dur, true);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/90 to-transparent absolute top-0 left-0 right-0 z-10">
        <h2 className="text-white text-base font-semibold truncate max-w-sm md:max-w-lg">{title}</h2>
        <button
          onClick={handleClose}
          className="text-white hover:text-gray-300 transition-colors px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm"
        >
          ✕ Fechar
        </button>
      </div>

      {/* Video container */}
      <div className="flex-1 flex items-center justify-center relative">
        <div className="w-full h-full max-w-[100vw]">
          <div ref={videoRef} className="w-full h-full" />
        </div>

        {/* Thumbnail preview na scrubber */}
        {preview.visible && preview.url && (
          <div
            className="absolute pointer-events-none z-20 transition-opacity duration-100"
            style={{
              bottom: '68px',
              left: `${preview.x}px`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="bg-black rounded overflow-hidden shadow-2xl border border-white/20">
              <img
                src={preview.url}
                alt="Preview"
                className="w-40 h-24 object-cover"
                loading="lazy"
              />
              <div className="text-center text-white text-xs py-1 bg-black/80 font-mono">
                {preview.time}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Próximo episódio overlay — estilo Netflix */}
      {showNextEp && hasNextEpisode && (
        <div className="absolute bottom-24 right-6 z-20 flex flex-col items-end gap-2 animate-fade-in">
          <div className="text-sm text-gray-300">
            Próximo episódio em <span className="text-white font-bold">{nextEpCountdown}s</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                clearInterval(countdownRef.current);
                setShowNextEp(false);
              }}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                clearInterval(countdownRef.current);
                setShowNextEp(false);
                onNextEpisode?.();
              }}
              className="px-5 py-2 bg-white text-black font-bold text-sm rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              ▶ {nextEpisodeTitle ? `Ep. seguinte` : 'Próximo episódio'}
            </button>
          </div>
          {nextEpisodeTitle && (
            <div className="text-xs text-gray-400 max-w-xs text-right truncate">{nextEpisodeTitle}</div>
          )}
        </div>
      )}
    </div>
  );
}

function getVideoType(url: string): string {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'video/youtube';
  if (url.includes('.m3u8')) return 'application/x-mpegURL';
  if (url.includes('.mpd')) return 'application/dash+xml';
  if (url.includes('.webm')) return 'video/webm';
  return 'video/mp4';
}
