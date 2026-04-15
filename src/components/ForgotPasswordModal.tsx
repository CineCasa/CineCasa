import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useForgotPassword } from '@/hooks/useForgotPassword';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ 
  isOpen, 
  onClose 
}) => {
  const {
    email,
    setEmail,
    isLoading,
    message,
    error,
    isSuccess,
    sendResetEmail,
    resetState
  } = useForgotPassword();

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendResetEmail();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div 
              className="w-full max-w-md bg-gray-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative px-6 py-5 border-b border-white/10 bg-gradient-to-r from-[#00A8E1]/10 to-transparent">
                <button
                  onClick={handleClose}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleClose}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors -ml-2"
                  >
                    <ArrowLeft size={18} className="text-gray-400" />
                  </button>
                  <h2 className="text-xl font-bold text-white">
                    Recuperar Senha
                  </h2>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {isSuccess ? (
                  // Sucesso - Email enviado
                  <div className="text-center py-8">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                      className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
                    >
                      <CheckCircle size={40} className="text-green-500" />
                    </motion.div>
                    
                    <h3 className="text-xl font-semibold text-white mb-3">
                      Email Enviado!
                    </h3>
                    
                    <p className="text-gray-400 text-sm leading-relaxed mb-6">
                      {message}
                    </p>
                    
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
                      <p className="text-blue-400 text-sm">
                        <strong>Dica:</strong> Verifique também a pasta de spam/lixo eletrônico se não encontrar o email na caixa de entrada.
                      </p>
                    </div>
                    
                    <button
                      onClick={handleClose}
                      className="w-full bg-[#00A8E1] hover:bg-[#00A8E1]/80 text-white font-semibold py-3 px-6 rounded-lg transition-all"
                    >
                      Entendi
                    </button>
                  </div>
                ) : (
                  // Formulário
                  <>
                    <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                      Digite seu email cadastrado e enviaremos um link para você redefinir sua senha.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Email Input */}
                      <div className="relative">
                        <Mail 
                          size={20} 
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" 
                        />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="seu@email.com"
                          required
                          disabled={isLoading}
                          className="w-full bg-gray-800 text-white pl-12 pr-4 py-3.5 rounded-lg outline-none focus:ring-2 focus:ring-[#00A8E1]/50 transition-all placeholder:text-gray-600 disabled:opacity-50"
                        />
                      </div>

                      {/* Error Message */}
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3"
                        >
                          <AlertCircle size={16} />
                          <span>{error}</span>
                        </motion.div>
                      )}

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={isLoading || !email}
                        className="w-full bg-[#00A8E1] hover:bg-[#00A8E1]/80 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3.5 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 size={20} className="animate-spin" />
                            <span>Enviando...</span>
                          </>
                        ) : (
                          <span>Enviar Link de Recuperação</span>
                        )}
                      </button>
                    </form>

                    {/* Info */}
                    <div className="mt-6 pt-6 border-t border-white/10">
                      <p className="text-gray-500 text-xs text-center leading-relaxed">
                        O link de recuperação expira em 24 horas por segurança.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ForgotPasswordModal;
