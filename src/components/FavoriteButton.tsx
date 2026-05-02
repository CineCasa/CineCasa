import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

interface FavoriteButtonProps {
  contentId: string;
  contentType: 'movie' | 'series';
  className?: string;
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({ 
  contentId, 
  contentType, 
  className = '' 
}) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    
    const checkFavorite = async () => {
      try {
        const { data, error } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('content_id', contentId)
          .eq('content_type', contentType)
          .single();
        
        if (!error && data) {
          setIsFavorite(true);
        }
      } catch (err) {
        console.log('[FavoriteButton] Erro ao verificar favorito:', err);
      }
    };
    
    checkFavorite();
  }, [user, contentId, contentType]);

  const toggleFavorite = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      if (isFavorite) {
        // Remove from favorites
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('content_id', contentId)
          .eq('content_type', contentType);
        
        setIsFavorite(false);
      } else {
        // Add to favorites
        await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            content_id: contentId,
            content_type: contentType,
          });
        
        setIsFavorite(true);
      }
    } catch (err) {
      console.error('[FavoriteButton] Erro:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <button
      onClick={toggleFavorite}
      disabled={isLoading}
      className={`p-2 rounded-full transition-colors ${
        isFavorite 
          ? 'bg-red-600 text-white' 
          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
      } ${className}`}
      aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
    >
      <Heart 
        className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} 
      />
    </button>
  );
};

export { FavoriteButton };
