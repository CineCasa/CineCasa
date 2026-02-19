import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Category } from "@/data/content";
import ContentCard from "./ContentCard";

interface ContentRowProps {
  category: Category;
}

const ContentRow = ({ category }: ContentRowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  const scroll = (dir: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
    setTimeout(checkScroll, 400);
  };

  return (
    <section className="relative group/row mb-6 md:mb-8">
      <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground px-4 md:px-8 lg:px-12 mb-3">
        {category.title}
      </h2>

      <div className="relative">
        {/* Left arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll(-1)}
            className="absolute left-0 top-0 bottom-8 w-10 md:w-12 z-10 flex items-center justify-center bg-background/60 hover:bg-background/80 opacity-0 group-hover/row:opacity-100 transition-opacity"
          >
            <ChevronLeft size={28} className="text-foreground" />
          </button>
        )}

        {/* Scrollable row */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide px-4 md:px-8 lg:px-12"
        >
          {category.items.map((item) => (
            <ContentCard key={item.id} item={item} />
          ))}
        </div>

        {/* Right arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll(1)}
            className="absolute right-0 top-0 bottom-8 w-10 md:w-12 z-10 flex items-center justify-center bg-background/60 hover:bg-background/80 opacity-0 group-hover/row:opacity-100 transition-opacity"
          >
            <ChevronRight size={28} className="text-foreground" />
          </button>
        )}
      </div>
    </section>
  );
};

export default ContentRow;
