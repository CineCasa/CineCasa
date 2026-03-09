import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Play, Pause, RotateCcw, Volume2, VolumeX, Maximize2, Settings, Subtitles, AudioLines, X, Info, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface NetflixPlayerProps {
  url: string;
  title: string;
  historyItem?: any;
  onClose: () => void;
}

const NetflixPlayer = ({ url, title, historyItem, onClose }: NetflixPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [volume, setVolume] = useState(1);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const controlsTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
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
  }, [historyItem]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setCurrentTime(current);
      const pct = (current / total) * 100;
      setProgress(pct);
      
      // Save progress to local storage (throttled naturally by timeUpdate rate)
      if (historyItem && total > 0 && Math.floor(current) % 5 === 0) {
         try {
           const historyStr = localStorage.getItem("paixaohist");
           let history = historyStr ? JSON.parse(historyStr) : [];
           const idx = history.findIndex((h: any) => h.id === historyItem.id);
           if (idx >= 0) {
             history[idx].progress = pct;
             history[idx].timestamp = Date.now();
           } else {
             history.unshift({ ...historyItem, timestamp: Date.now(), progress: pct });
           }
           localStorage.setItem("paixaohist", JSON.stringify(history.slice(0, 50)));
         } catch (e) {
           console.error("Failed to update progress:", e);
         }
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
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

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (videoRef.current) {
      const time = (val / 100) * duration;
      videoRef.current.currentTime = time;
      setProgress(val);
    }
  };

  const isYouTube = url.includes("youtube.com") || url.includes("youtu.be");

  const handleContainerInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
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
          src={`${url}?autoplay=1&controls=0&mute=${isMuted ? 1 : 0}&modestbranding=1&rel=0&iv_load_policy=3`}
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
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
          <ChevronLeft size={36} />
        </button>
        <h2 className="text-xl md:text-2xl font-bold text-white uppercase tracking-[0.2em]">{title}</h2>
        <button className="p-2 opacity-0 cursor-default">
           <X size={36} />
        </button>
      </div>

      <div className={`overlay-controls ${showControls ? 'show' : ''}`} onClick={handleContainerInteraction}>
        <button className="oc-btn" onClick={togglePlay}>
          {isPlaying ? <Pause size={32} /> : <Play size={32} />}
        </button>

        <div className="progress-bar-container">
          <div className="progress-bar" onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            if (videoRef.current) {
              videoRef.current.currentTime = pct * duration;
              setProgress(pct * 100);
            }
          }}>
            <div style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between items-center text-white/70">
            <span className="time-label">{formatTime(currentTime)} / {formatTime(duration)}</span>
            <div className="flex gap-4">
               <Volume2 size={24} className="cursor-pointer hover:text-white" onClick={() => setIsMuted(!isMuted)} />
               <Maximize2 size={24} className="cursor-pointer hover:text-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(playerContent, document.body);
};

export default NetflixPlayer;
