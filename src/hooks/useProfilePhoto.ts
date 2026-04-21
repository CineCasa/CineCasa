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
    } finally {
      setIsUploading(false);
    }
  }, [userId, profileId, toast]);

  // Abrir câmera - abordagem robusta para mobile
  const openCamera = useCallback(() => {
    console.log('📸 Abrindo câmera...');
    
    // Criar input persistente no DOM
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    // 'user' = câmera frontal, 'environment' = câmera traseira
    input.setAttribute('capture', 'environment');
    input.style.cssText = 'position: fixed; top: -1000px; left: -1000px; opacity: 0; pointer-events: none; z-index: -1;';
    
    // Adicionar ao body antes de configurar onchange
    document.body.appendChild(input);
    
    // Handler para quando o usuário seleciona uma foto
    const handleChange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      console.log('📸 Arquivo selecionado:', file?.name);
      
      if (file) {
        await uploadPhoto(file);
      }
      
      // Limpar
      input.removeEventListener('change', handleChange);
      if (document.body.contains(input)) {
        document.body.removeChild(input);
      }
    };
    
    input.addEventListener('change', handleChange);
    
    // Clicar no input após pequeno delay para garantir que está no DOM
    requestAnimationFrame(() => {
      try {
        input.click();
        console.log('📸 Input click disparado');
      } catch (err) {
        console.error('❌ Erro ao clicar no input:', err);
      }
    });
    
    // Fallback de cleanup
    setTimeout(() => {
      if (document.body.contains(input)) {
        document.body.removeChild(input);
      }
    }, 30000);
  }, [uploadPhoto]);

  // Abrir galeria
  const openGallery = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = false;
    input.style.display = 'none';
    
    document.body.appendChild(input);
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        await uploadPhoto(file);
      }
      document.body.removeChild(input);
    };
    
    input.click();
    
    // Fallback se onchange não for chamado
    setTimeout(() => {
      if (document.body.contains(input)) {
        document.body.removeChild(input);
      }
    }, 5000);
  }, [uploadPhoto]);

  // Remover foto
  const removePhoto = useCallback(async () => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profileId || userId);

      if (error) throw error;

      setAvatarUrl(null);
      
      toast({
        title: 'Foto removida',
        description: 'Sua foto de perfil foi removida',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao remover foto',
        variant: 'destructive',
      });
    }
  }, [userId, profileId, toast]);

  return {
    avatarUrl,
    isUploading,
    fetchAvatar,
    uploadPhoto,
    openCamera,
    openGallery,
    removePhoto,
  };
}
