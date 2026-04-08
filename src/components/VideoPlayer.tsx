import React, { useEffect, useRef, useState } from 'react';
import RemoteControl from './RemoteControl';
import VideoControls from './VideoControls';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, poster, title }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [player, setPlayer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !src) return;

    // Função para forçar orientação landscape em dispositivos móveis
    const forceLandscape = async () => {
      try {
        if (screen.orientation && screen.orientation.lock) {
          await screen.orientation.lock('landscape');
          console.log('📱 Orientação travada em landscape');
        }
      } catch (error) {
        console.warn('Não foi possível travar orientação:', error);
      }
    };

    // Verificar se é dispositivo móvel
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      forceLandscape();
    }

    // Carregar Clappr e plugins dinamicamente via CDN
    const loadClappr = async () => {
      try {
        // Carregar script do Clappr
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/clappr@0.3.11/dist/clappr.min.js';
        script.async = true;
        
        script.onload = () => {
          // @ts-ignore - Clappr será carregado globalmente
          if ((window as any).Clappr) {
            try {
              const Clappr = (window as any).Clappr;
              
              // Carregar plugins adicionais
              const loadPlugins = async () => {
                // Plugin Level Selector
                const levelSelectorScript = document.createElement('script');
                levelSelectorScript.src = 'https://cdn.jsdelivr.net/npm/@clappr/clappr-level-selector-plugin@0.4.0/dist/level-selector.min.js';
                levelSelectorScript.async = true;
                
                levelSelectorScript.onload = () => {
                  // Plugin Click to Play (para autoplay em navegadores)
                  const clickToPlayScript = document.createElement('script');
                  clickToPlayScript.src = 'https://cdn.jsdelivr.net/npm/@clappr/clappr-click-to-play-plugin@0.4.0/dist/click-to-play.min.js';
                  clickToPlayScript.async = true;
                  
                  clickToPlayScript.onload = () => {
                    // Plugin Watermark
                    const watermarkScript = document.createElement('script');
                    watermarkScript.src = 'https://cdn.jsdelivr.net/npm/@clappr/clappr-watermark-plugin@0.2.0/dist/watermark.min.js';
                    watermarkScript.async = true;
                    
                    watermarkScript.onload = () => {
                      // Plugin Statistics
                      const statsScript = document.createElement('script');
                      statsScript.src = 'https://cdn.jsdelivr.net/npm/@clappr/clappr-stats-plugin@0.2.0/dist/stats.min.js';
                      statsScript.async = true;
                      
                      statsScript.onload = () => {
                        initializePlayer();
                      };
                      
                      document.head.appendChild(statsScript);
                    };
                    
                    document.head.appendChild(watermarkScript);
                  };
                  
                  document.head.appendChild(clickToPlayScript);
                };
                
                document.head.appendChild(levelSelectorScript);
              };
              
              loadPlugins();
              
              const initializePlayer = () => {
                try {
                  const playerInstance = new Clappr({
                    source: src,
                    parentId: '#player-container',
                    poster: poster,
                    width: '100%',
                    height: '100%',
                    autoPlay: false, // Mudado para false para compatibilidade
                    preload: 'metadata',
                    mute: false, // Permitir som
                    loop: false,
                    playbackNotSupportedMessage: 'Seu navegador não suporta este formato de vídeo',
                    plugins: {
                      // Plugins essenciais configurados
                      'core': [
                        (window as any).Clappr.MediaControl,
                        (window as any).Clappr.ClickToPlayPlugin,
                        (window as any).Clappr.LevelSelectorPlugin,
                        (window as any).Clappr.WatermarkPlugin,
                        (window as any).Clappr.StatsPlugin
                      ],
                    },
                    mediacontrol: {
                      seekbar: '#00A8E1',
                      buttons: '#ffffff',
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    },
                    watermark: 'CineCasa',
                    watermarkPosition: 'top-right',
                    levelSelectorConfig: {
                      title: 'Qualidade',
                      label: 'Qualidade',
                    },
                    events: {
                      onReady: () => console.log('Player ready'),
                      onPlay: () => console.log('Playing'),
                      onPause: () => console.log('Paused'),
                      onStop: () => console.log('Stopped'),
                      onEnded: () => console.log('Ended'),
                      onError: (e: any) => console.error('Player error:', e),
                    }
                  });

                  setPlayer(playerInstance);
                  setIsLoading(false);

                  // Event listeners adicionais
                  playerInstance.on(Clappr.Events.PLAYER_READY, () => {
                    console.log('Player ready');
                    setIsLoading(false);
                  });
                  
                  playerInstance.on(Clappr.Events.PLAYER_PLAY, () => {
                    console.log('Playing');
                    setIsPlaying(true);
                  });
                  
                  playerInstance.on(Clappr.Events.PLAYER_PAUSE, () => {
                    console.log('Paused');
                    setIsPlaying(false);
                  });
                  
                  playerInstance.on(Clappr.Events.PLAYER_TIMEUPDATE, () => {
                    const current = playerInstance.getCurrentTime();
                    const total = playerInstance.getDuration();
                    setCurrentTime(current);
                    setDuration(total);
                  });
                  
                  playerInstance.on(Clappr.Events.PLAYER_VOLUMECHANGE, () => {
                    const currentVolume = playerInstance.getVolume();
                    setVolume(currentVolume);
                  });

                  // Tentar autoplay após ready
                  try {
                    playerInstance.play();
                  } catch (e) {
                    console.log('Autoplay blocked, user interaction required');
                  }

                  playerInstance.on(Clappr.Events.PLAY, () => {
                    console.log('Playing');
                  });

                  playerInstance.on(Clappr.Events.PAUSE, () => {
                    console.log('Paused');
                  });

                  playerInstance.on(Clappr.Events.STOP, () => {
                    console.log('Stopped');
                  });

                  playerInstance.on(Clappr.Events.ENDED, () => {
                    console.log('Ended');
                  });

                  playerInstance.on(Clappr.Events.ERROR, (e: any) => {
                    console.error('Player error:', e);
                    setIsLoading(false);
                  });

                } catch (error) {
                  console.error('Error initializing Clappr:', error);
                  setIsLoading(false);
                }
              };

            } catch (error) {
              console.error('Error initializing Clappr:', error);
              setIsLoading(false);
            }
          }
        };

        document.head.appendChild(script);
      } catch (error) {
        console.error('Error loading Clappr script:', error);
        setIsLoading(false);
      }
    };

    loadClappr();

    return () => {
      if (player) {
        try {
          player.destroy();
        } catch (error) {
          console.error('Error destroying player:', error);
        }
      }
      
      // Restaurar orientação ao sair
      try {
        if (screen.orientation && screen.orientation.unlock) {
          screen.orientation.unlock();
          console.log('📱 Orientação restaurada');
        }
      } catch (error) {
        console.warn('Não foi possível restaurar orientação:', error);
      }
    };
  }, [src]);

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      <div 
        ref={containerRef}
        id="player-container"
        className="w-full h-full"
      />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-white text-center">
            <div className="w-12 h-12 border-4 border-[#00A8E1] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm">Carregando vídeo...</p>
            {title && <p className="text-xs text-gray-400 mt-2">{title}</p>}
          </div>
        </div>
      )}
      
      {/* Controles do Vídeo */}
      <VideoControls
        player={player}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isPlaying={isPlaying}
        onPlay={() => player?.play()}
        onPause={() => player?.pause()}
        onSeek={(time) => player?.seek(time)}
        onVolumeChange={(vol) => player?.setVolume(vol)}
        onFullscreen={() => {
          const elem = containerRef.current;
          if (elem?.requestFullscreen) {
            elem.requestFullscreen();
          } else if ((elem as any)?.webkitRequestFullscreen) {
            (elem as any).webkitRequestFullscreen();
          } else if ((elem as any)?.mozRequestFullScreen) {
            (elem as any).mozRequestFullScreen();
          }
        }}
        onRewind={() => player?.seek(Math.max(0, currentTime - 10))}
        onForward={() => player?.seek(Math.min(duration, currentTime + 10))}
      />
      
      {/* Controle Remoto */}
      <RemoteControl
        playerRef={player}
        onPlay={() => player?.play()}
        onPause={() => player?.pause()}
        onSeek={(time) => player?.seek(time)}
        onVolumeChange={(vol) => player?.setVolume(vol)}
        onFullscreen={() => {
          const elem = containerRef.current;
          if (elem?.requestFullscreen) {
            elem.requestFullscreen();
          } else if ((elem as any)?.webkitRequestFullscreen) {
            (elem as any).webkitRequestFullscreen();
          } else if ((elem as any)?.mozRequestFullScreen) {
            (elem as any).mozRequestFullScreen();
          }
        }}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isPlaying={isPlaying}
      />
    </div>
  );
};

export default VideoPlayer;
