import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, RefreshCw, Clock, Film, Tv, Play, Lock } from 'lucide-react';
import { useRecentContent } from '@/hooks/useRecentContent';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';

export default function PublicNotifications() {
  const { content, isLoading, refresh, lastUpdated } = useRecentContent(24);
  const { session } = useAuth();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const isLoggedIn = !!session;
  const categories = [...new Set(content.map(i => i.category || i.genero || 'Geral').filter(Boolean))];

  const filteredContent = selectedCategory 
    ? content.filter(i => (i.category || i.genero) === selectedCategory)
    : content;

  const handlePlay = (item: any) => {
    if (!isLoggedIn) {
      toast.error('Faça login para assistir');
      return;
    }
    navigate(item.type === 'movie' ? `/details/cinema/${item.id}` : `/details/series/${item.id}`);
  };

  const formatTime = (d: string) => {
    const h = Math.floor((Date.now() - new Date(d).getTime()) / (1000 * 60 * 60));
    return h < 1 ? 'Agora' : h < 24 ? `Há ${h}h` : `Há ${Math.floor(h/24)}d`;
  };

  return (
    <div className="min-h-screen bg-black text-white pt-[94px]">
      <div className="bg-gray-900 border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6 text-blue-400" />
              <h1 className="text-xl font-bold">Novidades</h1>
              <span className="bg-blue-500 text-xs px-2 py-1 rounded-full">24h</span>
            </div>
            <button onClick={refresh} disabled={isLoading} className="p-2 rounded-lg hover:bg-gray-800">
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          {categories.length > 0 && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
              <button onClick={() => setSelectedCategory(null)} className={`px-3 py-1.5 rounded-full text-sm ${!selectedCategory ? 'bg-blue-600' : 'bg-gray-800'}`}>
                Todas ({content.length})
              </button>
              {categories.map(c => (
                <button key={c} onClick={() => setSelectedCategory(c)} className={`px-3 py-1.5 rounded-full text-sm ${selectedCategory === c ? 'bg-blue-600' : 'bg-gray-800'}`}>
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {!isLoggedIn && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-blue-400" />
              <p className="text-blue-200 text-sm">Faça login para assistir. Visualização pública disponível.</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-[#00E5FF]" />
              <p className="text-gray-400 text-sm">Carregando novidades...</p>
            </div>
          </div>
        ) : filteredContent.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-8 max-w-md text-center shadow-2xl">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#00E5FF]/20 to-[#00E5FF]/5 flex items-center justify-center border border-[#00E5FF]/30">
                <Bell className="w-8 h-8 text-[#00E5FF]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Nenhuma novidade</h3>
              <p className="text-gray-400">Nenhuma novidade nas últimas 24h. Fique ligado!</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredContent.map(item => (
              <div key={item.id} className="group cursor-pointer" onClick={() => handlePlay(item)}>
                <div className="aspect-[2/3] rounded-xl overflow-hidden bg-gray-800 relative transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(0,229,255,0.5)] group-hover:scale-105">
                  {item.poster ? (
                    <img src={item.poster} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {item.type === 'movie' ? <Film className="w-12 h-12 text-gray-500" /> : <Tv className="w-12 h-12 text-gray-500" />}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button className={`w-12 h-12 rounded-full flex items-center justify-center ${isLoggedIn ? 'bg-blue-500' : 'bg-gray-500'}`}>
                      {isLoggedIn ? <Play className="w-5 h-5 ml-0.5" fill="white" /> : <Lock className="w-5 h-5" />}
                    </button>
                  </div>
                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg text-xs flex items-center gap-1 border border-white/10">
                    <Clock className="w-3 h-3 text-[#00E5FF]" /> {formatTime(item.created_at)}
                  </div>
                  <div className="absolute top-2 right-2 bg-[#00E5FF]/20 backdrop-blur-sm border border-[#00E5FF]/30 px-2 py-1 rounded-lg text-xs text-[#00E5FF] font-medium">
                    {item.type === 'movie' ? 'Filme' : 'Série'}
                  </div>
                </div>
                <h3 className="mt-3 text-sm font-medium line-clamp-2 group-hover:text-[#00E5FF] transition-colors">{item.title}</h3>
                {item.year && <p className="text-gray-400 text-xs mt-1">{item.year}</p>}
                {(item.category || item.genero) && (
                  <p className="text-[#00E5FF]/70 text-xs mt-1 line-clamp-1">{item.category || item.genero}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
