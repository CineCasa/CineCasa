import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface InvalidImage {
  id: number;
  url: string;
  reason: string;
  tableName: string;
  fieldName: string;
  detectedAt: string;
}

interface CleanupStats {
  totalChecked: number;
  invalidFound: number;
  cleaned: number;
  errors: string[];
}

const useImageCleanup = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [stats, setStats] = useState<CleanupStats>({
    totalChecked: 0,
    invalidFound: 0,
    cleaned: 0,
    errors: []
  });

  // Verificar se URL é inválida
  const isInvalidUrl = useCallback((url: string): { isValid: boolean; reason?: string } => {
    if (!url || typeof url !== 'string') {
      return { isValid: false, reason: 'empty' };
    }

    // Domínios de placeholder
    const invalidDomains = [
      'picsum.photos',
      'placeholder.com',
      'example.com',
      'test.com',
      'fake.com',
      'invalid.com',
      'loremflickr.com',
      'dummyimage.com'
    ];

    try {
      const urlObj = new URL(url);
      if (invalidDomains.some(domain => urlObj.hostname.includes(domain))) {
        return { isValid: false, reason: 'placeholder' };
      }
    } catch (e) {
      return { isValid: false, reason: 'invalid_url' };
    }

    // Padrões de placeholder
    const placeholderPatterns = [
      /placeholder/i,
      /dummy/i,
      /test/i,
      /sample/i,
      /lorem/i,
      /picsum/i
    ];

    if (placeholderPatterns.some(pattern => pattern.test(url))) {
      return { isValid: false, reason: 'invalid_pattern' };
    }

    // URLs de localhost ou IP
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      return { isValid: false, reason: 'localhost' };
    }

    return { isValid: true };
  }, []);

  // Escanear tabela em busca de imagens inválidas
  const scanTableForInvalidImages = useCallback(async (tableName: string): Promise<InvalidImage[]> => {
    try {
      console.log(`🔍 [ImageCleanup] Escaneando tabela: ${tableName}`);
      
      const { data: records, error } = await supabase
        .from(tableName as any)
        .select('*');

      if (error) {
        console.error(`❌ Erro ao escanear ${tableName}:`, error);
        return [];
      }

      const invalidImages: InvalidImage[] = [];
      const imageFields = tableName === 'cinema' 
        ? ['capa', 'poster', 'banner', 'backdrop']
        : ['capa', 'poster', 'banner', 'backdrop'];

      for (const record of records || []) {
        for (const imageField of imageFields) {
          const imageUrl = (record as any)[imageField];
          
          if (imageUrl) {
            const validation = isInvalidUrl(imageUrl);
            
            if (!validation.isValid) {
              invalidImages.push({
                id: record.id,
                url: imageUrl,
                reason: validation.reason || 'unknown',
                tableName,
                fieldName: imageField,
                detectedAt: new Date().toISOString()
              });
              
              console.log(`🚨 [ImageCleanup] Imagem inválida encontrada:`, {
                id: record.id,
                url: imageUrl,
                reason: validation.reason,
                title: record.titulo
              });
            }
          }
        }
      }

      console.log(`📊 [ImageCleanup] Total verificado: ${records?.length || 0}, Inválidas: ${invalidImages.length}`);
      return invalidImages;
    } catch (error) {
      console.error(`💥 Erro no escaneamento de ${tableName}:`, error);
      return [];
    }
  }, [isInvalidUrl]);

  // Limpar imagens inválidas (remover ou atualizar)
  const cleanupInvalidImages = useCallback(async (invalidImages: InvalidImage[]): Promise<number> => {
    let cleanedCount = 0;
    const errors: string[] = [];

    for (const invalidImage of invalidImages) {
      try {
        const tableName = invalidImage.tableName;
        const imageField = invalidImage.fieldName;

        if (invalidImage.reason === 'placeholder' || invalidImage.reason === 'invalid_pattern') {
          // Para placeholders e padrões inválidos, tentar encontrar uma imagem real
          console.log(`🔄 [ImageCleanup] Tentando encontrar imagem real para: ${invalidImage.url}`);
          
          // Buscar imagem do TMDB se tiver tmdb_id
          if (tableName === 'cinema' || tableName === 'series') {
            const { data: tmdbData } = await supabase
              .from(tableName)
              .select('tmdb_id')
              .eq('id', invalidImage.id)
              .maybeSingle();

            if (tmdbData?.tmdb_id) {
              // Usar imagem do TMDB
              const newImageUrl = `https://image.tmdb.org/t/p/w500${tmdbData.tmdb_id}.jpg`;
              
              const { error: updateError } = await supabase
                .from(tableName)
                .update({ [imageField]: newImageUrl })
                .eq('id', invalidImage.id);

              if (!updateError) {
                cleanedCount++;
                console.log(`✅ [ImageCleanup] Imagem atualizada: ${invalidImage.url} → ${newImageUrl}`);
              } else {
                errors.push(`Falha ao atualizar ${invalidImage.id}: ${updateError.message}`);
              }
            } else {
              // Se não tiver TMDB, remover o registro
              console.log(`🗑️ [ImageCleanup] Removendo registro sem TMDB: ${invalidImage.id}`);
              
              const { error: deleteError } = await supabase
                .from(tableName)
                .delete()
                .eq('id', invalidImage.id);

              if (!deleteError) {
                cleanedCount++;
              } else {
                errors.push(`Falha ao remover ${invalidImage.id}: ${deleteError.message}`);
              }
            }
          } else {
            // Para outras tabelas, apenas remover
            console.log(`🔧 [ImageCleanup] Removendo URL inválida: ${invalidImage.url}`);
            
            const { error: deleteError } = await supabase
              .from(tableName)
              .delete()
              .eq('id', invalidImage.id);

            if (!deleteError) {
              cleanedCount++;
            } else {
              errors.push(`Falha ao remover ${invalidImage.id}: ${deleteError.message}`);
            }
          }
        } else {
          // Para outros tipos de imagens inválidas, apenas remover
          console.log(`🗑️ [ImageCleanup] Removendo imagem inválida: ${invalidImage.url}`);
          
          const { error: deleteError } = await supabase
            .from(tableName)
            .delete()
            .eq('id', invalidImage.id);

          if (!deleteError) {
            cleanedCount++;
          } else {
            errors.push(`Falha ao remover ${invalidImage.id}: ${deleteError.message}`);
          }
        }
      } catch (error: any) {
        errors.push(`Erro ao processar ${invalidImage.id}: ${error.message}`);
      }
    }

    return cleanedCount;
  }, []);

  // Executar limpeza completa
  const runFullCleanup = useCallback(async (): Promise<void> => {
    setIsScanning(true);
    setStats(prev => ({ ...prev, totalChecked: 0, invalidFound: 0, cleaned: 0, errors: [] }));

    try {
      console.log('🚀 [ImageCleanup] Iniciando limpeza completa do banco de dados...');
      
      const tables = ['cinema', 'series'];
      let totalChecked = 0;
      let totalInvalidFound = 0;
      let totalCleaned = 0;
      const allErrors: string[] = [];

      for (const tableName of tables) {
        console.log(`📋 [ImageCleanup] Processando tabela: ${tableName}`);
        
        // Escanear imagens inválidas
        const invalidImages = await scanTableForInvalidImages(tableName);
        totalChecked += invalidImages.length;
        totalInvalidFound += invalidImages.length;

        if (invalidImages.length > 0) {
          // Limpar imagens inválidas
          const cleaned = await cleanupInvalidImages(invalidImages);
          totalCleaned += cleaned;
          allErrors.push(...errors);
        }
      }

      // Atualizar estatísticas
      setStats({
        totalChecked,
        invalidFound: totalInvalidFound,
        cleaned: totalCleaned,
        errors: allErrors
      });

      console.log(`✅ [ImageCleanup] Limpeza concluída:`, {
        totalChecked,
        invalidFound: totalInvalidFound,
        cleaned: totalCleaned,
        errors: allErrors.length
      });

    } catch (error) {
      console.error('💥 [ImageCleanup] Erro na limpeza completa:', error);
      setStats(prev => ({
        ...prev,
        errors: [...prev.errors, `Erro geral: ${(error as Error).message}`]
      }));
    } finally {
      setIsScanning(false);
    }
  }, []);

  return {
    isScanning,
    stats,
    runFullCleanup
  };
};

export default useImageCleanup;
