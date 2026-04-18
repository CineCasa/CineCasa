import PremiumHeroBanner from "@/components/PremiumHeroBanner";
import { MobileNetflixHero } from "@/components/MobileNetflixHero";
import ContentRow from "@/components/ContentRow";
import ContinueWatchingRow from '../components/ContinueWatchingRow';
import { useSupabaseContent } from "@/hooks/useSupabaseContent";
const seriesHeroContent = {
  title: "SÉRIES",
  description: "Descubra séries incríveis para maratonar. Desde dramas intensos até comédias divertidas, encontre sua próxima obsessão.",
  backdrop: "https://images.unsplash.com/photo-1522869635100-9f4c5e86d37b?q=80&w=1920&auto=format&fit=crop",
  year: "2024",
  rating: "8.7",
};

const Series = () => {
  const { data: categories, isLoading } = useSupabaseContent();

  // Filtrar apenas categorias de séries e ordenar alfabeticamente
  const seriesCategories = categories
    ?.filter(cat => cat.id.startsWith("series-"))
    .sort((a, b) => a.title.localeCompare(b.title, 'pt-BR')) || [];

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Banner - Mobile/Desktop */}
      {/* Mobile Banner - hidden on desktop */}
      <div className="md:hidden">
        <MobileNetflixHero contentType="series" />
      </div>
      {/* Desktop Banner - hidden on mobile */}
      <div className="hidden md:block pt-[94px]">
        <PremiumHeroBanner contentType="series" />
      </div>
      
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
                layout="scroll"
                infiniteScroll={true}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default Series;
