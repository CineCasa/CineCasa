import React from 'react';

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
}

export default function YouTubePlayer({ url, title, onClose }: YouTubePlayerProps) {
  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div className="w-full max-w-4xl aspect-video">
        <iframe
          src={url}
          title={title}
          className="w-full h-full"
          allowFullScreen
        />
      </div>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded"
      >
        Fechar
      </button>
    </div>
  );
}
