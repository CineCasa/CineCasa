import React, { useEffect, useRef, useState } from 'react';
import { Player } from '@clappr/core';
import './ClapprPlayer.css';

interface ClapprPlayerProps {
  source: string;
  title: string;
  poster?: string;
  subtitles?: Array<{
    lang: string;
    src: string;
    label: string;
  }>;
  audioTracks?: Array<{
    lang: string;
    label: string;
  }>;
  onClose?: () => void;
  autoPlay?: boolean;
  muted?: boolean;
  controls?: boolean;
  fullscreenEnabled?: boolean;
  width?: string | number;
  height?: string | number;
}

const ClapprPlayer: React.FC<ClapprPlayerProps> = ({
  source,
  title,
  poster,
  subtitles = [],
  audioTracks = [],
  onClose,
  autoPlay = false,
  muted = false,
  controls = true,
  fullscreenEnabled = true,
  width = '100%',
  height = '100%',
}) => {
  const playerRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(muted);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!playerRef.current) return;

    // Criar instância do player
    const player = new Player({
      source,
      parentId: `#${playerRef.current.id}`,
      width: '100%' as unknown as number,
      height: '100%' as unknown as number,
      autoPlay,
    } as any);

    playerInstanceRef.current = player;

    player.on('playing', () => setIsPlaying(true));
    player.on('pause', () => setIsPlaying(false));
    player.on('timeupdate', (e: any) => {
      setCurrentTime(e.current || 0);
    });
    player.on('loadedmetadata', (e: any) => {
      setDuration(e.target?.duration || 0);
    });
    player.on('volumechange', (e: any) => {
      setVolume((e.volume || 0) * 100);
      setIsMuted(e.muted || false);
    });
    player.on('fullscreen', () => setIsFullscreen(true));
    player.on('exitfullscreen', () => setIsFullscreen(false));
    player.on('error', (e: any) => {
      console.error('Playback error:', e);
    });

    // Cleanup
    return () => {
      player.destroy();
    };
  }, [source, autoPlay, muted, poster, controls]);

  // Controlar visibilidade dos controles em fullscreen
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      if (isFullscreen && isPlaying) {
        controlsTimeoutRef.current = setTimeout(() => {
          setShowControls(false);
        }, 3000);
      }
    };

    if (isFullscreen) {
      window.addEventListener('mousemove', handleMouseMove);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      };
    }
  }, [isFullscreen, isPlaying]);

  // Controles customizados
  const togglePlayPause = () => {
    if (playerInstanceRef.current) {
      if (isPlaying) {
        playerInstanceRef.current.pause();
      } else {
        playerInstanceRef.current.play();
      }
    }
  };

  const toggleMute = () => {
    if (playerInstanceRef.current) {
      playerInstanceRef.current.muted = !isMuted;
    }
  };

  const toggleFullscreen = () => {
    if (playerInstanceRef.current && fullscreenEnabled) {
      if (isFullscreen) {
        playerInstanceRef.current.exitFullscreen();
      } else {
        playerInstanceRef.current.enterFullscreen();
      }
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (playerInstanceRef.current) {
      playerInstanceRef.current.volume = vol / 100;
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (playerInstanceRef.current) {
      playerInstanceRef.current.seek(time);
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (playerInstanceRef.current) {
      playerInstanceRef.current.setPlaybackRate(rate);
    }
  };

  const skipForward = () => {
    const newTime = Math.min(currentTime + 10, duration);
    setCurrentTime(newTime);
    if (playerInstanceRef.current) {
      playerInstanceRef.current.seek(newTime);
    }
  };

  const skipBackward = () => {
    const newTime = Math.max(currentTime - 10, 0);
    setCurrentTime(newTime);
    if (playerInstanceRef.current) {
      playerInstanceRef.current.seek(newTime);
    }
  };

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

  return (
    <div className="clappr-player-container" style={{ width, height }}>
      {/* Player Principal */}
      <div
        id={`clappr-player-${Math.random()}`}
        ref={playerRef}
        className={`clappr-player ${isFullscreen ? 'clappr-fullscreen' : ''}`}
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#000',
          position: 'relative',
        }}
      />

      {/* Controles Customizados */}
      {controls && (
        <div className={`clappr-controls ${showControls ? 'visible' : 'hidden'}`}>
          {/* Título */}
          <div className="clappr-title">
            <h3>{title}</h3>
            {onClose && (
              <button
                className="clappr-close-btn"
                onClick={onClose}
                aria-label="Fechar"
                title="Fechar"
              >
                ✕
              </button>
            )}
          </div>

          {/* Barra de Progresso */}
          <div className="clappr-progress-container">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleProgressChange}
              className="clappr-progress-bar"
              aria-label="Progresso"
            />
            <div className="clappr-time-display">
              <span>{formatTime(currentTime)}</span>
              <span> / </span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controles Inferiores */}
          <div className="clappr-bottom-controls">
            {/* Controles de Reprodução */}
            <div className="clappr-playback-controls">
              {/* Botão Voltar */}
              <button
                className="clappr-control-btn"
                onClick={skipBackward}
                title="Voltar 10s"
                aria-label="Voltar 10 segundos"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M3 7v6h6M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <text x="12" y="10" textAnchor="middle" fontSize="10">10</text>
                </svg>
              </button>

              {/* Botão Play/Pause */}
              <button
                className="clappr-control-btn clappr-play-btn"
                onClick={togglePlayPause}
                title={isPlaying ? 'Pausar' : 'Reproduzir'}
                aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
              >
                {isPlaying ? (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                ) : (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21" />
                  </svg>
                )}
              </button>

              {/* Botão Avançar */}
              <button
                className="clappr-control-btn"
                onClick={skipForward}
                title="Avançar 10s"
                aria-label="Avançar 10 segundos"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M21 7v6h-6M3 17a9 9 0 009-9 9 9 0 016-2.3l3 2.3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <text x="12" y="10" textAnchor="middle" fontSize="10">10</text>
                </svg>
              </button>
            </div>

            {/* Controles de Volume e Ajustes */}
            <div className="clappr-secondary-controls">
              {/* Volume */}
              <div className="clappr-volume-control">
                <button
                  className="clappr-control-btn"
                  onClick={toggleMute}
                  title={isMuted ? 'Ativar som' : 'Mudo'}
                  aria-label={isMuted ? 'Ativar som' : 'Mudo'}
                >
                  {isMuted || volume === 0 ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="3 9 7 9 12 4 12 20 7 15 3 15" />
                      <line x1="23" y1="9" x2="17" y2="15" stroke="currentColor" strokeWidth="2" />
                      <line x1="17" y1="9" x2="23" y2="15" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="3 9 7 9 12 4 12 20 7 15 3 15" />
                      <path d="M15 12a3 3 0 0 1 0 6M19 7a7 7 0 0 1 0 10" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="clappr-volume-slider"
                  aria-label="Volume"
                />
              </div>

              {/* Velocidade de Reprodução */}
              <div className="clappr-menu-control">
                <button className="clappr-control-btn" title="Velocidade">
                  {playbackRate}x
                </button>
                <div className="clappr-menu-dropdown">
                  <button onClick={() => handlePlaybackRateChange(0.5)}>0.5x</button>
                  <button onClick={() => handlePlaybackRateChange(0.75)}>0.75x</button>
                  <button
                    onClick={() => handlePlaybackRateChange(1)}
                    className={playbackRate === 1 ? 'active' : ''}
                  >
                    Normal
                  </button>
                  <button onClick={() => handlePlaybackRateChange(1.25)}>1.25x</button>
                  <button onClick={() => handlePlaybackRateChange(1.5)}>1.5x</button>
                  <button onClick={() => handlePlaybackRateChange(2)}>2x</button>
                </div>
              </div>

              {/* Legendas */}
              {subtitles.length > 0 && (
                <button
                  className="clappr-control-btn"
                  onClick={() => setShowSubtitles(!showSubtitles)}
                  title={showSubtitles ? 'Ocultar legendas' : 'Mostrar legendas'}
                  aria-label={showSubtitles ? 'Ocultar legendas' : 'Mostrar legendas'}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2 3h20v2H2V3zm0 8h20v2H2v-2zm0 8h20v2H2v-2z" />
                  </svg>
                </button>
              )}

              {/* Tela Cheia */}
              {fullscreenEnabled && (
                <button
                  className="clappr-control-btn"
                  onClick={toggleFullscreen}
                  title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
                  aria-label={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
                >
                  {isFullscreen ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClapprPlayer;
