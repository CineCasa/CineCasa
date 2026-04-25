import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook para gerenciar política de autoplay
 * Roku, Safari (Apple TV) e outros navegadores requerem interação do usuário antes de tocar áudio
 * 
 * Regras:
 * 1. Primeiro trailer: tentar com som, mas se bloqueado, mostrar ícone de mudo
 * 2. Após primeiro OK do usuário, liberar áudio para todos os trailers da sessão
 * 3. Persistir estado de permissão na sessão
 */

interface AutoplayPolicyState {
  hasUserInteracted: boolean;
  isAudioBlocked: boolean;
  showMuteIndicator: boolean;
}

export function useAutoplayPolicy() {
  const [state, setState] = useState<AutoplayPolicyState>({
    hasUserInteracted: false,
    isAudioBlocked: true, // Inicialmente assumir que áudio está bloqueado
    showMuteIndicator: false,
  });

  const audioContextRef = useRef<AudioContext | null>(null);

  // Verificar se o navegador permite autoplay
  useEffect(() => {
    const checkAutoplayPolicy = async () => {
      try {
        // Criar AudioContext para testar
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) {
          // Navegador não suporta AudioContext, assumir que precisa de interação
          setState(prev => ({ ...prev, isAudioBlocked: true }));
          return;
        }

        audioContextRef.current = new AudioContextClass();
        
        // Se o estado for 'suspended', o áudio está bloqueado
        if (audioContextRef.current.state === 'suspended') {
          setState(prev => ({ ...prev, isAudioBlocked: true }));
          
          // Tentar resumir (pode falhar se não houver interação)
          try {
            await audioContextRef.current.resume();
            setState(prev => ({ ...prev, isAudioBlocked: false, hasUserInteracted: true }));
          } catch (e) {
            // Áudio ainda bloqueado, aguardar interação
          }
        } else {
          setState(prev => ({ ...prev, isAudioBlocked: false }));
        }
      } catch (e) {
        console.log('[AutoplayPolicy] Erro ao verificar política:', e);
      }
    };

    checkAutoplayPolicy();

    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  // Marcar interação do usuário
  const onUserInteraction = useCallback(async () => {
    setState(prev => ({
      ...prev,
      hasUserInteracted: true,
      isAudioBlocked: false,
      showMuteIndicator: false,
    }));

    // Tentar resumir AudioContext se existir
    if (audioContextRef.current?.state === 'suspended') {
      try {
        await audioContextRef.current.resume();
      } catch (e) {
        console.log('[AutoplayPolicy] Não foi possível resumir AudioContext');
      }
    }

    // Tentar liberar áudio em iframes de vídeo (YouTube)
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      try {
        // Post message para o iframe tentar iniciar áudio
        iframe.contentWindow?.postMessage(
          { type: 'cinecasa-user-interaction' },
          '*'
        );
      } catch (e) {
        // Ignorar erros de cross-origin
      }
    });
  }, []);

  // Tratar bloqueio de áudio no primeiro trailer
  const onAudioBlocked = useCallback(() => {
    if (!state.hasUserInteracted) {
      setState(prev => ({
        ...prev,
        isAudioBlocked: true,
        showMuteIndicator: true,
      }));
    }
  }, [state.hasUserInteracted]);

  // Esconder indicador de mudo
  const hideMuteIndicator = useCallback(() => {
    setState(prev => ({ ...prev, showMuteIndicator: false }));
  }, []);

  return {
    ...state,
    onUserInteraction,
    onAudioBlocked,
    hideMuteIndicator,
  };
}

export default useAutoplayPolicy;
