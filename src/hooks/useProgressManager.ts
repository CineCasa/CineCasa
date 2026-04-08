import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

interface ProgressData {
  contentId: string;
  contentType: 'movie' | 'series';
  progressSeconds: number;
  totalSeconds: number;
  percentageCompleted: number;
}

export const useProgressManager = () => {
  const { user } = useAuth();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const saveProgress = useCallback(async (progressData: ProgressData) => {
    if (!user) return;

    try {
      // Limpar timeout anterior se existir
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Aguardar um pouco antes de salvar (para não salvar a cada segundo)
      saveTimeoutRef.current = setTimeout(async () => {
        const { error } = await (supabase as any)
          .from('user_progress')
          .upsert({
            user_id: user.id,
            content_id: progressData.contentId,
            content_type: progressData.contentType,
            progress_seconds: progressData.progressSeconds,
            total_seconds: progressData.totalSeconds,
            percentage_completed: progressData.percentageCompleted,
            last_watched_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,content_id'
          });

        if (error) {
          console.error('Error saving progress:', error);
        }
      }, 2000); // Salvar após 2 segundos de inatividade

      // Atualizar preferências do usuário
      await updateUserPreferences(progressData.contentId);
    } catch (error) {
      console.error('Error in saveProgress:', error);
    }
  }, [user]);

  const updateUserPreferences = async (contentId: string) => {
    if (!user) return;

    try {
      // Extrair categoria do contentId
      const category = extractCategoryFromContent(contentId);
      if (!category) return;

      // Incrementar contador de visualizações
      const { error } = await (supabase as any)
        .rpc('increment_user_preference', {
          p_user_id: user.id,
          p_category: category
        });

      if (error) {
        // Fallback: fazer upsert manualmente
        await (supabase as any)
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            category: category,
            view_count: 1,
            total_watch_time: 1,
            last_viewed_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,category'
          });
      }
    } catch (error) {
      console.error('Error updating user preferences:', error);
    }
  };

  const extractCategoryFromContent = (contentId: string): string | null => {
    // Lógica para extrair categoria do contentId
    // Isso pode ser melhorado buscando do banco de dados
    const categories = ['Ação', 'Comédia', 'Drama', 'Romance', 'Terror', 'Ficção', 'Animação'];
    
    // Por enquanto, retornar uma categoria aleatória para demonstração
    // Na implementação real, você buscaria a categoria real do conteúdo
    return categories[Math.floor(Math.random() * categories.length)];
  };

  const getProgress = useCallback(async (contentId: string): Promise<ProgressData | null> => {
    if (!user) return null;

    try {
      const { data, error } = await (supabase as any)
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('content_id', contentId)
        .single();

      if (error || !data) return null;

      return {
        contentId: data.content_id,
        contentType: data.content_type,
        progressSeconds: data.progress_seconds,
        totalSeconds: data.total_seconds,
        percentageCompleted: data.percentage_completed
      };
    } catch (error) {
      console.error('Error getting progress:', error);
      return null;
    }
  }, [user]);

  const markAsCompleted = useCallback(async (contentId: string, contentType: 'movie' | 'series') => {
    if (!user) return;

    try {
      await (supabase as any)
        .from('user_progress')
        .upsert({
          user_id: user.id,
          content_id: contentId,
          content_type: contentType,
          progress_seconds: 100, // 100% completado
          total_seconds: 100,
          percentage_completed: 100,
          last_watched_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,content_id'
        });
    } catch (error) {
      console.error('Error marking as completed:', error);
    }
  }, [user]);

  const cleanup = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
  }, []);

  return {
    saveProgress,
    getProgress,
    markAsCompleted,
    cleanup
  };
};
