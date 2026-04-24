import HeroBanner from "@/components/HeroBanner";
import ContentRow from "@/components/ContentRow";
import { CinemaHeroBanner } from "@/components/CinemaHeroBanner";
import { useSupabaseContent } from "@/hooks/useSupabaseContent";

const Cinema = () => {
  const { data: categories, isLoading } = useSupabaseContent();

  // Filtra apenas categorias que começam com "cinema-" (definido no hook)
  // As categorias agora seguem o padrão centralizado do hook
  const cinemaCategories = categories?.filter(cat => cat.id.startsWith("cinema-")) || [];

  return (
    <main className="min-h-screen bg-background pb-20">
        {/* CinemaHeroBanner para telas grandes (TV/4K) */}
        <CinemaHeroBanner />
        
        {/* HeroBanner padrão para mobile */}
        <div className="lg:hidden">
          <HeroBanner filterCategory="Cinema" />
        </div>
        
        <div className="relative pt-16 -mt-10 pointer-events-none lg:pt-0 lg:mt-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-20 text-muted-foreground">
              Carregando produções de cinema...
            </div>
          ) : (
            cinemaCategories.map((cat) => (
              <div key={cat.id} className="pointer-events-auto">
                <ContentRow category={cat} />
              </div>
            ))
          )}
        </div>
      </main>
  );
};

export default Cinema;
