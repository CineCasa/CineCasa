import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, Calendar, Tv } from 'lucide-react';
import { useSeriesData, Serie } from '@/hooks/useSeriesData';
import { tmdbImageUrl } from '@/services/tmdb';

const seriesPageStyles = `
  .series-page-container {
    background-color: #000000 !important;
    min-height: 100vh;
  }
  .series-hero-section {
    position: relative;
    width: 100%;
    height: 85vh;
    min-height: 600px;
    overflow: hidden;
  }
  .series-hero-backdrop {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
  }
  .series-hero-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, #000000 0%, rgba(0,0,0,0.7) 30%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.5) 100%);
  }
  .series-hero-content {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 0 4% 8% 4%;
    z-index: 1;
    pointer-events: auto;
  }
  .series-hero-section {
    pointer-events: none;
  }
  .series-hero-section > * {
    pointer-events: auto;
  }
  .series-category-row {
    margin-bottom: 3rem;
    padding: 0 4%;
  }
  .series-category-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #e5e5e5;
    margin-bottom: 1rem;
    text-transform: capitalize;
  }
  .series-slider-container {
    position: relative;
    display: flex;
    align-items: center;
  }
  .series-slider {
    display: flex;
    gap: 0.5rem;
    overflow-x: auto;
    overflow-y: hidden;
    scroll-behavior: smooth;
    scrollbar-width: none;
    -ms-overflow-style: none;
    padding: 1rem 0;
    width: 100%;
  }
  .series-slider::-webkit-scrollbar {
    display: none;
  }
  .series-card {
    flex-shrink: 0;
    width: 16%;
    min-width: 200px;
    aspect-ratio: 2/3;
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    position: relative;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    background-color: #1a1a1a;
  }
  .series-card:hover {
    transform: scale(1.05);
    box-shadow: 0 0 20px rgba(0, 229, 255, 0.7);
    z-index: 20;
  }
  .series-card-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s ease;
  }
  .series-card:hover .series-card-image {
    transform: scale(1.1);
  }
  .series-slider-button {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 60px;
    background: rgba(0,0,0,0.5);
    border: none;
    cursor: pointer;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  .series-slider-container:hover .series-slider-button {
    opacity: 1;
  }
  .series-slider-button:hover {
    background: rgba(0,0,0,0.8);
  }
  .series-slider-button.left {
    left: 0;
  }
  .series-slider-button.right {
    right: 0;
  }
  @media (max-width: 768px) {
    .series-hero-section {
      height: 70vh;
      min-height: 500px;
    }
    .series-hero-content {
      padding: 0 4% 15% 4%;
    }
    .series-card {
      width: 33%;
      min-width: 140px;
    }
    .series-category-title {
      font-size: 1.1rem;
    }
    .series-slider-button {
      display: none;
    }
  }
  @media (max-width: 480px) {
    .series-card {
      width: 45%;
      min-width: 120px;
    }
  }
`;

interface SeriesCardProps {
  serie: Serie;
  onClick: () => void;
}

function SeriesCard({ serie, onClick }: SeriesCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const imageUrl = serie.capa || serie.banner || serie.poster_tmdb 
    ? tmdbImageUrl(serie.capa || serie.banner || serie.poster_tmdb || '', 'w500')
    : null;

  return (
    <motion.div
      className="series-card"
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.05 }}
    >
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 bg-gray-800 animate-pulse flex items-center justify-center">
          <Tv className="w-8 h-8 text-gray-600" />
        </div>
      )}
      {imageUrl && !imageError ? (
        <img
          src={imageUrl}
          alt={serie.titulo}
          className="series-card-image"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          style={{ opacity: imageLoaded ? 1 : 0 }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex flex-col items-center justify-center p-4">
          <Tv className="w-12 h-12 text-gray-600 mb-2" />
          <span className="text-gray-500 text-sm text-center line-clamp-2">
            {serie.titulo}
          </span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
        <span className="text-white font-semibold text-sm line-clamp-2 drop-shadow-lg">
          {serie.titulo}
        </span>
        {serie.ano && (
          <span className="text-gray-300 text-xs mt-1">{serie.ano}</span>
        )}
      </div>
    </motion.div>
  );
}

interface CategoryRowProps {
  genre: string;
  series: Serie[];
  onSeriesClick: (serie: Serie) => void;
}

function CategoryRow({ genre, series, onSeriesClick }: CategoryRowProps) {
  const sliderRef = useRef<HTMLDivElement>(null);

  const scroll = useCallback((direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const scrollAmount = sliderRef.current.clientWidth * 0.8;
      sliderRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  }, []);

  if (!series || series.length === 0) return null;

  return (
    <div className="series-category-row">
      <h2 className="series-category-title">{genre}</h2>
      <div className="series-slider-container">
        <button
          className="series-slider-button left"
          onClick={() => scroll('left')}
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-8 h-8 text-white" />
        </button>
        <div className="series-slider" ref={sliderRef}>
          {series.map((serie) => (
            <SeriesCard
              key={serie.id_n}
              serie={serie}
              onClick={() => onSeriesClick(serie)}
            />
          ))}
        </div>
        <button
          className="series-slider-button right"
          onClick={() => scroll('right')}
          aria-label="Scroll right"
        >
          <ChevronRight className="w-8 h-8 text-white" />
        </button>
      </div>
    </div>
  );
}

interface HeroSectionProps {
  serie: Serie | null;
}

function HeroSection({ serie }: HeroSectionProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  if (!serie) {
    return (
      <div className="series-hero-section bg-black flex items-center justify-center">
        <div className="animate-pulse text-gray-600">Carregando...</div>
      </div>
    );
  }

  const backdropUrl = serie.backdrop_tmdb || serie.banner || serie.capa
    ? tmdbImageUrl(serie.backdrop_tmdb || serie.banner || serie.capa || '', 'original')
    : null;

  const rating = serie.classificacao || serie.rating_tmdb || 'N/A';

  return (
    <div className="series-hero-section">
      <style>{seriesPageStyles}</style>
      {backdropUrl && (
        <>
          <div
            className="series-hero-backdrop"
            style={{
              backgroundImage: `url(${backdropUrl})`,
              opacity: imageLoaded ? 1 : 0,
              transition: 'opacity 0.5s ease',
            }}
          />
          <img
            src={backdropUrl}
            alt=""
            className="hidden"
            onLoad={() => setImageLoaded(true)}
          />
        </>
      )}
      {!imageLoaded && backdropUrl && (
        <div className="absolute inset-0 bg-gray-900 animate-pulse" />
      )}
      <div className="series-hero-overlay" />
      
      <div className="series-hero-content">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Categoria */}
          <p className="text-xs md:text-sm font-bold text-muted-foreground mb-2 flex items-center gap-2 text-shadow-premium">
            <span className="text-primary">Série</span>
            <span className="hidden sm:inline">•</span>
            <span>{serie.ano}</span>
            {serie.classificacao && (
              <span className="text-[#ffff5c]">{serie.classificacao}</span>
            )}
          </p>

          <h1 
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4"
            style={{ textShadow: '0 2px 20px rgba(0,0,0,0.8)' }}
          >
            {serie.titulo}
          </h1>

          {serie.descricao && (
            <p 
              className="text-white/90 text-base md:text-lg max-w-2xl line-clamp-2"
              style={{ textShadow: '0 1px 10px rgba(0,0,0,0.8)' }}
            >
              {serie.descricao}
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default function SeriesPage() {
  const navigate = useNavigate();
  const { series, seriesByGenre, heroSerie, isLoading, error, getAllGenres } = useSeriesData();

  const handleSeriesClick = useCallback((serie: Serie) => {
    navigate(`/series-details/${serie.id_n}`);
  }, [navigate]);

  const genres = getAllGenres();

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">Erro ao carregar séries</p>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="series-page-container bg-black min-h-screen">
      <style>{seriesPageStyles}</style>
      
      <HeroSection
        serie={heroSerie}
      />

      <div className="relative z-10 bg-black pt-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-white/60">Carregando séries...</span>
            </div>
          </div>
        ) : (
          <>
            {genres.length === 0 ? (
              <div className="text-center py-20">
                <Tv className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Nenhuma série encontrada</p>
              </div>
            ) : (
              genres.map((genre) => (
                <CategoryRow
                  key={genre}
                  genre={genre}
                  series={seriesByGenre[genre] || []}
                  onSeriesClick={handleSeriesClick}
                />
              ))
            )}
          </>
        )}
      </div>

      <div className="h-20 bg-black" />
    </div>
  );
}
