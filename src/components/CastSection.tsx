import { motion } from 'framer-motion';

interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

interface CastSectionProps {
  cast: CastMember[];
}

const CastSection = ({ cast }: CastSectionProps) => {
  if (!cast || cast.length === 0) return null;
  const getImageUrl = (path: string | null) => path ? `https://image.tmdb.org/t/p/w200${path}` : '/placeholder-avatar.png';
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="mb-6">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <span className="w-1 h-6 bg-cyan-400 rounded-full"></span>
        Elenco
      </h3>
      <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide">
        {cast.slice(0, 15).map((actor, index) => (
          <motion.div key={actor.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, delay: index * 0.05 }} className="flex-shrink-0 flex flex-col items-center group cursor-pointer">
            <div className="relative">
              <div className="absolute inset-0 rounded-full opacity-50 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110" style={{ boxShadow: '0 0 20px rgba(0, 229, 255, 0.5), 0 0 40px rgba(0, 229, 255, 0.3)' }}/>
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-cyan-400 group-hover:border-cyan-300 transition-all duration-300 group-hover:scale-110" style={{ boxShadow: '0 0 15px rgba(0, 229, 255, 0.4), inset 0 0 10px rgba(0, 229, 255, 0.1)' }}>
                <img src={getImageUrl(actor.profile_path)} alt={actor.name} className="w-full h-full object-cover" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-avatar.png'; }}/>
              </div>
            </div>
            <p className="mt-3 text-white text-sm font-medium text-center max-w-[80px] line-clamp-2">{actor.name}</p>
            <p className="text-cyan-400 text-xs text-center max-w-[80px] line-clamp-1">{actor.character}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default CastSection;
