import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { passwordResetService } from '@/services/passwordResetService';
import { toast } from 'sonner';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidSession, setIsValidSession] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  
  const navigate = useNavigate();

  // Verificar se há sessão de recuperação ativa
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await passwordResetService.handleRecoveryCallback();
        
        if (response.success) {
          setIsValidSession(true);
        } else {
          setError('Link de recuperação inválido ou expirado.');
          setIsValidSession(false);
        }
      } catch (err) {
        setError('Erro ao verificar sessão de recuperação.');
        setIsValidSession(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await passwordResetService.updatePassword(newPassword);
      
      if (response.success) {
        setIsSuccess(true);
        toast.success('Senha atualizada com sucesso!');
        
        // Redirecionar para login após 3 segundos
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError('Erro ao atualizar senha. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-[#00A8E1] mx-auto mb-4" />
          <p className="text-gray-400">Verificando link de recuperação...</p>
        </div>
      </div>
    );
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-gray-900 rounded-2xl border border-white/10 p-8 text-center"
        >
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={40} className="text-red-500" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-3">
            Link Inválido ou Expirado
          </h2>
          
          <p className="text-gray-400 mb-6">
            {error || 'O link de recuperação não é válido ou já expirou.'}
          </p>
          
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-[#00A8E1] hover:underline"
          >
            <ArrowLeft size={18} />
            Voltar para o login
          </Link>
        </motion.div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-gray-900 rounded-2xl border border-white/10 p-8 text-center"
        >
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-500" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-3">
            Senha Redefinida!
          </h2>
          
          <p className="text-gray-400 mb-6">
            Sua senha foi atualizada com sucesso. Você será redirecionado para o login em instantes.
          </p>
          
          <Link
            to="/login"
            className="inline-block bg-[#00A8E1] hover:bg-[#00A8E1]/80 text-white font-semibold py-3 px-8 rounded-lg transition-all"
          >
            Fazer Login
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-gray-900 rounded-2xl border border-white/10 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 bg-gradient-to-r from-[#00A8E1]/10 to-transparent">
          <Link 
            to="/login"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-sm">Voltar para o login</span>
          </Link>
          
          <h2 className="text-2xl font-bold text-white mt-4">
            Redefinir Senha
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Crie uma nova senha para sua conta
          </p>
        </div>

        {/* Form */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nova Senha */}
            <div className="relative">
              <Lock 
                size={20} 
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" 
              />
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nova senha"
                required
                minLength={6}
                disabled={isLoading}
                className="w-full bg-gray-800 text-white pl-12 pr-12 py-3.5 rounded-lg outline-none focus:ring-2 focus:ring-[#00A8E1]/50 transition-all placeholder:text-gray-600 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Confirmar Senha */}
            <div className="relative">
              <Lock 
                size={20} 
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" 
              />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme a nova senha"
                required
                minLength={6}
                disabled={isLoading}
                className="w-full bg-gray-800 text-white pl-12 pr-12 py-3.5 rounded-lg outline-none focus:ring-2 focus:ring-[#00A8E1]/50 transition-all placeholder:text-gray-600 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Requisitos da senha */}
            <div className="text-xs text-gray-500 space-y-1">
              <p className={newPassword.length >= 6 ? 'text-green-400' : ''}>
                {newPassword.length >= 6 ? '✓' : '•'} Pelo menos 6 caracteres
              </p>
              <p className={newPassword === confirmPassword && newPassword !== '' ? 'text-green-400' : ''}>
                {newPassword === confirmPassword && newPassword !== '' ? '✓' : '•'} Senhas coincidem
              </p>
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
              disabled={isLoading || newPassword.length < 6 || newPassword !== confirmPassword}
              className="w-full bg-[#00A8E1] hover:bg-[#00A8E1]/80 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3.5 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Atualizando...</span>
                </>
              ) : (
                <span>Atualizar Senha</span>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
