import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff } from "lucide-react";

// TMDB Configuration
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || "b275ce8e1a6b3d5d879bb0907e4f56ad";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

interface NewContent {
  id: number;
  title: string;
  poster: string;
  type: 'movie' | 'series';
  created_at: string;
}

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [newContent, setNewContent] = useState<NewContent[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  // Buscar conteúdos dos últimos 7 dias do Supabase
  useEffect(() => {
    const fetchRecentContent = async () => {
      try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        // Buscar filmes dos últimos 7 dias
        const { data: movies, error: moviesError } = await supabase
          .from('cinema')
          .select('id, titulo, poster, created_at')
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(6);
        
        if (moviesError) throw moviesError;
        
        // Buscar séries dos últimos 7 dias
        const { data: series, error: seriesError } = await supabase
          .from('series')
          .select('id, titulo, poster, created_at')
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(6);
        
        if (seriesError) throw seriesError;
        
        // Combinar e formatar conteúdos
        const moviesFormatted = (movies || []).map(m => ({
          id: m.id,
          title: m.titulo,
          poster: m.poster,
          type: 'movie' as const,
          created_at: m.created_at
        }));
        
        const seriesFormatted = (series || []).map(s => ({
          id: s.id,
          title: s.titulo,
          poster: s.poster,
          type: 'series' as const,
          created_at: s.created_at
        }));
        
        // Ordenar por data e pegar os 6 mais recentes
        const combined = [...moviesFormatted, ...seriesFormatted]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 6);
        
        setNewContent(combined);
      } catch (error) {
        console.error("Error fetching recent content:", error);
      }
    };
    
    fetchRecentContent();
    
    // Atualizar a cada 5 minutos para pegar novos conteúdos
    const interval = setInterval(fetchRecentContent, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      alert("Por favor, digite seu e-mail");
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) throw error;
      alert("Link de recuperação enviado! Verifique seu e-mail.");
      setIsForgotPassword(false);
    } catch (error: any) {
      alert(error.message || "Erro ao enviar link de recuperação");
    } finally {
      setIsLoading(false);
    }
  };

  const handleContentClick = (item: NewContent) => {
    if (item.type === 'movie') {
      navigate(`/movie-details/${item.id}`);
    } else {
      navigate(`/series-details/${item.id}`);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      alert("Conta criada com sucesso! Verifique seu e-mail para confirmar.");
      setIsSignUp(false);
    } catch (error: any) {
      alert(error.message || "Erro ao criar conta");
    } finally {
      setIsLoading(false);
    }
  };

  const visibleContent = newContent;

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
          <h2 className="hidden lg:block text-white text-center lg:text-left text-lg font-semibold mb-4 tracking-wider uppercase whitespace-nowrap">
            Novidades Desta Semana
          </h2>
          
          <div className="relative">
            {/* Movies Grid */}
            <div className="flex justify-center lg:justify-start gap-3 overflow-hidden">
              {visibleContent.map((item, index) => (
                <div
                  key={`${item.type}-${item.id}`}
                  onClick={() => handleContentClick(item)}
                  className="relative group cursor-pointer flex-shrink-0"
                  style={{ width: '120px' }}
                >
                  <div className="aspect-[2/3] rounded-lg overflow-hidden border-2 border-transparent group-hover:border-cyan-400 transition-all shadow-lg">
                    <img
                      src={item.poster || '/placeholder-poster.jpg'}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  {/* Category Tag */}
                  <div className="absolute top-1 left-1 bg-cyan-500 text-black text-[8px] font-bold px-1.5 py-0.5 rounded">
                    {item.type === 'movie' ? 'FILME' : 'SÉRIE'}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Right Side - Login Card - Glassmorphism */}
        <div className="w-full max-w-md lg:self-center">
          <div className="relative bg-white/5 backdrop-blur-3xl rounded-2xl p-8 border border-cyan-400/40 shadow-2xl shadow-cyan-500/20">
            
            {/* Logo */}
            <div className="flex justify-center mb-4">
              <img src="/logo.png" alt="CineCasa" className="h-[70px] w-auto object-contain" />
            </div>

            <h1 className="text-white text-2xl font-bold text-center mb-6">
              {isForgotPassword ? "Recuperar Senha" : isSignUp ? "Criar Conta" : "Bem-vindo de Volta"}
            </h1>

            {/* Form */}
            <form onSubmit={isForgotPassword ? handleForgotPassword : isSignUp ? handleSignUp : handleEmailLogin} className="space-y-4">
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
                  placeholder="Seu e-mail"
                  className="w-full bg-white/5 border border-gray-400/50 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-300 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all text-sm backdrop-blur-sm"
                  required
                />
              </div>

              {/* Password Input - Hidden in forgot password mode */}
              {!isForgotPassword && (
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
                    className="w-full bg-white/5 border border-gray-400/50 rounded-xl py-3 pl-10 pr-16 text-white placeholder-gray-300 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all text-sm backdrop-blur-sm"
                    required={!isForgotPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-400 hover:text-cyan-300 transition-colors flex items-center justify-center w-5 h-5"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5 flex-shrink-0" /> : <Eye className="w-5 h-5 flex-shrink-0" />}
                  </button>
                </div>
              )}

              {/* Enter Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 disabled:opacity-50 text-sm"
              >
                {isLoading ? "Carregando..." : isForgotPassword ? "ENVIAR LINK" : isSignUp ? "CRIAR CONTA" : "ENTRAR"}
              </button>
            </form>

            {/* Forgot Password - Only show in login mode */}
            {!isSignUp && !isForgotPassword && (
              <div className="text-center mt-2">
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(true)}
                  className="text-cyan-400 text-xs hover:text-cyan-300 transition-colors"
                >
                  Esqueceu a senha?
                </button>
              </div>
            )}

            {/* Back to Login - Only show in forgot password mode */}
            {isForgotPassword && (
              <div className="text-center mt-2">
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(false)}
                  className="text-cyan-400 text-xs hover:text-cyan-300 transition-colors"
                >
                  Voltar para o login
                </button>
              </div>
            )}

            {/* Sign Up / Login Toggle Link */}
            <div className="text-center mt-4">
              <p className="text-gray-400 text-xs">
                {isSignUp ? (
                  <>
                    Já tem uma conta?{" "}
                    <button
                      type="button"
                      onClick={() => setIsSignUp(false)}
                      className="text-cyan-400 hover:text-cyan-300 font-medium underline"
                    >
                      Entrar
                    </button>
                  </>
                ) : (
                  <>
                    Não tem uma conta?{" "}
                    <button
                      type="button"
                      onClick={() => setIsSignUp(true)}
                      className="text-cyan-400 hover:text-cyan-300 font-medium underline"
                    >
                      Assine Agora
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
