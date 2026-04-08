import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Plus, Info, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ContentItem } from '@/data/content';

interface HomeContentCardProps {
  content: ContentItem;
  onPlay: () => void;
  onAddToList: () => void;
  onMoreInfo: () => void;
}

const HomeContentCard: React.FC<HomeContentCardProps> = ({
  content,
  onPlay,
  onAddToList,
  onMoreInfo
}) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  const handleCardClick = () => {
    const typePath = content.id.includes('series') ? 'series' : 'cinema';
    navigate(`/details/${typePath}/${content.tmdbId || content.id}`);
  };

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    
    // Salvar no localStorage
    try {
      const favs = JSON.parse(localStorage.getItem("paixaofavs") || "[]");
      if (isFavorite) {
        const newFavs = favs.filter((f: any) => f.id !== content.id);
        localStorage.setItem("paixaofavs", JSON.stringify(newFavs));
      } else {
        favs.push(content);
        localStorage.setItem("paixaofavs", JSON.stringify(favs));
      }
    } catch (e) {
      console.error("Error saving favorites:", e);
    }
  };

  return (
    <motion.div
      className="relative group cursor-pointer"
      whileHover={{ scale: 1.05, zIndex: 10 }}
      transition={{ duration: 0.2 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      <div className="relative w-[200px] md:w-[240px] overflow-hidden rounded-lg">
        {/* Imagem da capa */}
        <img
          src={content.image}
          alt={content.title}
          className="w-full h-[300px] md:h-[360px] object-cover cursor-pointer"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = `https://via.placeholder.com/240x360?text=${encodeURIComponent(content.title)}`;
          }}
        />
        
        {/* Overlay gradiente no hover */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />
        
        {/* Botões de ação no hover */}
        <div className={`absolute bottom-0 left-0 right-0 p-4 transition-transform duration-300 ${isHovered ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="flex items-center gap-2">
          <div className="flex flex-wrap gap-1 mb-3">
            {content.genre.slice(0, 2).map((g, i) => (
              <span key={i} className="bg-white/20 text-white text-xs px-2 py-1 rounded">
                {g}
              </span>
            ))}
          </div>
          
          {/* Botões de ação */}
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPlay();
              }}
              className="bg-white hover:bg-white/90 text-black rounded-full p-2 transition-colors flex items-center justify-center"
            >
              <Play className="w-4 h-4" fill="black" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToList();
              }}
              className="bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors flex items-center justify-center"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={toggleFavorite}
              className="bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors flex items-center justify-center"
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoreInfo();
              }}
              className="bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors flex items-center justify-center"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Badge de qualidade ou tipo */}
        {content.type === 'series' && (
          <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
            SÉRIE
          </div>
        )}
        
        {/* Badge de lançamento */}
        {content.year >= 2025 && (
          <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
            LANÇAMENTO
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default HomeContentCard;
