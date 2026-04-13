import { motion } from "framer-motion";

interface DetailsHeroBannerProps {
  id: string;
  title: string;
  overview: string;
  backdrop_path?: string;
  banner?: string;
  poster_path?: string;
  release_date?: string;
  year?: string;
  vote_average?: number;
  rating?: string;
  runtime?: number;
  duration?: string;
  genres?: { name: string }[] | string;
  adult?: boolean;
}

const DetailsHeroBanner = ({
  title,
  overview,
  backdrop_path,
  banner,
  poster_path,
  year,
  release_date,
  vote_average,
  rating,
  runtime,
  duration,
  genres,
  adult,
}: DetailsHeroBannerProps) => {
  const releaseYear = release_date || year
    ? new Date(release_date || year || "").getFullYear()
    : "";

  const displayDuration = duration || (runtime
    ? `${Math.floor(runtime / 60)}h ${runtime % 60}min`
    : "");

  const displayGenres = Array.isArray(genres)
    ? genres.map((g) => g.name).slice(0, 3).join(" • ")
    : genres || "";

  const displayRating = vote_average?.toFixed(1) || rating || "0.0";

  return (
    <section className="relative w-full h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[70vh] xl:h-[75vh] min-h-[300px] max-h-[900px] overflow-hidden bg-[#141414]">
      {/* Background Image Container - Full Coverage */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <img
          src={backdrop_path || banner || "/placeholder-backdrop.jpg"}
          alt={title}
          className="w-full h-full object-contain sm:object-cover object-center"
          style={{ 
            objectPosition: 'center center',
            maxWidth: '100%',
            maxHeight: '100%'
          }}
        />
        {/* Gradient Overlays for readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-[#141414]/40" />
        <div className="absolute inset-0 bg-black/30 shadow-[inset_0_0_300px_rgba(0,0,0,0.6)]" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-end pb-16 sm:pb-20 md:pb-28">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12">
          <div className="max-w-3xl space-y-4 sm:space-y-5">
            
            {/* Poster + Title Row */}
            <div className="flex items-end gap-4 sm:gap-6">
              {poster_path && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="flex-shrink-0 w-24 sm:w-32 md:w-40 lg:w-48 aspect-[2/3] rounded-lg overflow-hidden shadow-2xl"
                >
                  <img
                    src={poster_path}
                    alt={title}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              )}
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex-1"
              >
                <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight drop-shadow-lg">
                  {title}
                </h1>
              </motion.div>
            </div>

            {/* Metadata */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap items-center gap-2 sm:gap-3"
            >
              {displayRating && (
                <span className="flex items-center gap-1 bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-xs sm:text-sm">
                  ★ {displayRating}
                </span>
              )}
              {releaseYear && (
                <span className="bg-white/10 px-2 py-1 rounded text-xs sm:text-sm text-gray-200">
                  {releaseYear}
                </span>
              )}
              {displayDuration && (
                <span className="bg-white/10 px-2 py-1 rounded text-xs sm:text-sm text-gray-200">
                  {displayDuration}
                </span>
              )}
              {displayGenres && (
                <span className="bg-white/10 px-2 py-1 rounded text-xs sm:text-sm text-gray-200">
                  {typeof displayGenres === 'string' ? displayGenres.split(',')[0] : displayGenres}
                </span>
              )}
              <span className="bg-white/10 px-2 py-1 rounded text-xs sm:text-sm text-gray-200">HD</span>
              {adult && <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded text-xs sm:text-sm">18+</span>}
            </motion.div>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-sm sm:text-base md:text-lg text-gray-200 line-clamp-2 sm:line-clamp-3 max-w-xl"
            >
              {overview}
            </motion.p>

            {/* Genres */}
            {displayGenres && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.45 }}
                className="text-xs sm:text-sm text-gray-400"
              >
                {displayGenres}
              </motion.div>
            )}

          </div>
        </div>
      </div>
    </section>
  );
};

export default DetailsHeroBanner;
