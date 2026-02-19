import { Play, Plus, ThumbsUp } from "lucide-react";
import { ContentItem } from "@/data/content";
import { motion } from "framer-motion";

interface ContentCardProps {
  item: ContentItem;
}

const ContentCard = ({ item }: ContentCardProps) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
      className="group relative flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px] lg:w-[200px] cursor-pointer"
    >
      <div className="relative aspect-[2/3] rounded-md overflow-hidden bg-secondary">
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-3">
          <button className="p-3 rounded-full bg-primary text-primary-foreground hover:bg-primary/80 transition-colors">
            <Play size={20} fill="currentColor" />
          </button>
          <div className="flex gap-2">
            <button className="p-2 rounded-full bg-secondary/80 text-secondary-foreground hover:bg-secondary transition-colors">
              <Plus size={16} />
            </button>
            <button className="p-2 rounded-full bg-secondary/80 text-secondary-foreground hover:bg-secondary transition-colors">
              <ThumbsUp size={16} />
            </button>
          </div>
        </div>
      </div>
      <div className="mt-2 px-0.5">
        <h3 className="text-xs sm:text-sm font-medium text-foreground truncate">
          {item.title}
        </h3>
        <p className="text-[10px] sm:text-xs text-muted-foreground">
          {item.year} • {item.rating}
        </p>
      </div>
    </motion.div>
  );
};

export default ContentCard;
