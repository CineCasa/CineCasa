import { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, Info, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBecauseYouWatched } from '@/hooks/useBecauseYouWatched';

export function BecauseYouWatchedRow() {
  const { recommendations, loading, error } = useBecauseYouWatched();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400;
      const newScrollLeft = direction === 'left' 
        ? scrollContainerRef.current.scrollLeft - scrollAmount
        : scrollContainerRef.current.scrollLeft + scrollAmount;
      
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  const handleCardClick = (item: any, sourceType: 'movie' | 'series') => {
    const type = sourceType === 'movie' ? 'cinema' : 'series';
    navigate(`/details/${type}/${item.id}`);
  };

  if (loading) {
    return (
      <div className="px-4 md:px-12 py-6">
        <div className="h-8 w-64 bg-white/10 rounded animate-pulse mb-4" />
        <div className="flex gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-48 h-72 bg-white/10 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || recommendations.length === 0) {
    return null; // Não renderiza se não houver dados
  }

  return (
    <>
      {recommendations.map((section, sectionIndex) => (
        <section key={section.sourceItem.content_id} className="py-6">
          {/* Título da Seção */}
          <div className="px-4 md:px-12 mb-4">
            <h2 className="text-xl md:text-2xl font-bold text-white">
              Porque você assistiu <span className="text-red-600">{section.sourceItem.title}</span>
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Recomendações baseadas no seu histórico
            </p>
          </div>

          {/* Container de Cards */}
          <div className="relative group">
            {/* Botão Scroll Esquerda */}
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-0 bottom-0 w-16 z-10 bg-gradient-to-r from-[#141414] to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              <ChevronLeft className="w-8 h-8 text-white" />
            </button>

            {/* Botão Scroll Direita */}
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-0 bottom-0 w-16 z-10 bg-gradient-to-l from-[#141414] to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              <ChevronRight className="w-8 h-8 text-white" />
            </button>

            {/* Cards */}
            <div
              ref={scrollContainerRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide px-4 md:px-12 pb-4"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {section.recommendations.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex-shrink-0 w-48 md:w-56 group/card cursor-pointer"
                  onClick={() => handleCardClick(item, section.sourceItem.content_type)}
                >
                  {/* Card */}
                  <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800">
                    {/* Poster */}
                    <img
                      src={item.poster || '/placeholder-poster.jpg'}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover/card:scale-110"
                    />

                    {/* Overlay no Hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                      {/* Ações */}
                      <div className="flex gap-2 mb-2">
                        <button
                          className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:scale-110 transition-transform"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Ação de play
                          }}
                        >
                          <Play className="w-5 h-5 text-black fill-black" />
                        </button>
                        <button
                          className="w-10 h-10 rounded-full border-2 border-white/50 flex items-center justify-center hover:border-white transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCardClick(item, section.sourceItem.content_type);
                          }}
                        >
                          <Info className="w-5 h-5 text-white" />
                        </button>
                      </div>

                      {/* Info */}
                      <div className="space-y-1">
                        <h3 className="font-bold text-white line-clamp-1">{item.title}</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-300">
                          <span className="text-green-400 font-semibold">
                            {item.matchScore >= 0.7 ? '98%' : item.matchScore >= 0.4 ? '85%' : '70%'} Match
                          </span>
                          {item.year && <span>{item.year}</span>}
                          <span className="border border-white/30 px-1 rounded">HD</span>
                        </div>
                        <p className="text-xs text-gray-400 line-clamp-2 mt-1">
                          {item.genero?.split(',').slice(0, 3).join(' • ')}
                        </p>
                      </div>
                    </div>

                    {/* Badge de Match */}
                    {item.matchScore >= 0.7 && (
                      <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                        TOP MATCH
                      </div>
                    )}
                  </div>

                  {/* Título abaixo do card */}
                  <h3 className="mt-2 text-sm font-medium text-gray-300 group-hover/card:text-white transition-colors line-clamp-1">
                    {item.title}
                  </h3>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      ))}
    </>
  );
}

export default BecauseYouWatchedRow;
