import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Category } from "@/data/content";
import ContentCard from "./ContentCard";

interface ContentRowProps {
  category: Category;
  showProgress?: boolean;
  infiniteScroll?: boolean;
  maxItems?: number;
  layout?: 'scroll' | 'grid';
}

const ContentRow = ({ category, showProgress = false, infiniteScroll = false, maxItems = 5, layout = 'scroll' }: ContentRowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Limitar a 5 itens
  const limitedItems = category.items.slice(0, maxItems);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < maxScroll - 10);
  };

  // Efeito de rolagem infinita automática apenas em mobile
  useEffect(() => {
    if (!infiniteScroll || !scrollRef.current) return;

    // Detectar se é mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
    if (!isMobile) return; // Não ativar em desktop

    const el = scrollRef.current;
    let autoScrollInterval: NodeJS.Timeout;

    const startAutoScroll = () => {
      autoScrollInterval = setInterval(() => {
        const cardWidth = el.scrollWidth / limitedItems.length;
        const containerWidth = el.clientWidth;
        const cardsPerView = Math.floor(containerWidth / cardWidth) || 1;
        
        let newIndex = currentIndex + cardsPerView;

        // Quando chegar no final, volta para o início sem passar pelas anteriores
        if (newIndex >= limitedItems.length) {
          el.scrollTo({ left: 0, behavior: 'smooth' });
          setCurrentIndex(0);
          return;
        }

        const scrollAmount = newIndex * cardWidth;
        el.scrollTo({ left: scrollAmount, behavior: 'smooth' });
        setCurrentIndex(newIndex);
      }, 3000); // Roda a cada 3 segundos
    };

    const stopAutoScroll = () => {
      clearInterval(autoScrollInterval);
    };

    // NÃO iniciar auto-scroll automaticamente em mobile - apenas após interação do usuário
    // Isso evita conflito com o scroll manual do usuário
    let hasUserInteracted = false;
    
    const handleFirstInteraction = () => {
      if (!hasUserInteracted) {
        hasUserInteracted = true;
        // Iniciar auto-scroll após primeira interação
        startAutoScroll();
      }
    };

    // Iniciar auto-scroll após primeira interação do usuário
    el.addEventListener('touchstart', handleFirstInteraction, { once: true });
    el.addEventListener('mousedown', handleFirstInteraction, { once: true });
    
    // Parar auto-scroll quando usuário interage ativamente
    el.addEventListener('touchstart', stopAutoScroll);
    el.addEventListener('mousedown', stopAutoScroll);

    // Retomar após 5 segundos sem interação (apenas em mobile)
    const resumeTimeout = setTimeout(startAutoScroll, 5000);

    return () => {
      clearInterval(autoScrollInterval);
      clearTimeout(resumeTimeout);
      el.removeEventListener('touchstart', stopAutoScroll);
      el.removeEventListener('mousedown', stopAutoScroll);
    };
  }, [infiniteScroll, limitedItems.length, currentIndex]);

  const scroll = (dir: number) => {
    const el = scrollRef.current;
    if (!el) return;

    const cardWidth = el.scrollWidth / limitedItems.length;
    const containerWidth = el.clientWidth;
    const cardsPerView = Math.floor(containerWidth / cardWidth) || 5;
    
    let newIndex = currentIndex + (dir * cardsPerView);

    // Detectar se é mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;

    // Rolagem infinita: quando chegar no final, volta para o início
    if (infiniteScroll) {
      if (newIndex >= limitedItems.length) {
        newIndex = 0;
        el.scrollTo({ left: 0, behavior: 'smooth' });
        setCurrentIndex(0);
        setTimeout(checkScroll, 400);
        return;
      }
      if (newIndex < 0) {
        newIndex = Math.max(0, limitedItems.length - cardsPerView);
        const maxScroll = el.scrollWidth - el.clientWidth;
        el.scrollTo({ left: maxScroll, behavior: 'smooth' });
        setCurrentIndex(newIndex);
        setTimeout(checkScroll, 400);
        return;
      }
    } else {
      // Limitar aos bounds
      newIndex = Math.max(0, Math.min(newIndex, limitedItems.length - cardsPerView));
    }

    const scrollAmount = newIndex * cardWidth;
    el.scrollTo({ left: scrollAmount, behavior: 'smooth' });
    setCurrentIndex(newIndex);
    setTimeout(checkScroll, 400);
  };

  // Detectar se é mobile para controle de setas
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;

  // Suporte a mouse wheel para rolagem horizontal
  const handleWheel = (e: React.WheelEvent) => {
    if (!scrollRef.current) return;
    
    // Prevenir scroll vertical padrão
    e.preventDefault();
    
    const el = scrollRef.current;
    const scrollAmount = e.deltaY > 0 ? 300 : -300;
    
    el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  return (
    <section className="row-wrapper py-6 px-4 md:px-8 lg:px-12">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="section-title text-xl md:text-2xl tracking-wider">
          {category.title.toUpperCase()}
        </h2>
        <div className="flex-1 h-px bg-gradient-to-r from-[#00E5FF]/30 to-transparent" />
      </div>

      {layout === 'grid' ? (
        // Layout em grid: 5 capas por linha
        <div className="px-4 lg:px-12">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {limitedItems.map((item, idx) => (
              <div key={`${item.id}-${idx}`}>
                <ContentCard 
                  item={item} 
                  index={idx} 
                  isLast={idx === limitedItems.length - 1} 
                  showProgress={showProgress}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        // Layout scroll horizontal (original) - sem setas em mobile com infinite scroll
        <div className="relative isolate group/row">
          {/* Left arrow - apenas quando não é infinite scroll ou quando é desktop */}
          {canScrollLeft && (!infiniteScroll || !isMobile) && (
            <button
              onClick={() => scroll(-1)}
              className="absolute left-0 top-0 bottom-0 w-12 md:w-16 z-[70] flex items-center justify-center bg-black/60 hover:bg-black/80 opacity-0 group-hover/row:opacity-100 transition-opacity"
            >
              <ChevronLeft size={40} className="text-white" />
            </button>
          )}

          {/* Scrollable row com rolagem horizontal estilo Netflix */}
          <div
            ref={scrollRef}
            onScroll={checkScroll}
            onWheel={handleWheel}
            className="row-scroll-container snap-x snap-mandatory overflow-x-auto overflow-y-hidden flex flex-row flex-nowrap gap-5 pb-3 cursor-grab active:cursor-grabbing"
            style={{
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-x',
              scrollBehavior: 'smooth',
              scrollbarWidth: 'thin',
              scrollbarColor: '#00E5FF transparent'
            }}
          >
            {/* Estilização da scrollbar neon/ciano */}
            <style>{`
              .row-scroll-container::-webkit-scrollbar {
                height: 4px;
              }
              .row-scroll-container::-webkit-scrollbar-track {
                background: transparent;
              }
              .row-scroll-container::-webkit-scrollbar-thumb {
                background: rgba(0, 229, 255, 0.3);
                border-radius: 10px;
              }
              .row-scroll-container::-webkit-scrollbar-thumb:hover {
                background: rgba(0, 229, 255, 0.6);
              }
            `}</style>
            {limitedItems.map((item, idx) => (
              <div key={`${item.id}-${idx}`} className="snap-start flex-shrink-0" style={{ flex: '0 0 auto' }}>
                <ContentCard 
                  item={item} 
                  index={idx} 
                  isLast={idx === limitedItems.length - 1} 
                  showProgress={showProgress}
                />
              </div>
            ))}
          </div>

          {/* Right arrow - apenas quando não é infinite scroll ou quando é desktop */}
          {canScrollRight && (!infiniteScroll || !isMobile) && (
            <button
              onClick={() => scroll(1)}
              className="absolute right-0 top-0 bottom-0 w-12 md:w-16 z-[70] flex items-center justify-center bg-black/60 hover:bg-black/80 opacity-0 group-hover/row:opacity-100 transition-opacity"
            >
              <ChevronRight size={40} className="text-white" />
            </button>
          )}
        </div>
      )}
    </section>
  );
};

export default ContentRow;
