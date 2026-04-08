import PremiumNavbar from "@/components/PremiumNavbar";
import HeroBanner from "@/components/HeroBanner";
import ContentCard from "@/components/ContentCard";
import { useSupabaseContent } from "@/hooks/useSupabaseContent";

const FilmesKids = () => {
  const { data: categories, isLoading } = useSupabaseContent();

  const kidsMovies = categories?.filter(cat => cat.id === "kids-movies") || [];

  return (
    <div className="min-h-screen bg-background">
      <PremiumNavbar />
      <main className="pb-20">
        <HeroBanner filterCategory="Filmes Infantis" />
        <div className="relative z-10 pt-16 -mt-10 px-4 md:px-8 lg:px-12">
          <h2 className="text-3xl font-black text-white mb-10 tracking-tight uppercase">Filmes Infantis</h2>
          
          {isLoading ? (
            <div className="flex items-center justify-center p-20 text-muted-foreground">
              Carregando filmes para a criançada...
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-24 py-10">
              {kidsMovies.flatMap(cat => cat.items).map((item, idx) => (
                <div key={`${item.id}-${idx}`} className="relative">
                  <ContentCard item={item} index={idx} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default FilmesKids;
