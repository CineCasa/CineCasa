import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Volume2, Maximize2, Settings, Share2, Download } from 'lucide-react';

interface StreamingModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  image: string;
  videoUrl?: string;
  rating?: number;
  year?: number;
  duration?: string;
  quality?: string;
  onPlay?: () => void;
  onAddToList?: () => void;
}

const StreamingModal: React.FC<StreamingModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  image,
  videoUrl,
  rating,
  year,
  duration,
  quality,
  onPlay,
  onAddToList
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(true);

  if (!isOpen) return null;

  const handlePlay = () => {
    setIsPlaying(!isPlaying);
    onPlay?.();
  };

  const handleProgress = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProgress(Number(e.target.value));
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  return (
    <motion.div
      className="streaming-modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClose}
    >
      <motion.div
        className="streaming-modal-content w-full max-w-6xl"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ duration: 0.3 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">{title}</h2>
          <motion.button
            onClick={onClose}
            className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="w-5 h-5 text-white" />
          </motion.button>
        </div>

        <div className="grid md:grid-cols-2 gap-6 p-6">
          {/* Video Player */}
          <div className="relative aspect-video streaming-card rounded-lg overflow-hidden">
            {videoUrl ? (
              <video
                className="w-full h-full object-cover"
                src={videoUrl}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                controls={false}
              />
            ) : (
              <img
                src={image}
                alt={title}
                className="w-full h-full object-cover"
              />
            )}

            {/* Video Controls Overlay */}
            <div 
              className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 transition-opacity duration-300 ${
                showControls ? 'opacity-100' : 'opacity-0'
              }`}
              onMouseEnter={() => setShowControls(true)}
              onMouseLeave={() => setShowControls(false)}
            >
              {/* Play Button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.button
                  onClick={handlePlay}
                  className="w-16 h-16 rounded-full bg-netflix-red/90 hover:bg-netflix-red flex items-center justify-center transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {isPlaying ? (
                    <ChevronLeft className="w-8 h-8 text-white ml-1" />
                  ) : (
                    <ChevronRight className="w-8 h-8 text-white ml-1" />
                  )}
                </motion.button>
              </div>

              {/* Bottom Controls */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                {/* Progress Bar */}
                <div className="mb-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={handleProgress}
                    className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <motion.button
                      className="text-white hover:text-netflix-red transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </motion.button>
                    
                    <motion.button
                      onClick={handlePlay}
                      className="text-white hover:text-netflix-red transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {isPlaying ? (
                        <ChevronLeft className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </motion.button>

                    <motion.button
                      className="text-white hover:text-netflix-red transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </motion.button>

                    {/* Volume Control */}
                    <div className="flex items-center gap-2">
                      <motion.button
                        onClick={() => setIsMuted(!isMuted)}
                        className="text-white hover:text-netflix-red transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Volume2 className="w-5 h-5" />
                      </motion.button>
                      
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={isMuted ? 0 : volume}
                        onChange={handleVolume}
                        className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <motion.button
                      className="text-white hover:text-netflix-red transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Settings className="w-5 h-5" />
                    </motion.button>
                    
                    <motion.button
                      className="text-white hover:text-netflix-red transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Share2 className="w-5 h-5" />
                    </motion.button>
                    
                    <motion.button
                      className="text-white hover:text-netflix-red transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Download className="w-5 h-5" />
                    </motion.button>
                    
                    <motion.button
                      className="text-white hover:text-netflix-red transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Maximize2 className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Info */}
          <div className="space-y-6">
            {/* Metadata */}
            <div className="flex items-center gap-4 text-sm text-gray-300">
              <span className="text-green-400 font-semibold">{rating}% Match</span>
              <span>{year}</span>
              <span>{duration}</span>
              {quality && (
                <span className="px-2 py-1 border border-gray-600 rounded text-xs">
                  {quality}
                </span>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Sinopse</h3>
              <p className="text-gray-300 leading-relaxed">{description}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <motion.button
                onClick={handlePlay}
                className="streaming-button flex-1 min-w-[120px]"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Assistir Agora
              </motion.button>
              
              <motion.button
                onClick={onAddToList}
                className="streaming-button-secondary flex-1 min-w-[120px]"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Adicionar à Lista
              </motion.button>
            </div>

            {/* Additional Info */}
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-400 mb-2">Gêneros</h4>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm">
                    Ação
                  </span>
                  <span className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm">
                    Aventura
                  </span>
                  <span className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm">
                    Ficção
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-400 mb-2">Elenco</h4>
                <p className="text-gray-300 text-sm">Ator Principal, Atriz Principal, Ator Coadjuvante</p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-400 mb-2">Direção</h4>
                <p className="text-gray-300 text-sm">Nome do Diretor</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default StreamingModal;
