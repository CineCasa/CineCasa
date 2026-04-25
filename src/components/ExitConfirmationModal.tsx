import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, X } from 'lucide-react';

interface ExitConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ExitConfirmationModal({ isOpen, onConfirm, onCancel }: ExitConfirmationModalProps) {
  const noButtonRef = useRef<HTMLButtonElement>(null);
  const yesButtonRef = useRef<HTMLButtonElement>(null);

  // Focar no botão "Não" inicialmente (prevenção de saída acidental)
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        noButtonRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handler de teclas
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowRight':
          e.preventDefault();
          // Toggle entre botões
          if (document.activeElement === noButtonRef.current) {
            yesButtonRef.current?.focus();
          } else {
            noButtonRef.current?.focus();
          }
          break;
        case 'Enter':
          e.preventDefault();
          if (document.activeElement === noButtonRef.current) {
            onCancel();
          } else if (document.activeElement === yesButtonRef.current) {
            onConfirm();
          }
          break;
        case 'Escape':
        case 'Back':
        case 'Backspace':
          e.preventDefault();
          onCancel();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onConfirm, onCancel]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay escuro */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm"
            onClick={onCancel}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ 
              duration: 0.3,
              ease: [0.22, 1, 0.36, 1]
            }}
            className="fixed inset-0 z-[201] flex items-center justify-center p-4"
          >
            <div 
              className="relative max-w-md w-full rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(20,20,30,0.98) 100%)',
                border: '2px solid rgba(0, 229, 255, 0.5)',
                boxShadow: '0 0 40px rgba(0, 229, 255, 0.3), 0 0 80px rgba(0, 229, 255, 0.1), inset 0 0 20px rgba(0, 229, 255, 0.05)',
              }}
            >
              {/* Glow effect */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse at center top, rgba(0, 229, 255, 0.15) 0%, transparent 60%)',
                }}
              />

              {/* Header com ícone */}
              <div className="relative p-6 pb-4 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.2) 0%, rgba(0, 229, 255, 0.05) 100%)',
                    border: '2px solid rgba(0, 229, 255, 0.5)',
                    boxShadow: '0 0 20px rgba(0, 229, 255, 0.4)',
                  }}
                >
                  <LogOut className="w-8 h-8 text-[#00E5FF]" style={{ filter: 'drop-shadow(0 0 8px rgba(0, 229, 255, 0.8))' }} />
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-2"
                  style={{ textShadow: '0 0 20px rgba(0, 229, 255, 0.5)' }}
                >
                  Sair do CineCasa?
                </h2>
                
                <p className="text-gray-400 text-sm">
                  Deseja realmente sair do aplicativo?
                </p>
              </div>

              {/* Botões */}
              <div className="relative p-6 pt-2 flex gap-4">
                {/* Botão NÃO (foco inicial - prevenção de saída acidental) */}
                <button
                  ref={noButtonRef}
                  onClick={onCancel}
                  data-navigable="true"
                  className="flex-1 py-3 px-6 rounded-xl font-semibold text-white transition-all duration-200
                    outline-none
                    spatial-focus
                    focus:outline-[3px] focus:outline-[#00E5FF] focus:outline-offset-2
                    focus:shadow-[0_0_20px_rgba(0,229,255,0.6)]
                    hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.3) 0%, rgba(0, 229, 255, 0.1) 100%)',
                    border: '2px solid rgba(0, 229, 255, 0.6)',
                    boxShadow: '0 0 15px rgba(0, 229, 255, 0.3)',
                  }}
                  autoFocus
                >
                  <span className="flex items-center justify-center gap-2">
                    <X className="w-5 h-5" />
                    Não
                  </span>
                </button>

                {/* Botão SIM */}
                <button
                  ref={yesButtonRef}
                  onClick={onConfirm}
                  data-navigable="true"
                  className="flex-1 py-3 px-6 rounded-xl font-semibold text-white transition-all duration-200
                    outline-none
                    spatial-focus
                    focus:outline-[3px] focus:outline-[#00E5FF] focus:outline-offset-2
                    focus:shadow-[0_0_20px_rgba(0,229,255,0.6)]
                    hover:scale-105"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                  }}
                >
                  Sim
                </button>
              </div>

              {/* Footer com atalhos de teclado */}
              <div className="relative px-6 pb-4 text-center">
                <p className="text-xs text-gray-500">
                  Use as setas ← → para navegar • Enter para selecionar
                </p>
              </div>

              {/* Close button (opcional) */}
              <button
                onClick={onCancel}
                className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-white transition-colors"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default ExitConfirmationModal;
