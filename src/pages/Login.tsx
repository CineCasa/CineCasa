import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, EyeOff, ChevronLeft, ChevronRight } from "lucide-react";

// TMDB Configuration
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || "b275ce8e1a6b3d5d879bb0907e4f56ad";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

interface TrendingMovie {
  id: number;
  title: string;
  poster_path: string;
}

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [trendingMovies, setTrendingMovies] = useState<TrendingMovie[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  // Fetch trending movies from TMDB
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await fetch(
          `${TMDB_BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}&language=pt-BR&page=1`
        );
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setTrendingMovies(data.results?.slice(0, 8) || []);
      } catch (error) {
        console.error("Error fetching trending:", error);
      }
    };
    fetchTrending();
  }, []);

  // Auto-slide carousel
  useEffect(() => {
    if (trendingMovies.length === 0) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % Math.ceil(trendingMovies.length / 4));
    }, 5000);
    return () => clearInterval(interval);
  }, [trendingMovies]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      toast.success("Bem-vindo de volta!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });
      
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Erro ao conectar com Google");
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % Math.ceil(trendingMovies.length / 4));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + Math.ceil(trendingMovies.length / 4)) % Math.ceil(trendingMovies.length / 4));
  };

  const visibleMovies = trendingMovies.slice(currentSlide * 4, currentSlide * 4 + 4);

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-black">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=2000&auto=format&fit=crop"
          alt="Family watching TV"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/40" />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Header */}
      <header className="absolute top-0 left-0 w-full z-20 p-6">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="CineCasa"
            className="h-12 w-auto object-contain"
          />
          <div className="flex flex-col">
            <span className="text-white font-bold text-xl tracking-wider">CINECASA</span>
            <span className="text-cyan-400 text-xs tracking-widest">ENTRETENIMENTO E LAZER</span>
          </div>
        </div>
      </header>

      {/* Trending Movies Carousel */}
      <div className="absolute top-24 left-0 right-0 z-10 px-8">
        <h2 className="text-white text-center text-lg font-semibold mb-4 tracking-wider">
          NOVIDADES DESTA SEMANA
        </h2>
        
        <div className="relative max-w-4xl mx-auto">
          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-all border border-cyan-500/30"
          >
            <ChevronLeft className="w-6 h-6 text-cyan-400" />
          </button>
          
          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-all border border-cyan-500/30"
          >
            <ChevronRight className="w-6 h-6 text-cyan-400" />
          </button>

          {/* Movies Grid */}
          <motion.div 
            className="flex justify-center gap-4 px-12"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            key={currentSlide}
          >
            {visibleMovies.map((movie, index) => (
              <motion.div
                key={movie.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="relative group cursor-pointer"
              >
                <div className="w-32 h-48 rounded-lg overflow-hidden border-2 border-transparent group-hover:border-cyan-400 transition-all shadow-lg group-hover:shadow-cyan-500/20">
                  <img
                    src={`${TMDB_IMAGE_BASE}${movie.poster_path}`}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2">
                    <p className="text-white text-xs text-center truncate">{movie.title}</p>
                  </div>
                </div>
                {/* Category Tag */}
                <div className="absolute top-2 left-2 bg-cyan-500/80 text-black text-[10px] font-bold px-2 py-0.5 rounded">
                  {index === 0 ? "FILMES" : index === 1 ? "SÉRIES" : index === 2 ? "ALEGORIA" : index === 3 ? "ALEGRIA" : "NOVO"}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Slide Indicators */}
          <div className="flex justify-center gap-2 mt-4">
            {Array.from({ length: Math.ceil(trendingMovies.length / 4) }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentSlide ? "bg-cyan-400 w-6" : "bg-white/30 hover:bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Login Card */}
      <div className="absolute inset-0 flex items-center justify-center z-30 pt-32">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md mx-4"
        >
          <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl p-8 border border-cyan-500/20 shadow-2xl shadow-cyan-500/10">
            {/* Logo in Card */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <img src="/logo.png" alt="CineCasa" className="w-10 h-10 object-contain" />
              </div>
            </div>

            <h1 className="text-white text-2xl font-bold text-center mb-2">
              BEM-VINDO DE VOLTA
            </h1>
            <p className="text-gray-400 text-sm text-center mb-8">
              Faça login para continuar sua jornada
            </p>

            {/* Form */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-mail ou Telefone"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                  required
                />
              </div>

              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Senha"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-12 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Enter Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-white font-bold py-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                ) : (
                  "ENTRAR"
                )}
              </button>
            </form>

            {/* Forgot Password */}
            <div className="text-center mt-4">
              <button className="text-cyan-400 text-sm hover:text-cyan-300 transition-colors">
                Esqueceu a senha?
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-4 bg-black/40 text-gray-400">OU CONTINUE COM</span>
              </div>
            </div>

            {/* Google Button */}
            <button
              onClick={handleGoogleLogin}
              className="w-full bg-white hover:bg-gray-100 text-gray-800 font-medium py-3.5 rounded-xl transition-all flex items-center justify-center gap-3 border border-gray-200"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>

            {/* Sign Up Link */}
            <div className="text-center mt-6">
              <p className="text-gray-400 text-sm">
                Não tem uma conta?{" "}
                <button className="text-cyan-400 hover:text-cyan-300 font-medium underline">
                  Assine Agora
                </button>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
