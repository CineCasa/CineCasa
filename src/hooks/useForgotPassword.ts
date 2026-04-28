import { useState, useCallback } from 'react';
import { passwordResetService, PasswordResetResponse } from '@/services/passwordResetService';

interface UseForgotPasswordReturn {
  // Estados
  email: string;
  setEmail: (email: string) => void;
  isLoading: boolean;
  message: string | null;
  error: string | null;
  isSuccess: boolean;
  
  // Ações
  sendResetEmail: () => Promise<void>;
  updatePassword: (newPassword: string, confirmPassword: string) => Promise<boolean>;
  resetState: () => void;
}

export function useForgotPassword(): UseForgotPasswordReturn {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const resetState = useCallback(() => {
    setEmail('');
    setIsLoading(false);
    setMessage(null);
    setError(null);
    setIsSuccess(false);
  }, []);

  const sendResetEmail = useCallback(async (): Promise<void> => {
    // Validar email
    if (!email || !email.includes('@')) {
      setError('Por favor, digite um email válido.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response: PasswordResetResponse = await passwordResetService.sendResetEmail(email);
      
      if (response.success) {
        setIsSuccess(true);
        setMessage(response.message);
      } else {
        setError(response.message);
        setIsSuccess(false);
      }
    } catch (err: any) {
      setError('Erro ao enviar email. Tente novamente.');
      setIsSuccess(false);
    }
  }, [email]);

  const updatePassword = useCallback(async (
    newPassword: string, 
    confirmPassword: string
  ): Promise<boolean> => {
    // Validar senhas
    if (!newPassword || newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return false;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return false;
    }

    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response: PasswordResetResponse = await passwordResetService.updatePassword(newPassword);
      
      if (response.success) {
        setIsSuccess(true);
        setMessage(response.message);
        return true;
      } else {
        setError(response.message);
        setIsSuccess(false);
        return false;
      }
    } catch (err: any) {
      setError('Erro ao atualizar senha. Tente novamente.');
      setIsSuccess(false);
      return false;
    }
  }, []);

  return {
    email,
    setEmail,
    isLoading,
    message,
    error,
    isSuccess,
    sendResetEmail,
    updatePassword,
    resetState
  };
}

export default useForgotPassword;
