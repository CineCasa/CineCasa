import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingScreenProps {
  isLoading?: boolean;
  onComplete?: () => void;
  duration?: number;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  isLoading = true, 
  onComplete,
  duration = 5 
}) => {
  const [progress, setProgress] = useState(0);
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    if (!isLoading) return;

    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const newProgress = Math.min((elapsed / (duration * 1000)) * 100, 100);
      
      setProgress(newProgress);

      if (newProgress < 100) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setShowCompleted(true);
        setTimeout(() => {
          onComplete?.();
        }, 500);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [isLoading, duration, onComplete]);

  if (!isLoading) return null;

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0d15]"
    >
      {/* Container principal com responsividade */}
      <div className="flex flex-col items-center justify-center w-full h-full px-4 sm:px-6 lg:px-8">
        
        {/* Logo responsivo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            duration: 0.8, 
            ease: [0.4, 0, 0.2, 1],
            repeat: Infinity,
            repeatType: "reverse",
            repeatDelay: 0.5
          }}
          className="relative"
        >
          {/* Logo com tamanho responsivo - 500px em telas grandes */}
          <img
            src="/logo.png"
            alt="CineCasa"
            className="w-[150px] h-[150px] sm:w-[250px] sm:h-[250px] md:w-[350px] md:h-[350px] lg:w-[500px] lg:h-[500px] xl:w-[500px] xl:h-[500px] 2xl:w-[500px] 2xl:h-[500px] object-contain drop-shadow-2xl"
            style={{ 
              maxWidth: '500px', 
              maxHeight: '500px',
              width: '100%',
              height: 'auto'
            }}
          />
          
          {/* Glow effect ao redor do logo */}
          <div className="absolute inset-0 rounded-full bg-accent/10 blur-3xl -z-10 animate-pulse" />
        </motion.div>

        {/* Barra de progresso - 5 segundos de 0 a 100% */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-8 sm:mt-12 md:mt-16 lg:mt-20 w-full max-w-[200px] sm:max-w-[300px] md:max-w-[400px] lg:max-w-[500px]"
        >
          {/* Container da barra com glow */}
          <div className="w-full h-1 sm:h-1.5 md:h-2 lg:h-2 bg-white/10 rounded-full overflow-hidden relative">
            {/* Glow effect na barra */}
            <motion.div
              className="absolute inset-0 rounded-full bg-accent/30 blur-md"
              animate={{
                opacity: progress > 0 ? [0.3, 0.6, 0.3] : 0,
              }}
              transition={{
                duration: 1,
                ease: "easeInOut",
                repeat: Infinity,
              }}
            />
            
            {/* Barra animada - progresso real */}
            <motion.div
              className="h-full bg-gradient-to-r from-accent via-cyan-400 to-accent rounded-full relative overflow-hidden"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            >
              {/* Efeito shimmer/movimento */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                animate={{
                  x: ["-100%", "200%"],
                }}
                transition={{
                  duration: 1.5,
                  ease: "easeInOut",
                  repeat: Infinity,
                }}
              />
              
              {/* Partículas de brilho */}
              <motion.div
                className="absolute right-0 top-1/2 -translate-y-1/2 w-2 sm:w-3 md:w-4 h-2 sm:h-3 md:h-4 bg-white rounded-full blur-sm"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.6, 1, 0.6],
                }}
                transition={{
                  duration: 0.8,
                  ease: "easeInOut",
                  repeat: Infinity,
                }}
              />
              
              {/* Trail de partículas */}
              <motion.div
                className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-1 h-1 bg-accent rounded-full"
                animate={{
                  x: [0, -10, 0],
                  opacity: [1, 0, 1],
                  scale: [1, 0.5, 1],
                }}
                transition={{
                  duration: 1,
                  ease: "easeOut",
                  repeat: Infinity,
                }}
              />
            </motion.div>
          </div>
          
          {/* Texto de carregamento com porcentagem e ícone animado */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex items-center justify-center gap-2 mt-3 sm:mt-4 md:mt-5"
          >
            {!showCompleted && (
              <motion.div
                className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-accent/30 border-t-accent rounded-full"
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1,
                  ease: "linear",
                  repeat: Infinity,
                }}
              />
            )}
            <p className="text-center text-secondary font-body text-xs sm:text-sm md:text-base lg:text-lg">
              {showCompleted ? 'Pronto!' : `Carregando... ${Math.round(progress)}%`}
            </p>
          </motion.div>
        </motion.div>

        {/* Indicadores de pontos - só aparecem durante carregamento */}
        <AnimatePresence>
          {!showCompleted && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="mt-6 sm:mt-8 md:mt-10 flex space-x-2"
            >
              {[0, 1, 2].map((index) => (
                <motion.div
                  key={index}
                  className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-full bg-accent"
                  initial={{ scale: 0.5, opacity: 0.3 }}
                  animate={{ 
                    scale: [0.5, 1, 0.5], 
                    opacity: [0.3, 1, 0.3] 
                  }}
                  transition={{
                    duration: 1.5,
                    ease: "easeInOut",
                    repeat: Infinity,
                    delay: index * 0.2
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Background gradiente animado */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-purple/5"
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        />
      </div>
    </motion.div>
  );
};

export default LoadingScreen;
