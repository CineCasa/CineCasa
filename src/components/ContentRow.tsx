import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Category } from "@/data/content";
import ContentCard from "./ContentCard";

interface ContentRowProps {
  category: Category;
  showProgress?: boolean;
}

const ContentRow = ({ category, showProgress = false }: ContentRowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
  }, [category.items]);

  const scroll = (dir: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
    setTimeout(checkScroll, 400);
  };

  return (
    <section className="row-wrapper">
      <h2 className="row-title">
        {category.title}
      </h2>

      <div className="relative isolate">
        {/* Left arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll(-1)}
            className="absolute left-0 top-0 bottom-0 w-12 md:w-16 z-[70] flex items-center justify-center bg-black/60 hover:bg-black/80 opacity-0 group-hover/row:opacity-100 transition-opacity"
          >
            <ChevronLeft size={40} className="text-white" />
          </button>
        )}

        {/* Scrollable row */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="row-scroll-container"
        >
          {category.items.map((item, idx) => (
            <ContentCard 
              key={`${item.id}-${idx}`} 
              item={item} 
              index={idx} 
              isLast={idx === category.items.length - 1} 
              showProgress={showProgress}
            />
          ))}
        </div>

        {/* Right arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll(1)}
            className="absolute right-0 top-0 bottom-0 w-12 md:w-16 z-[70] flex items-center justify-center bg-black/60 hover:bg-black/80 opacity-0 group-hover/row:opacity-100 transition-opacity"
          >
            <ChevronRight size={40} className="text-white" />
          </button>
        )}
      </div>
    </section>
  );
};

export default ContentRow;
