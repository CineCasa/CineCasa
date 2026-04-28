import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AvatarCustomization {
  // Aparência base
  bodyType: 'slim' | 'average' | 'athletic' | 'plus';
  skinTone: 'light' | 'medium' | 'tan' | 'dark' | 'deep';
  faceShape: 'round' | 'square' | 'heart' | 'oval' | 'diamond';

  // Cabelo
  hairStyle: 'short' | 'medium' | 'long' | 'bald' | 'ponytail' | 'mohawk' | 'buzzcut';
  hairColor: 'black' | 'brown' | 'blonde' | 'red' | 'gray' | 'blue' | 'pink' | 'purple' | 'green';
  facialHair: 'none' | 'beard' | 'mustache' | 'goatee' | 'full';

  // Olhos
  eyeShape: 'round' | 'almond' | 'monolid' | 'hooded' | 'upturned' | 'downturned';
  eyeColor: 'brown' | 'blue' | 'green' | 'hazel' | 'gray' | 'amber' | 'violet';
  glasses: 'none' | 'regular' | 'sunglasses' | 'reading' | 'monocle';

  // Acessórios
  headwear: 'none' | 'cap' | 'beanie' | 'headband' | 'crown' | 'helmet' | 'hat';
  accessory: 'none' | 'earrings' | 'necklace' | 'tie' | 'scarf' | 'glasses';
  background: 'none' | 'gradient' | 'pattern' | 'solid' | 'image';
  backgroundColor: string;
  patternColor: string;

  // Roupas
  topType: 'none' | 'tshirt' | 'shirt' | 'sweater' | 'jacket' | 'suit' | 'dress';
  topColor: string;
  bottomType: 'none' | 'pants' | 'shorts' | 'skirt' | 'dress';
  bottomColor: string;

  // Expressões e animações
  expression: 'happy' | 'neutral' | 'sad' | 'excited' | 'cool' | 'sleeping' | 'wink' | 'surprised';
  animation: 'none' | 'bounce' | 'wave' | 'blink' | 'float' | 'spin' | 'pulse';

  // Itens especiais (desbloqueáveis)
  specialItems: string[];
  badges: string[];
  frames: string[];
  effects: string[];

  // Metadados
  created_at: string;
  updated_at: string;
  version: string;
}

interface AvatarItem {
  id: string;
  name: string;
  category: 'body' | 'hair' | 'eyes' | 'accessories' | 'clothing' | 'special';
  type: string;
  color?: string;
  icon?: string;
  unlocked: boolean;
  unlockCondition?: string;
  price?: number;
}

interface UseAvatarCustomizationOptions {
  userId?: string;
  profileId?: string;
  enableSpecialItems?: boolean;
  enableAnimations?: boolean;
  autoSave?: boolean;
}

// Função default movida para antes do hook
const getDefaultCustomization = (): AvatarCustomization => ({
  bodyType: 'average',
  skinTone: 'medium',
  faceShape: 'round',
  hairStyle: 'medium',
  hairColor: 'brown',
  facialHair: 'none',
  eyeShape: 'round',
  eyeColor: 'brown',
  glasses: 'none',
  headwear: 'none',
  accessory: 'none',
  background: 'gradient',
  backgroundColor: '#4F46E5',
  patternColor: '#10B981',
  topType: 'tshirt',
  topColor: '#3B82F6',
  bottomType: 'pants',
  bottomColor: '#1F2937',
  expression: 'happy',
  animation: 'none',
  specialItems: [],
  badges: [],
  frames: [],
  effects: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  version: '1.0',
});

export function useAvatarCustomization({
  userId,
  profileId,
  enableSpecialItems = true,
  enableAnimations = true,
  autoSave = true,
}: UseAvatarCustomizationOptions = {}) {
  const queryClient = useQueryClient();
  const [currentCustomization, setCurrentCustomization] = useState<AvatarCustomization>(getDefaultCustomization());

  // Query para customização atual do avatar
  const { data: customization, isLoading, error, refetch } = useQuery({
    queryKey: ['avatar-customization', userId, profileId],
    queryFn: async (): Promise<AvatarCustomization> => {
      if (!userId) return getDefaultCustomization();

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('avatar_customization')
          .eq('id', userId)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('❌ Erro ao buscar customização do avatar:', error);
          return getDefaultCustomization();
        }

        const customizationData = data?.avatar_customization || getDefaultCustomization();
        setCurrentCustomization(customizationData);
        
        return customizationData;
      } catch (error) {
        console.error('❌ Erro ao processar customização:', error);
        return getDefaultCustomization();
      }
    },
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 segundos
    cacheTime: 5 * 60 * 1000, // 5 minutos
  });

  // Query para itens disponíveis
  const { data: availableItems } = useQuery({
    queryKey: ['avatar-items'],
    queryFn: async (): Promise<AvatarItem[]> => {
      try {
        const { data, error } = await supabase
          .from('avatar_items')
          .select('*')
          .order('category', { ascending: true })
          .order('type', { ascending: true });

        if (error) {
          console.error('❌ Erro ao buscar itens do avatar:', error);
          return [];
        }

        return data || [];
      } catch (error) {
        console.error('❌ Erro ao buscar itens do avatar:', error);
        return [];
      }
    },
    staleTime: 60 * 60 * 1000, // 1 hora
    cacheTime: 24 * 60 * 1000, // 24 horas
  });

  // Mutation para salvar customização
  const saveCustomization = useMutation({
    mutationFn: async (customizationData: Partial<AvatarCustomization>) => {
      if (!userId) throw new Error('Usuário não autenticado');

      const updatedCustomization = {
        ...currentCustomization,
        ...customizationData,
        updated_at: new Date().toISOString(),
        version: '1.0',
      };

      const { data, error } = await supabase
        .from('profiles')
        .update({
          avatar_customization: updatedCustomization,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao salvar customização:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (updatedProfile) => {
      setCurrentCustomization(updatedProfile.avatar_customization || getDefaultCustomization());
      queryClient.setQueryData(['avatar-customization', userId, profileId], updatedProfile.avatar_customization);
    },
    onError: (error) => {
      console.error('❌ Erro na mutation de salvar customização:', error);
    },
  });

  // Mutation para desbloquear item especial (simplificado - sem sistema de pontos)
  const unlockItem = useMutation({
    mutationFn: async ({ itemId }: { itemId: string; cost: number }) => {
      if (!userId) throw new Error('Usuário não autenticado');

      // Adicionar item aos itens desbloqueados
      const currentItems = currentCustomization.specialItems || [];
      const updatedItems = [...currentItems, itemId];

      await saveCustomization.mutateAsync({
        specialItems: updatedItems,
      });

      return { itemId, pointsRemaining: 0 };
    },
    onSuccess: ({ pointsRemaining }) => {
      console.log(`🎉 Item desbloqueado! Pontos restantes: ${pointsRemaining}`);
    },
    onError: (error) => {
      console.error('❌ Erro ao desbloquear item:', error);
    },
  });

  // Auto-save
  useEffect(() => {
    if (!autoSave || !userId) return;

    const timer = setTimeout(() => {
      saveCustomization.mutate(currentCustomization);
    }, 2000); // Salvar 2 segundos após a última mudança

    return () => clearTimeout(timer);
  }, [currentCustomization, autoSave, userId, saveCustomization.mutate]);

  // Funções de customização
  const updateCustomization = useCallback((updates: Partial<AvatarCustomization>) => {
    const newCustomization = { ...currentCustomization, ...updates };
    setCurrentCustomization(newCustomization);

    if (autoSave) {
      // Agendar auto-save
      setTimeout(() => {
        saveCustomization.mutate(newCustomization);
      }, 1000);
    }
  }, [currentCustomization, autoSave, saveCustomization.mutate]);

  const resetCustomization = useCallback(() => {
    const defaultCustomization = getDefaultCustomization();
    setCurrentCustomization(defaultCustomization);
    
    if (autoSave) {
      saveCustomization.mutate(defaultCustomization);
    }
  }, [autoSave, saveCustomization.mutate]);

  const randomizeCustomization = useCallback(() => {
    const categories = Object.keys(currentCustomization);
    const randomCustomization = { ...currentCustomization };

    categories.forEach(category => {
      if (category === 'created_at' || category === 'updated_at' || category === 'version') return;
      
      const options = getOptionsForCategory(category);
      if (options.length > 0) {
        const randomOption = options[Math.floor(Math.random() * options.length)];
        (randomCustomization as any)[category] = randomOption;
      }
    });

    setCurrentCustomization(randomCustomization);
  }, [currentCustomization]);

  // Funções utilitárias
  const getOptionsForCategory = (category: string): string[] => {
    const options: Record<string, string[]> = {
      bodyType: ['slim', 'average', 'athletic', 'plus'],
      skinTone: ['light', 'medium', 'tan', 'dark', 'deep'],
      faceShape: ['round', 'square', 'heart', 'oval', 'diamond'],
      hairStyle: ['short', 'medium', 'long', 'bald', 'ponytail', 'mohawk', 'buzzcut'],
      hairColor: ['black', 'brown', 'blonde', 'red', 'gray', 'blue', 'pink', 'purple', 'green'],
      facialHair: ['none', 'beard', 'mustache', 'goatee', 'full'],
      eyeShape: ['round', 'almond', 'monolid', 'hooded', 'upturned', 'downturned'],
      eyeColor: ['brown', 'blue', 'green', 'hazel', 'gray', 'amber', 'violet'],
      glasses: ['none', 'regular', 'sunglasses', 'reading', 'monocle'],
      headwear: ['none', 'cap', 'beanie', 'headband', 'crown', 'helmet', 'hat'],
      accessory: ['none', 'earrings', 'necklace', 'tie', 'scarf', 'glasses'],
      background: ['none', 'gradient', 'pattern', 'solid', 'image'],
      expression: ['happy', 'neutral', 'sad', 'excited', 'cool', 'sleeping', 'wink', 'surprised'],
      animation: ['none', 'bounce', 'wave', 'blink', 'float', 'spin', 'pulse'],
    };

    return options[category] || [];
  };

  // Gerar avatar URL baseado na customização
  const generateAvatarUrl = useCallback((customization: AvatarCustomization): string => {
    // Em produção, isso geraria uma imagem real
    // Por enquanto, retorna URL baseada nos parâmetros
    const params = new URLSearchParams({
      body: customization.bodyType,
      skin: customization.skinTone,
      face: customization.faceShape,
      hair: customization.hairStyle,
      hairColor: customization.hairColor,
      facialHair: customization.facialHair,
      eyes: customization.eyeShape,
      eyeColor: customization.eyeColor,
      glasses: customization.glasses,
      headwear: customization.headwear,
      accessory: customization.accessory,
      background: customization.background,
      bgColor: customization.backgroundColor,
      patternColor: customization.patternColor,
      topType: customization.topType,
      topColor: customization.topColor,
      bottomType: customization.bottomType,
      bottomColor: customization.bottomColor,
      expression: customization.expression,
      animation: customization.animation,
    });

    return `https://api.cinecasa.com/avatar/generate?${params.toString()}`;
  }, []);

  // Agrupar itens por categoria
  const itemsByCategory = useMemo(() => {
    if (!availableItems) return {};

    return availableItems.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, AvatarItem[]>);
  }, [availableItems]);

  // Verificar se item está desbloqueado
  const isItemUnlocked = useCallback((itemId: string): boolean => {
    return currentCustomization.specialItems?.includes(itemId) || false;
  }, [currentCustomization.specialItems]);

  // Exportar/importar customização
  const exportCustomization = useCallback(async () => {
    const exportData = {
      userId,
      profileId,
      customization: currentCustomization,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cinecasa-avatar-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [currentCustomization, userId, profileId]);

  const importCustomization = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (data.customization) {
        setCurrentCustomization(data.customization);
        await saveCustomization.mutateAsync(data.customization);
      }
    } catch (error) {
      console.error('❌ Erro ao importar customização:', error);
    }
  }, [saveCustomization.mutate]);

  return {
    // Dados
    customization: currentCustomization,
    availableItems: availableItems || [],
    itemsByCategory,
    isLoading,
    error,
    
    // Ações
    updateCustomization,
    resetCustomization,
    randomizeCustomization,
    saveCustomization: saveCustomization.mutate,
    unlockItem: unlockItem.mutate,
    
    // Utilitários
    generateAvatarUrl,
    isItemUnlocked,
    getOptionsForCategory,
    exportCustomization,
    importCustomization,
    
    // Estados
    isSaving: saveCustomization.isPending,
    isUnlocking: unlockItem.isPending,
    hasSpecialItems: enableSpecialItems && (currentCustomization.specialItems?.length || 0) > 0,
  };
}

// Hook para preview do avatar
export function useAvatarPreview(customization: AvatarCustomization) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const generatePreview = useCallback(async () => {
    setIsGenerating(true);
    
    try {
      // Simular geração do avatar
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const params = new URLSearchParams({
        body: customization.bodyType,
        skin: customization.skinTone,
        face: customization.faceShape,
        hair: customization.hairStyle,
        hairColor: customization.hairColor,
        facialHair: customization.facialHair,
        eyes: customization.eyeShape,
        eyeColor: customization.eyeColor,
        glasses: customization.glasses,
        headwear: customization.headwear,
        accessory: customization.accessory,
        background: customization.background,
        bgColor: customization.backgroundColor,
        patternColor: customization.patternColor,
        topType: customization.topType,
        topColor: customization.topColor,
        bottomType: customization.bottomType,
        bottomColor: customization.bottomColor,
        expression: customization.expression,
        animation: customization.animation,
        preview: 'true',
      });

      const url = `https://api.cinecasa.com/avatar/generate?${params.toString()}`;
      setPreviewUrl(url);
    } catch (error) {
      console.error('❌ Erro ao gerar preview:', error);
