import { useState, useEffect } from "react";
import { Play, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { heroItems } from "@/data/content";
import { motion, AnimatePresence } from "framer-motion";

const HeroBanner = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % heroItems.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const hero = heroItems[current];
  const goTo = (dir: number) =>
    setCurrent((prev) => (prev + dir + heroItems.length) % heroItems.length);

  return (
    <section className="relative w-full h-[60vh] sm:h-[70vh] md:h-[80vh] lg:h-[85vh] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={hero.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          <img
            src={hero.image}
            alt={hero.title}
            className="w-full h-full object-cover object-top"
            loading="eager"
          />
        </motion.div>
      </AnimatePresence>

      {/* Gradients */}
      <div className="absolute inset-0 gradient-hero-bottom" />
      <div className="absolute inset-0 gradient-hero-left" />

      {/* Content */}
      <div className="absolute bottom-[15%] sm:bottom-[20%] left-0 px-4 md:px-8 lg:px-12 max-w-2xl z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={hero.id + "-content"}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-2">
              {hero.genre} • {hero.year} • {hero.rating}
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-foreground mb-3 leading-tight">
              {hero.title}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 line-clamp-2 md:line-clamp-3">
              {hero.description}
            </p>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 sm:px-7 py-2.5 sm:py-3 rounded-md font-semibold text-sm sm:text-base transition-colors">
                <Play size={18} fill="currentColor" /> Assistir
              </button>
              <button className="flex items-center gap-2 bg-secondary/80 hover:bg-secondary text-secondary-foreground px-5 sm:px-7 py-2.5 sm:py-3 rounded-md font-semibold text-sm sm:text-base transition-colors backdrop-blur-sm">
                <Info size={18} /> Detalhes
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation arrows */}
      <button
        onClick={() => goTo(-1)}
        className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/40 hover:bg-background/70 text-foreground transition-colors z-10"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={() => goTo(1)}
        className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/40 hover:bg-background/70 text-foreground transition-colors z-10"
      >
        <ChevronRight size={24} />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {heroItems.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1 rounded-full transition-all duration-300 ${
              i === current ? "w-8 bg-primary" : "w-4 bg-muted-foreground/40"
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroBanner;
