import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const NetflixLoader = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 5000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
      className="fixed inset-0 z-[999999] bg-black flex items-center justify-center overflow-hidden"
    >
      <div className="relative flex flex-col items-center">
        {/* Logo Animation */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ 
            scale: [0.8, 1.1, 1],
            opacity: 1,
          }}
          transition={{ 
            duration: 1.5, 
            ease: "easeOut",
          }}
          className="flex flex-col items-center"
        >
          <span className="text-6xl md:text-8xl font-black tracking-tighter text-[#00A8E1] drop-shadow-[0_0_20px_rgba(0,168,225,0.5)]">
            CINECASA
          </span>
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 1 }}
            className="text-sm md:text-base font-bold text-white/50 tracking-[0.3em] uppercase mt-2"
          >
            Entretenimento e lazer
          </motion.span>
        </motion.div>

        {/* Netflix-style N zoom effect simulation (using C) */}
        <motion.div
          initial={{ scale: 1, opacity: 0 }}
          animate={{ 
            scale: [1, 20],
            opacity: [0, 1, 0],
          }}
          transition={{ 
            delay: 3, 
            duration: 2,
            ease: "easeInOut"
          }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
           <div className="w-20 h-40 bg-[#00A8E1] blur-3xl opacity-20" />
        </motion.div>
      </div>

      {/* Background Pulse */}
      <motion.div 
        animate={{ 
          opacity: [0.1, 0.3, 0.1] 
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className="absolute inset-0 bg-gradient-to-t from-[#00A8E1]/10 to-transparent pointer-events-none"
      />
    </motion.div>
  );
};

export default NetflixLoader;
