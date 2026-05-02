import React, { useState, useEffect } from 'react';
import { BookmarkPlus, BookmarkCheck } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

interface WatchlistButtonProps {
  contentId: string;
  contentType: 'movie' | 'series';
  title: string;
  poster?: string;
  className?: string;
}

const WatchlistButton: React.FC<WatchlistButtonProps> = ({ 
  contentId, 
  contentType, 
  title,
  poster,
  className = '' 
}) => {
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    
    const checkWatchlist = async () => {
      try {
        const { data, error } = await supabase
          .from('watchlist')
          .select('id')
          .eq('user_id', user.id)
          .eq('content_id', contentId)
          .eq('content_type', contentType)
          .single();
        
        if (!error && data) {
          setIsInWatchlist(true);
        }
      } catch (err) {
        console.log('[WatchlistButton] Erro ao verificar watchlist:', err);
      }
    };
    
    checkWatchlist();
  }, [user, contentId, contentType]);

  const toggleWatchlist = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      if (isInWatchlist) {
        // Remove from watchlist
        await supabase
          .from('watchlist')
          .delete()
          .eq('user_id', user.id)
          .eq('content_id', contentId)
          .eq('content_type', contentType);
        
        setIsInWatchlist(false);
      } else {
        // Add to watchlist
        await supabase
          .from('watchlist')
          .insert({
            user_id: user.id,
            content_id: contentId,
            content_type: contentType,
            titulo: title,
            poster: poster,
          });
        
        setIsInWatchlist(true);
      }
    } catch (err) {
      console.error('[WatchlistButton] Erro:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <button
      onClick={toggleWatchlist}
      disabled={isLoading}
      className={`p-2 rounded-full transition-colors ${
        isInWatchlist 
          ? 'bg-blue-600 text-white' 
          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
      } ${className}`}
      aria-label={isInWatchlist ? 'Remover da lista' : 'Adicionar à lista'}
    >
      {isInWatchlist ? (
        <BookmarkCheck className="w-6 h-6" />
      ) : (
        <BookmarkPlus className="w-6 h-6" />
      )}
    </button>
  );
};

export { WatchlistButton };
