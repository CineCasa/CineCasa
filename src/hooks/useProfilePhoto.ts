import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseProfilePhotoOptions {
  userId?: string;
  profileId?: string;
}

export function useProfilePhoto({ userId, profileId }: UseProfilePhotoOptions) {
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const { toast } = useToast();

  // Buscar foto atual
  const fetchAvatar = useCallback(async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', profileId || userId)
        .maybeSingle();
      
      if (error) throw error;
      setAvatarUrl(data?.avatar_url || null);
    } catch (error) {
      console.error('❌ Erro ao buscar avatar:', error);
    }
  }, [userId, profileId]);

  // Upload de foto
  const uploadPhoto = useCallback(async (file: File): Promise<string | null> => {
    if (!userId) {
      toast({
        title: 'Erro',
        description: 'Usuário não autenticado',
        variant: 'destructive',
      });
      return null;
    }

    setIsUploading(true);
    
    try {
      // Validar arquivo
      if (!file.type.startsWith('image/')) {
        throw new Error('O arquivo deve ser uma imagem');
      }
      
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('A imagem deve ter no máximo 5MB');
      }

      // Gerar nome único
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}_${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload para Storage
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      // Atualizar perfil
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profileId || userId);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      
      toast({
        title: 'Sucesso!',
        description: 'Foto de perfil atualizada',
      });

      return publicUrl;
    } catch (error: any) {
      console.error('❌ Erro no upload:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao fazer upload da foto',
        variant: 'destructive',
      });
      return null;
