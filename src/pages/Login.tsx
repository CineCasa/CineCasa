import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff } from "lucide-react";

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
        setTrendingMovies(data.results?.slice(0, 12) || []);
      } catch (error) {
        console.error("Error fetching trending:", error);
      }
    };
    fetchTrending();
  }, []);

  useEffect(() => {
    if (trendingMovies.length === 0) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % Math.ceil(trendingMovies.length / 6));
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

  const visibleMovies = trendingMovies.slice(currentSlide * 6, currentSlide * 6 + 6);

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-black flex items-center justify-center">
      {/* Background Image - Family watching TV */}
      <div className="absolute inset-0 z-0">
        <img
          src="/imagem pagina de login.png"
          alt="Family watching TV"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/90" />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Main Content Container - Horizontal Layout */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 flex flex-col lg:flex-row items-start lg:items-start justify-start lg:justify-between min-h-screen gap-8 lg:gap-12 py-8 lg:pt-16">
        
        {/* Left Side - Trending Movies Carousel - Top Left on large screens */}
        <div className="w-full lg:w-1/2 max-w-xl lg:max-w-none lg:self-start">
          <h2 className="text-white text-center lg:text-left text-lg font-semibold mb-4 tracking-wider uppercase whitespace-nowrap">
            Novidades Desta Semana
          </h2>
          
          <div className="relative">
            {/* Movies Grid */}
            <div className="flex justify-center lg:justify-start gap-3 overflow-hidden">
              {visibleMovies.map((movie, index) => (
                <div
                  key={movie.id}
                  className="relative group cursor-pointer flex-shrink-0"
                  style={{ width: '120px' }}
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
                    {index === 0 ? "FILMES POPULARES" : index === 1 ? "SÉRIES" : index === 2 ? "ALEGORIA" : index === 3 ? "FICÇÃO" : index === 4 ? "COMÉDIA" : "NOVO"}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Right Side - Login Card - Glassmorphism */}
        <div className="w-full max-w-md lg:self-center">
          <div className="relative bg-black/20 backdrop-blur-2xl rounded-2xl p-8 border border-cyan-400/30 shadow-2xl shadow-cyan-500/10">
            
            {/* Logo */}
            <div className="flex justify-center mb-4">
              <img src="/logo.png" alt="CineCasa" className="h-16 w-auto object-contain" />
            </div>

            <h1 className="text-white text-2xl font-bold text-center mb-6">
              Bem-vindo de Volta
            </h1>

            {/* Form */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              {/* Campo de E-mail */}
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
                  className="w-full bg-white/10 border border-gray-500/50 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all text-sm backdrop-blur-sm"
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
                  className="w-full bg-white/5 border border-gray-500/50 rounded-xl py-3 pl-10 pr-16 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all text-sm backdrop-blur-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
