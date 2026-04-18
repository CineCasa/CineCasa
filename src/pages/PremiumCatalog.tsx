import React from 'react';
import PremiumHeroBanner from '@/components/PremiumHeroBanner';
import { MobileNetflixHero } from '@/components/MobileNetflixHero';
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
      {/* Hero Banner - Mobile/Desktop */}
      {/* Mobile Banner - hidden on desktop */}
      <div className="md:hidden">
        <MobileNetflixHero contentType={contentType} />
      </div>
      {/* Desktop Banner - hidden on mobile */}
      <div className="hidden md:block">
        <PremiumHeroBanner
          contentType={contentType}
          onPlay={handleHeroPlay}
          onDetails={handleHeroDetails}
        />
      </div>
    </div>
  );
};

export default PremiumCatalog;
