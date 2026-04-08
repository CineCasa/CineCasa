import { useNavigate } from 'react-router-dom';
import PremiumNavbar from '@/components/PremiumNavbar';
import PremiumHeroBanner from '@/components/PremiumHeroBanner';

const FilmesESeries = () => {
  const navigate = useNavigate();

  const handleSearch = (query: string) => {
    console.log('Searching for:', query);
  };

  const handleHeroPlay = () => {
    console.log('Play hero content');
  };

  const handleHeroDetails = () => {
    console.log('Show hero details');
  };

  return (
    <div className="min-h-screen bg-black">
      <PremiumNavbar onSearch={handleSearch} />
      <PremiumHeroBanner
        contentType="movies"
        onPlay={handleHeroPlay}
        onDetails={handleHeroDetails}
      />
    </div>
  );
};

export default FilmesESeries;
