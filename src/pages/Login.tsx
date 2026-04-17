import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, ChevronLeft, ChevronRight } from "lucide-react";

// TMDB Configuration
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || "b275ce8e1a6b3d5d879bb0907e4f56ad";
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

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_API_KEY}&language=pt-BR&page=1`
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
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate("/");
    } catch (error: any) {
      alert(error.message || "Erro ao fazer login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    } catch (error: any) {
      alert(error.message || "Erro ao conectar com Google");
    }
  };

  const visibleMovies = trendingMovies.slice(currentSlide * 4, currentSlide * 4 + 4);

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-black flex items-center justify-center">
      {/* Background Image - Family watching TV */}
      <div className="absolute inset-0 z-0">
        <img
          src="/login-bg.png"
          alt="Family watching TV"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/80" />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 flex flex-col items-center justify-center min-h-screen">
        
        {/* Trending Movies Carousel - Above Login Card */}
        <div className="w-full max-w-4xl mb-6">
          <h2 className="text-white text-center text-base font-semibold mb-3 tracking-wider uppercase">
            Novidades Desta Semana
          </h2>
          
          <div className="relative">
            {/* Navigation Arrows */}
            <button
              onClick={() => setCurrentSlide((prev) => (prev - 1 + Math.ceil(trendingMovies.length / 4)) % Math.ceil(trendingMovies.length / 4))}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-all border border-cyan-500/30"
            >
              <ChevronLeft className="w-5 h-5 text-cyan-400" />
            </button>
            
            <button
              onClick={() => setCurrentSlide((prev) => (prev + 1) % Math.ceil(trendingMovies.length / 4))}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-all border border-cyan-500/30"
            >
              <ChevronRight className="w-5 h-5 text-cyan-400" />
            </button>

            {/* Movies Grid */}
            <div className="flex justify-center gap-3 px-10 overflow-hidden">
              {visibleMovies.map((movie, index) => (
                <div
                  key={movie.id}
                  className="relative group cursor-pointer flex-shrink-0"
                  style={{ width: '100px' }}
                >
                  <div className="aspect-[2/3] rounded-lg overflow-hidden border-2 border-transparent group-hover:border-cyan-400 transition-all shadow-lg">
                    <img
                      src={`${TMDB_IMAGE_BASE}${movie.poster_path}`}
                      alt={movie.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  {/* Category Tag */}
                  <div className="absolute top-1 left-1 bg-cyan-500 text-black text-[8px] font-bold px-1.5 py-0.5 rounded">
                    {index === 0 ? "FILMES" : index === 1 ? "SÉRIES" : index === 2 ? "ALEGORIA" : "NOVO"}
                  </div>
                </div>
              ))}
            </div>

            {/* Slide Indicators */}
            <div className="flex justify-center gap-2 mt-3">
              {Array.from({ length: Math.ceil(trendingMovies.length / 4) }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentSlide ? "bg-cyan-400 w-6" : "bg-white/30 hover:bg-white/50 w-1.5"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Login Card - Glassmorphism */}
        <div className="w-full max-w-md">
          <div className="relative bg-black/50 backdrop-blur-2xl rounded-2xl p-8 border border-cyan-500/30 shadow-2xl shadow-cyan-500/20">
            
            {/* Logo in Card */}
            <div className="flex justify-center mb-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center">
                  <img src="/logo.png" alt="CineCasa" className="w-7 h-7 object-contain" />
                </div>
                <div className="flex flex-col">
                  <span className="text-cyan-400 font-bold text-xl tracking-wider">CINECASA</span>
                  <span className="text-cyan-400/70 text-[10px] tracking-widest">ENTRETENIMENTO E LAZER</span>
                </div>
              </div>
            </div>

            <h1 className="text-white text-2xl font-bold text-center mb-1">
              Bem-vindo de Volta
            </h1>
            <p className="text-gray-400 text-sm text-center mb-6">
              Faça login para continuar sua jornada
            </p>

            {/* Form */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              {/* Email Input */}
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-mail ou Telefone"
                  className="w-full bg-black/40 border border-gray-600 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all text-sm"
                  required
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="senha"
                  className="w-full bg-black/40 border border-gray-600 rounded-xl py-3 pl-10 pr-16 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-400 hover:text-cyan-300 transition-colors text-sm font-medium"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              {/* Enter Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 disabled:opacity-50 text-sm"
              >
                {isLoading ? "Carregando..." : "ENTRAR"}
              </button>
            </form>

            {/* Forgot Password */}
            <div className="text-center mt-3">
              <button className="text-cyan-400 text-xs hover:text-cyan-300 transition-colors">
                Esqueceu a senha?
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-transparent text-gray-500 uppercase text-[10px]">OU CONTINUE COM:</span>
              </div>
            </div>

            {/* Google Button */}
            <button
              onClick={handleGoogleLogin}
              className="w-full bg-white hover:bg-gray-100 text-gray-800 font-medium py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
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
            <div className="text-center mt-4">
              <p className="text-gray-400 text-xs">
                Não tem uma conta?{" "}
                <button className="text-cyan-400 hover:text-cyan-300 font-medium underline">
                  Assine Agora
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
