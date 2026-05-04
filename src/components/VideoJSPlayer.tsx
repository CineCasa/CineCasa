import React, { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
// Importar plugins adicionais para compatibilidade
import 'videojs-youtube';

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
}

export default function VideoJSPlayer({
  url,
  title,
  poster,
  onClose,
  resumeFrom = 0
}: VideoJSPlayerProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

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
      if (resumeFrom > 0) {
        player.currentTime(resumeFrom);
      }
      player.play().catch((err: any) => {
        console.log('[VideoJS] Autoplay prevented:', err);
      });
    });

    playerRef.current = player;

    // Handle fullscreen
    player.on('fullscreenchange', () => {
      console.log('[VideoJS] Fullscreen changed:', player.isFullscreen());
    });

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [url, poster, resumeFrom]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent">
        <h2 className="text-white text-lg font-semibold truncate max-w-md">{title}</h2>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-300 transition-colors px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20"
        >
          ✕ Fechar
        </button>
      </div>

      {/* Video Container */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-6xl aspect-video">
          <div ref={videoRef} className="w-full h-full" />
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
