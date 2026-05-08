import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useAchievements = () => {
  const unlockAchievement = async (achievementId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Tentar inserir a conquista (o banco ignora se já tiver)
    const { error } = await supabase
      .from('user_achievements')
      .insert({ 
        user_id: user.id, 
        achievement_id: achievementId 
      });

    if (!error) {
      // 2. Se não deu erro, é porque o usuário acabou de ganhar!
      // Buscar detalhes da conquista para o Toast
      const { data: achievement } = await supabase
        .from('achievements')
        .select('*')
        .eq('id', achievementId)
        .single();

      if (achievement) {
        toast.success(`🏅 Conquista Desbloqueada: ${achievement.title}`, {
          description: achievement.description,
          duration: 5000,
        });
        
        // Opcional: Adicionar o XP da recompensa
        // addXP(achievement.xp_reward); 
      }
    }
  };

  return { unlockAchievement };
};
