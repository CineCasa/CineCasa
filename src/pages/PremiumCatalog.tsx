import React from 'react';
import PremiumHeroBanner from '@/components/PremiumHeroBanner';
import { useNavigate } from 'react-router-dom';

interface PremiumCatalogProps {
  contentType: 'movies' | 'series';
}

const PremiumCatalog: React.FC<PremiumCatalogProps> = ({ contentType }) => {
  const navigate = useNavigate();
  
  const handleSearch = (query: string) => {
    console.log("Search query:", query);
  };

  const handleHeroPlay = (item: any) => {
    console.log('Play hero content:', item);
    // Navegar para página de detalhes
    const typePath = contentType === 'movies' ? 'cinema' : 'series';
    navigate(`/details/${typePath}/${item.id}`);
  };

  const handleHeroDetails = (item: any) => {
    console.log('Show hero details:', item);
    // Navegar para página de detalhes
    const typePath = contentType === 'movies' ? 'cinema' : 'series';
    navigate(`/details/${typePath}/${item.id}`);
  };

  return (
    <div className="streaming-container min-h-screen bg-black">
      {/* Hero Banner com trailers aleatórios */}
      <PremiumHeroBanner
        contentType={contentType}
        onPlay={handleHeroPlay}
        onDetails={handleHeroDetails}
      />
    </div>
  );
};

export default PremiumCatalog;
