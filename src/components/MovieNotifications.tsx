import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications, type MovieNotification } from '@/hooks/useNotifications';
import { supabase } from '@/lib/supabase';
import { Play, X, Film } from 'lucide-react';

function NotificationCard({ movie, onDismiss }: { movie: MovieNotification; onDismiss: () => void }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onDismiss, 300);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  const handleAssistir = () => {
    if (movie.video_url) {
      window.open(movie.video_url, '_blank');
    }
    setIsExiting(true);
    setTimeout(onDismiss, 300);
  };

  const handleTrailer = () => {
    if (movie.trailer_url) {
      window.open(movie.trailer_url, '_blank');
    }
  };

  return (
    <motion.div
      initial={{ x: 400, opacity: 0, scale: 0.9 }}
      animate={{ x: isExiting ? 400 : 0, opacity: isExiting ? 0 : 1, scale: isExiting ? 0.9 : 1 }}
      exit={{ x: 400, opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="bg-gradient-to-r from-gray-900/95 to-black/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl min-w-[320px] max-w-[360px]"
    >
      <div className="flex">
        {/* Poster */}
        <div className="w-20 h-28 flex-shrink-0 bg-gray-800 relative">
          {movie.poster ? (
            <img
              src={movie.poster}
              alt={movie.titulo}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-800">
              <Film className="w-8 h-8 text-gray-600" />
            </div>
          )}
          {/* New badge */}
          <div className="absolute top-1 left-1 px-2 py-0.5 bg-red-600 rounded text-[10px] font-bold uppercase tracking-wider">
            Novo
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-3 flex flex-col justify-between">
          <div>
            <p className="text-xs text-red-400 font-medium uppercase tracking-wider mb-1">
              {movie.categoria || 'Filme'}
            </p>
            <h4 className="text-sm font-bold text-white leading-tight line-clamp-2">
              {movie.titulo}
            </h4>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleAssistir}
              className="flex-1 bg-black hover:bg-gray-900 text-white text-xs font-bold py-1.5 px-2 rounded flex items-center justify-center gap-1 transition-colors"
            >
              <Play className="w-3 h-3" fill="white" />
              Assistir
            </button>
            {movie.trailer_url && (
              <button
                onClick={handleTrailer}
                className="flex-1 bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-bold py-1.5 px-2 rounded flex items-center justify-center gap-1 transition-colors"
              >
                <Play className="w-3 h-3" fill="white" />
                Trailer
              </button>
            )}
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={() => {
            setIsExiting(true);
            setTimeout(onDismiss, 300);
          }}
          className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
        >
          <X className="w-3 h-3 text-white" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/10">
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: 3, ease: 'linear' }}
          className="h-full bg-red-600"
        />
      </div>
    </motion.div>
  );
}

export function NotificationContainer() {
  const { notifications, removeNotification, addNotification } = useNotifications();

  // Supabase realtime subscription for new movies
  useEffect(() => {
    const subscription = supabase
      .channel('new-movies')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'cinema',
        },
        (payload) => {
          const newMovie = payload.new as Record<string, unknown>;
          const notification: MovieNotification = {
            id: String(newMovie.id || Date.now()),
            titulo: String(newMovie.titulo || 'Novo Filme'),
            poster: newMovie.poster ? String(newMovie.poster) : undefined,
            categoria: newMovie.categoria ? String(newMovie.categoria) : undefined,
            trailer_url: newMovie.trailer_url ? String(newMovie.trailer_url) : undefined,
            video_url: newMovie.video_url ? String(newMovie.video_url) : undefined,
            created_at: new Date().toISOString(),
          };
          addNotification(notification);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-[100] flex flex-col gap-3">
      <AnimatePresence mode="popLayout">
        {notifications.map((movie) => (
          <NotificationCard
            key={movie.id}
            movie={movie}
            onDismiss={() => removeNotification(movie.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
