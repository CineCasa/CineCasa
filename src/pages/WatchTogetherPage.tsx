import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import VideoJSPlayer from '../components/VideoJSPlayer';
import { useAuth } from '../contexts/AuthContext';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string
);

export default function WatchTogetherPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [roomData, setRoomData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) {
      navigate('/');
      return;
    }

    loadRoomData();
  }, [roomId, navigate]);

  const loadRoomData = async () => {
    try {
      const { data, error } = await supabase
        .from('watch_together_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (error) throw error;
      
      if (!data) {
        setError('Sala não encontrada');
        setLoading(false);
        return;
      }

      setRoomData(data);
      setLoading(false);
    } catch (err: any) {
      console.error('Error loading room:', err);
      setError('Erro ao carregar sala');
      setLoading(false);
    }
  };

  const handleClose = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p>Carregando sala...</p>
        </div>
      </div>
    );
  }

  if (error || !roomData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-xl mb-4">{error || 'Sala não encontrada'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            Voltar para o início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <VideoJSPlayer
        url={roomData.current_url}
        title={roomData.title || 'Assistir Juntos'}
        poster={roomData.poster}
        onClose={handleClose}
        resumeFrom={roomData.current_time || 0}
        watchTogetherRoom={roomId}
        isHost={roomData.host_id === user?.id}
        username={user?.username || `Guest-${Math.random().toString(36).substr(2, 6)}`}
      />
    </div>
  );
}
