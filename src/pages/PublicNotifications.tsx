import React from 'react';

import { useNovidades } from '@/hooks/useNovidades';
import ContentCarousel from '@/components/ContentCarousel';
import { useNavigate } from 'react-router-dom';

export default function PublicNotifications() {
  const { novidades, isLoading } = useNovidades();
  const navigate = useNavigate();

  const handleCardClick = (item: any) => {
    const typePath = item.type === 'movie' ? 'cinema' : 'series';
    const id = item.id;
    navigate(`/details/${typePath}/${id}`);
  };

  // Sistema para evitar duplicatas
  const filterUniqueItems = (items: any[], limit: number = 5) => {
    const usedIds = new Set<string>();
    const unique = items.filter(item => {
      const id = item.id;
      if (usedIds.has(id)) return false;
      usedIds.add(id);
      return true;
    });
    return unique.slice(0, limit);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="px-4 md:px-8 py-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Novidades 🆕</h1>
        <p className="text-gray-400 text-lg">Confira os lançamentos mais recentes de 2025 e 2026</p>
      </div>

      {/* Conteúdo */}
      <div className="px-4 md:px-8 pb-8">
        {isLoading ? (
          <div className="py-8">
            <div className="h-8 w-48 bg-gray-800 rounded animate-pulse mb-4"></div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {[1,2,3,4,5,6,7,8,9,10].map(i => (
                <div key={i} className="aspect-[2/3] bg-gray-800 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        ) : novidades.length > 0 ? (
          <ContentCarousel
            title=""
            items={filterUniqueItems(novidades)}
            onCardClick={handleCardClick}
          />
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg">Nenhuma novidade encontrada no momento.</p>
            <p className="text-gray-500 mt-2">Volte em breve para conferir novos lançamentos!</p>
          </div>
        )}
      </div>
    </div>
  );
}
