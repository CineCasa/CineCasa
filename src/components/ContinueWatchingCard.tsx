import React from 'react';
import { motion } from 'framer-motion';
import { Play, Plus, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ContentItem } from '@/data/content';

interface ContinueWatchingCardProps {
  item: ContentItem;
  progress?: number; // percentual de 0-100
  onPlay: () => void;
  onAddToList: () => void;
  onMoreInfo: () => void;
}

const ContinueWatchingCard: React.FC<ContinueWatchingCardProps> = ({
  item,
  progress = 0,
  onPlay,
  onAddToList,
  onMoreInfo
}) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    const typePath = item.id.includes('series') ? 'series' : 'cinema';
    navigate(`/details/${typePath}/${item.tmdbId || item.id}`);
  };
  return (
    <motion.div
      className="relative cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="relative w-[200px] h-[112px] md:w-[240px] md:h-[135px] overflow-hidden rounded-lg">
        {/* Imagem de fundo */}
        <img
          src={item.image || item.poster || ''}
          alt={item.title}
          className="w-full h-full object-cover cursor-pointer"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = `https://via.placeholder.com/240x135?text=${encodeURIComponent(item.title)}`;
          }}
        />
        
        {/* Barra de progresso */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
          <div 
            className="h-full bg-[#00A8E1] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Percentual de exibição */}
        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          {progress}%
        </div>
      </div>
    </motion.div>
  );
};

export default ContinueWatchingCard;
