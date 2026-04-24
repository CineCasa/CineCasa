import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import StreamingCard from '@/components/StreamingCard';
import StreamingModal from '../components/StreamingModal';
import HomeSection from '../components/HomeSection';
import { ContinueWatchingSection } from '../components/ContinueWatchingSection';
import { useDynamicHomeSections } from '../hooks/useDynamicHomeSections';
import { useFavorites } from '../hooks/useFavorites';
import { ContentItem } from '../data/content';
import { HeroBannerTV } from '@/components/HeroBannerTV';

const StreamingHome: React.FC = () => {
  const navigate = useNavigate();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { data: sections, isLoading } = useDynamicHomeSections();

  // Sample data for demonstration
  const heroContent = {
    title: "Stranger Things 4",
    description: "Quando um menino desaparece, a mãe, a polícia e os amigos se unem para encontrá-lo. Logo eles descobrem um mistério envolvendo experimentos secretos, forças sobrenaturais e uma garota muito estranha.",
    backgroundImage: "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=1920&h=1080&fit=crop"
  };

  const handlePlay = (item: ContentItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const { toggleFavorite } = useFavorites();
  
  const handleAddToList = async (item: ContentItem) => {
    const contentType = item.id.includes('series') ? 'series' : 'movie';
    await toggleFavorite({
      content_id: parseInt(item.tmdbId || item.id),
      content_type: contentType,
      titulo: item.title,
      poster: item.image,
      banner: item.image,
      rating: item.rating?.toString(),
      year: item.year?.toString(),
      genero: null
    });
  };

  const handleMoreInfo = (item: ContentItem) => {
    const typePath = item.id.includes('series') ? 'series' : 'cinema';
    navigate(`/details/${typePath}/${item.tmdbId || item.id}`);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    console.log('Searching for:', query);
    // TODO: Implement search functionality
  };

  return (
    <div className="streaming-container min-h-screen bg-black">
      {/* Hero Banner TV - Apenas telas grandes (lg+) */}
      <HeroBannerTV />

      {/* Content Sections */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Continue Watching Section - First */}
        <ContinueWatchingSection />
        
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-[#00A8E1] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white/60">Carregando conteúdo...</p>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {sections?.map((section, index) => (
              <HomeSection
                key={section.id}
                title={section.title}
                items={section.items}
                type={section.type}
                onPlay={handlePlay}
                onAddToList={handleAddToList}
                onMoreInfo={handleMoreInfo}
              />
            ))}
          </motion.div>
        )}
      </div>

      {/* Modal */}
      <StreamingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedItem?.title || ''}
        description={selectedItem?.description || ''}
        image={selectedItem?.image || ''}
        rating={selectedItem?.rating}
        year={selectedItem?.year}
        duration={selectedItem?.duration}
        quality={selectedItem?.quality}
        onPlay={() => console.log('Play:', selectedItem?.title)}
        onAddToList={() => selectedItem && handleAddToList(selectedItem)}
      />
    </div>
  );
};

export default StreamingHome;
