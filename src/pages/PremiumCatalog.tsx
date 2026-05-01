import React from 'react';
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
      {/* Catálogo de conteúdo */}
      <div className="p-8 text-white">
        <h1 className="text-2xl font-bold mb-4">Catálogo</h1>
        <p>Conteúdo {contentType === 'movies' ? 'de Filmes' : 'de Séries'}</p>
      </div>
    </div>
  );
};

export default PremiumCatalog;
