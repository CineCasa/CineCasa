import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface SplashScreenProps {
  onComplete?: () => void;
  minDuration?: number;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ 
  onComplete, 
  minDuration = 2500 
}) => {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const duration = minDuration;
    
    // Simular progresso de 0 a 100
    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(Math.floor(newProgress));
      
      if (newProgress >= 100) {
        setIsComplete(true);
        setTimeout(() => {
          onComplete?.();
        }, 500);
      } else {
        requestAnimationFrame(updateProgress);
      }
    };

    requestAnimationFrame(updateProgress);
  }, [minDuration, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: isComplete ? 0 : 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center"
    >
      {/* Logo Container */}
      <div className="flex flex-col items-center justify-center px-4">
        {/* Logo com tamanho responsivo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-8"
        >
          <img
            src="/logo.png"
            alt="CineCasa"
            className="w-[280px] h-auto sm:w-[350px] md:w-[450px] lg:w-[600px] max-w-[90vw] object-contain"
          />
        </motion.div>

        {/* Container da barra de progresso */}
        <div className="w-full max-w-[280px] sm:max-w-[350px] md:max-w-[450px] lg:max-w-[600px]">
          {/* Barra de progresso */}
          <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#00d9ff] to-[#00b8d9] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1, ease: "linear" }}
            />
            {/* Brilho animado na barra */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" 
                 style={{ 
                   backgroundSize: '200% 100%',
                   animation: 'shimmer 1.5s infinite'
                 }} 
            />
          </div>

          {/* Texto de progresso */}
          <div className="flex items-center justify-between mt-3">
            <span className="text-gray-400 text-sm md:text-base font-medium">
              Carregando
            </span>
            <span className="text-[#00d9ff] text-sm md:text-base font-bold">
              {progress}%
            </span>
          </div>

          {/* Pontinhos animados */}
          <div className="flex justify-center mt-4 gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-[#00d9ff] rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* CSS para animação shimmer */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </motion.div>
  );
};

export default SplashScreen;
