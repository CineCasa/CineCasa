import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Plus, ThumbsUp, ChevronDown, Volume2, VolumeX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ContentItem {
  id: string;
  title: string;
  poster: string;
  backdrop?: string;
  trailer?: string;
  type: 'movie' | 'series';
  year?: number;
  rating?: number;
  duration?: string;
  genre?: string;
  description?: string;
  matchScore?: number;
}

interface HoverCardProps {
  item: ContentItem;
  index?: number;
  onHover?: (item: ContentItem | null) => void;
}

export function HoverCard({ item, index = 0, onHover }: HoverCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(true);
      onHover?.(item);
      
      // Start playing video after a short delay
      if (item.trailer) {
        setTimeout(() => {
          setIsPlaying(true);
          setVideoLoaded(true);
        }, 500);
      }
    }, 300);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    
    setIsHovered(false);
    setIsExpanded(false);
    setIsPlaying(false);
    setVideoLoaded(false);
    onHover?.(null);
    
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const handleClick = () => {
    const type = item.type === 'movie' ? 'cinema' : 'series';
    navigate(`/details/${type}/${item.id}`);
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const type = item.type === 'movie' ? 'cinema' : 'series';
    navigate(`/watch/${type}/${item.id}`);
  };

  // Get match score color
  const getMatchColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 80) return 'text-yellow-400';
    return 'text-gray-400';
  };

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ zIndex: isHovered ? 50 : 1 }}
    >
      {/* Normal Card */}
      <div 
        className="relative aspect-[2/3] rounded-md overflow-hidden cursor-pointer transition-all duration-300"
        onClick={handleClick}
      >
        {/* Poster Image */}
        <img
          src={item.poster}
          alt={item.title}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isPlaying && videoLoaded ? 'opacity-0' : 'opacity-100'
          }`}
        />

      </div>
    </div>
  );
}

// Hook to manage hover state across multiple cards
export function useHoverPreview() {
  const [hoveredItem, setHoveredItem] = useState<ContentItem | null>(null);
  const [isAnyHovered, setIsAnyHovered] = useState(false);

  const handleHover = (item: ContentItem | null) => {
    setHoveredItem(item);
    setIsAnyHovered(!!item);
  };

  return { hoveredItem, isAnyHovered, handleHover };
}

export default HoverCard;
