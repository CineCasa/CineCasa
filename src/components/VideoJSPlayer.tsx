import React, { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { supabase } from '@/integrations/supabase/client';
import { useAchievements } from "@/hooks/useAchievementsSimple";

export const VideoJSPlayer = ({ options, contentId, contentType }) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const { unlockAchievement } = useAchievements();

  useEffect(() => {
    // Quando o vídeo começa, tenta desbloquear a medalha de "Primeira Pipoca"
    unlockAchievement('first_movie');
  }, []);

  useEffect(() => {
    if (!playerRef.current) {
      const videoElement = videoRef.current;
      if (!videoElement) return;

      const player = playerRef.current = videojs(videoElement, options, () => {
        console.log('Player v4 pronto');
      });

      // Lógica de Salvar Progresso v4 (a cada 10 segundos)
      player.on('timeupdate', () => {
        const currentTime = Math.floor(player.currentTime());
        const duration = Math.floor(player.duration());
        
        if (currentTime % 10 === 0) { // Throttle para não sobrecarregar o banco
          saveProgress(currentTime, duration);
        }
      });
    }
  }, [options, videoRef]);

  const saveProgress = async (time, duration) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('user_progress').upsert({
      user_id: user.id,
      content_id: contentId,
      content_type: contentType,
      watched_time: time,
      duration: duration,
      last_watched: new Date().toISOString()
    });
  };

  return (
    <div data-vjs-player>
      <video ref={videoRef} className="video-js vjs-big-play-centered" />
    </div>
  );
};
