import React, { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

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

    const player = videojs(videoElement, {
      html5: {
        vhs: {
          overrideNative: true,
          limitRenditionByPlayerDimensions: true,
          useDevicePixelRatio: true
        }
      },
      controls: true,
      fluid: true,
      responsive: true,
      preload: 'auto',
      poster: poster,
      sources: [{
        src: url,
        type: getVideoType(url)
      }]
    }, () => {
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
  if (url.includes('.m3u8')) return 'application/x-mpegURL';
  if (url.includes('.mpd')) return 'application/dash+xml';
  if (url.includes('.mp4')) return 'video/mp4';
  if (url.includes('.webm')) return 'video/webm';
  return 'video/mp4';
}
