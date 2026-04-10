import PremiumNavbar from "@/components/PremiumNavbar";
import PremiumHeroBanner from "@/components/PremiumHeroBanner";
import ContentRow from "@/components/ContentRow";
import ContinueWatchingRow from '../components/ContinueWatchingRow';
import { useSupabaseContent } from "@/hooks/useSupabaseContent";
import { useEffect, useState } from "react";

const seriesHeroContent = {
  title: "SÉRIES",
  description: "Descubra séries incríveis para maratonar. Desde dramas intensos até comédias divertidas, encontre sua próxima obsessão.",
  backdrop: "https://images.unsplash.com/photo-1522869635100-9f4c5e86d37b?q=80&w=1920&auto=format&fit=crop",
  year: "2024",
  rating: "8.7",
};

const Series = () => {
  const { data: categories, isLoading } = useSupabaseContent();
  const [isMobile, setIsMobile] = useState(false);

  // Detectar dispositivo móvel
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Filtrar apenas categorias de séries e ordenar alfabeticamente
  const seriesCategories = categories
    ?.filter(cat => cat.id.startsWith("series-"))
    .sort((a, b) => a.title.localeCompare(b.title, 'pt-BR')) || [];

  const handleHeroPlay = () => {
    console.log('Play series hero');
  };

  return (
    <div className="min-h-screen bg-black pt-[94px]">
      <PremiumNavbar />
      
      {/* Hero Banner - Igual da Home */}
      <PremiumHeroBanner
        {...seriesHeroContent}
        onPlay={handleHeroPlay}
      />
      
      <main className="pb-20 mt-[70px] relative z-10 bg-black">
        <div className="relative z-10 pt-16 -mt-10 bg-black">
          {/* Continue Watching Row */}
          <ContinueWatchingRow />
          
          {isLoading ? (
            <div className="flex items-center justify-center p-20 text-muted-foreground">
              Carregando séries...
            </div>
          ) : (
            seriesCategories.map((cat) => (
              <ContentRow 
                key={cat.id} 
                category={cat} 
                maxItems={20}
                layout={isMobile ? "scroll" : "grid"}
                infiniteScroll={isMobile}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default Series;
