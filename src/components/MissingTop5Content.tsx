import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTop5Streamings } from "@/hooks/useTop5Streamings";
import { PLATFORM_NAMES, PLATFORM_COLORS, StreamingPlatform } from "@/types/top5";
import { AlertCircle, Film, Tv, ExternalLink } from "lucide-react";

const MissingTop5Content = () => {
  const { missing, isLoading, refresh } = useTop5Streamings();
  const [selectedPlatform, setSelectedPlatform] = useState<StreamingPlatform | 'all'>('all');

  const filteredMissing = selectedPlatform === 'all' 
    ? missing 
    : missing.filter(item => item.platform === selectedPlatform);

  const platforms: StreamingPlatform[] = ['netflix', 'disneyplus', 'globoplay', 'hbomax', 'primevideo'];

  if (isLoading) {
    return (
      <div className="bg-[#151515] rounded-xl border border-white/5 p-8">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#151515] rounded-xl border border-white/5 overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 border-b border-white/5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <AlertCircle className="text-amber-500" size={24} />
              Conteúdos Faltantes - Top 5 Streamings
            </h2>
            <p className="text-white/40 text-sm mt-1">
              Itens que aparecem no ranking dos streamings mas não estão no banco de dados
            </p>
          </div>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg transition-colors text-sm font-bold"
          >
            Atualizar Lista
          </button>
        </div>

        {/* Filtros por plataforma */}
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={() => setSelectedPlatform('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
              selectedPlatform === 'all' 
                ? 'bg-white text-black' 
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            Todas ({missing.length})
          </button>
          {platforms.map(platform => {
            const count = missing.filter(item => item.platform === platform).length;
            return (
              <button
                key={platform}
                onClick={() => setSelectedPlatform(platform)}
                className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${
                  selectedPlatform === platform 
                    ? 'text-white' 
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
                style={{
                  backgroundColor: selectedPlatform === platform ? PLATFORM_COLORS[platform] : undefined
                }}
              >
                {PLATFORM_NAMES[platform]} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista de conteúdos faltantes */}
      <div className="p-6">
        {filteredMissing.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-white/40">
              {selectedPlatform === 'all' 
                ? 'Todos os conteúdos do Top 5 estão disponíveis no banco! 🎉'
                : `Nenhum conteúdo faltante para ${PLATFORM_NAMES[selectedPlatform]}`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredMissing.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/5 rounded-lg overflow-hidden border border-white/10 hover:border-accent/50 transition-colors"
              >
                {/* Capa */}
                <div className="aspect-[2/3] relative bg-black/50">
                  {item.poster ? (
                    <img
                      src={item.poster}
                      alt={item.title}
                      className="w-full h-full object-cover opacity-60"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {item.type === 'movie' ? (
                        <Film className="text-white/20" size={48} />
                      ) : (
                        <Tv className="text-white/20" size={48} />
                      )}
                    </div>
                  )}
                  
                  {/* Badge de plataforma */}
                  <div 
                    className="absolute top-2 left-2 px-2 py-1 rounded text-xs font-bold text-white"
                    style={{ backgroundColor: PLATFORM_COLORS[item.platform] }}
                  >
                    {PLATFORM_NAMES[item.platform]} #{item.platformRank}
                  </div>

                  {/* Badge "Em Breve" */}
                  <div className="absolute top-2 right-2 px-2 py-1 bg-amber-500/90 rounded text-xs font-bold text-black">
                    EM BREVE
                  </div>

                  {/* Tipo */}
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 rounded text-xs text-white/80 flex items-center gap-1">
                    {item.type === 'movie' ? <Film size={12} /> : <Tv size={12} />}
                    {item.type === 'movie' ? 'Filme' : 'Série'}
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-bold text-white mb-2 line-clamp-2">{item.title}</h3>
                  <p className="text-white/40 text-xs mb-3">
                    Solicitado em: {new Date(item.requestedAt).toLocaleDateString('pt-BR')}
                  </p>
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(item.title + ' ' + PLATFORM_NAMES[item.platform])}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white/60 hover:text-white transition-colors"
                  >
                    <ExternalLink size={14} />
                    Buscar Informações
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Resumo */}
      {missing.length > 0 && (
        <div className="px-6 py-4 border-t border-white/5 bg-white/5">
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="text-white/60">
              Total faltante: <strong className="text-white">{missing.length}</strong>
            </span>
            <span className="text-white/60">
              Filmes: <strong className="text-white">{missing.filter(i => i.type === 'movie').length}</strong>
            </span>
            <span className="text-white/60">
              Séries: <strong className="text-white">{missing.filter(i => i.type === 'series').length}</strong>
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default MissingTop5Content;
