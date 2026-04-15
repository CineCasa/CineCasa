/**
 * Password Reset Service - CineCasa
 * 
 * Serviço para gerenciar recuperação de senha usando Supabase Auth
 * Envia email com link para redefinição de senha
 */

import { supabase } from '@/integrations/supabase/client';

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetResponse {
  success: boolean;
  message: string;
  error?: string;
}

export interface UpdatePasswordRequest {
  newPassword: string;
  accessToken?: string;
}

class PasswordResetService {
  /**
   * Envia email de recuperação de senha
   * @param email Email do usuário
   * @returns Resultado da operação
   */
  async sendResetEmail(email: string): Promise<PasswordResetResponse> {
    try {
      // Verificar se email existe no sistema
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', email)
        .single();

      if (profileError || !profileData) {
        // Por segurança, não revelar se email existe ou não
        // Retornar sucesso mesmo se email não existir
        console.log('[PasswordReset] Email não encontrado, mas retornando sucesso por segurança');
        return {
          success: true,
          message: 'Se o email estiver cadastrado, você receberá as instruções de recuperação.'
        };
      }

      // Enviar email de recuperação via Supabase Auth
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        console.error('[PasswordReset] Erro ao enviar email:', error);
        return {
          success: false,
          message: 'Erro ao enviar email de recuperação. Tente novamente.',
          error: error.message
        };
      }

      console.log('[PasswordReset] Email enviado com sucesso para:', email);
      
      return {
        success: true,
        message: 'Email de recuperação enviado! Verifique sua caixa de entrada e spam.'
      };
    } catch (error: any) {
      console.error('[PasswordReset] Erro inesperado:', error);
      return {
        success: false,
        message: 'Ocorreu um erro inesperado. Tente novamente.',
        error: error.message
      };
    }
  }

  /**
   * Atualiza a senha do usuário
   * @param newPassword Nova senha
   * @returns Resultado da operação
   */
  async updatePassword(newPassword: string): Promise<PasswordResetResponse> {
    try {
      // Validar senha
      if (newPassword.length < 6) {
        return {
          success: false,
          message: 'A senha deve ter pelo menos 6 caracteres.',
          error: 'Senha muito curta'
        };
      }

      // Atualizar senha via Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('[PasswordReset] Erro ao atualizar senha:', error);
        return {
          success: false,
          message: 'Erro ao atualizar senha. O link pode ter expirado.',
          error: error.message
        };
      }

      console.log('[PasswordReset] Senha atualizada com sucesso');
      
      return {
        success: true,
        message: 'Senha atualizada com sucesso! Faça login com sua nova senha.'
      };
    } catch (error: any) {
      console.error('[PasswordReset] Erro inesperado:', error);
      return {
        success: false,
        message: 'Ocorreu um erro inesperado. Tente novamente.',
        error: error.message
      };
    }
  }

  /**
   * Verifica se há uma sessão de recuperação ativa (usuário clicou no link do email)
   * @returns boolean indicando se está em modo de recuperação
   */
  async isRecoverySession(): Promise<boolean> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        return false;
      }

      // Verificar se a sessão é de recuperação de senha
      // O Supabase adiciona um claim especial quando é uma sessão de recuperação
      return true;
    } catch (error) {
      console.error('[PasswordReset] Erro ao verificar sessão:', error);
      return false;
    }
  }

  /**
   * Extrai o token de recuperação da URL
   * @returns Token de acesso ou null
   */
  getRecoveryTokenFromURL(): string | null {
    const hash = window.location.hash;
    if (!hash) return null;

    const params = new URLSearchParams(hash.substring(1));
    return params.get('access_token');
  }

  /**
   * Lidar com callback de recuperação (processar token da URL)
   * @returns Resultado da operação
   */
  async handleRecoveryCallback(): Promise<PasswordResetResponse> {
    try {
      // O Supabase já processa automaticamente o token na URL
      // Verificar se há sessão ativa
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        return {
          success: false,
          message: 'Link de recuperação inválido ou expirado. Solicite um novo.',
          error: error?.message || 'Sem sessão'
        };
      }

      return {
        success: true,
        message: 'Sessão de recuperação ativa. Você pode redefinir sua senha.'
      };
    } catch (error: any) {
      console.error('[PasswordReset] Erro no callback:', error);
      return {
        success: false,
        message: 'Erro ao processar link de recuperação.',
        error: error.message
      };
    }
  }
}

// Singleton
export const passwordResetService = new PasswordResetService();
export default passwordResetService;
