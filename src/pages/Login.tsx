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

  // Buscar conteúdos do Supabase - atualiza só no reload da página
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        // Buscar filmes dos últimos 7 dias
        const { data: recentMovies, error: recentMoviesError } = await supabase
          .from('cinema')
          .select('id, titulo, poster, created_at')
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('created_at', { ascending: false });
        
        if (recentMoviesError) throw recentMoviesError;
        
        let selectedContent: NewContent[] = [];
        
        // Se houver conteúdo dos últimos 7 dias, mostrar ordenado por data
        if (recentMovies && recentMovies.length > 0) {
          selectedContent = recentMovies.slice(0, 6).map(m => ({
            id: m.id,
            title: m.titulo,
            poster: m.poster,
            type: 'movie' as const,
            created_at: m.created_at
          }));
        } else {
          // Sem novidades: buscar TUDO e sortear aleatoriamente com anti-duplicados inteligente
          // Usando cache-busting para garantir dados frescos a cada reload
          const cacheBuster = Date.now();
          console.log('[Login] Buscando conteúdo aleatório. Timestamp:', cacheBuster);
          
          const [allMoviesResult, allSeriesResult] = await Promise.all([
            supabase.from('cinema').select('id, titulo, poster').order('id', { ascending: false }),
            supabase.from('series').select('id_n, titulo, capa').order('id_n', { ascending: false })
          ]);
          
          const allMovies = allMoviesResult.data || [];
          const allSeries = allSeriesResult.data || [];
          
          // Combinar tudo
          const allContent: NewContent[] = [
            ...allMovies.map(m => ({
              id: m.id,
              title: m.titulo,
              poster: m.poster,
              type: 'movie' as const,
              created_at: new Date().toISOString()
            })),
            ...allSeries.map(s => ({
              id: s.id_n,
              title: s.titulo,
              poster: s.capa,
              type: 'series' as const,
              created_at: new Date().toISOString()
            }))
          ];
          
          // Função para extrair nome base (remove números, "temporada", "vol", etc)
          const getBaseName = (title: string): string => {
            return title
              .toLowerCase()
              .replace(/\d+/g, '') // remove números
              .replace(/temporada|season|vol|volume|parte|part|capítulo|episódio/g, '')
              .replace(/[:\-\(\)\[\]]/g, '') // remove pontuação
              .trim();
          };
          
          // Agrupar por nome base para evitar duplicados de coleções/temporadas
          const contentByBaseName = new Map<string, NewContent[]>();
          allContent.forEach(item => {
            const baseName = getBaseName(item.title);
            if (!contentByBaseName.has(baseName)) {
              contentByBaseName.set(baseName, []);
            }
            contentByBaseName.get(baseName)!.push(item);
          });
          
          // Pegar um representante de cada grupo (preferencialmente com poster válido)
          const uniqueContent: NewContent[] = [];
          contentByBaseName.forEach(group => {
            // Ordenar: preferir itens com poster válido
            const withPoster = group.filter(item => item.poster && item.poster.trim() !== '');
            const candidates = withPoster.length > 0 ? withPoster : group;
            
            // Escolher um aleatório do grupo
            const randomIndex = Math.floor(Math.random() * candidates.length);
            uniqueContent.push(candidates[randomIndex]);
          });
          
          // Embaralhar todos os únicos (Fisher-Yates)
          for (let i = uniqueContent.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [uniqueContent[i], uniqueContent[j]] = [uniqueContent[j], uniqueContent[i]];
          }
          
          // Pegar 6 aleatórios, garantindo que não é o início da lista ordenada
          selectedContent = uniqueContent.slice(0, 6);
        }
        
        console.log('Conteúdo carregado:', selectedContent.length, 'itens');
        setNewContent(selectedContent);
      } catch (error) {
        console.error("Error fetching content:", error);
      }
    };
    
    fetchContent();
    // Sem interval - atualiza só no reload da página
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
  
  // Timestamp para forçar re-renderização das capas a cada reload
  const renderTimestamp = Date.now();

  return (
    <div className="h-screen w-full relative overflow-hidden bg-black flex items-center justify-center">
      {/* Background Image - Family watching TV */}
      <div className="absolute inset-0 z-0">
        <img
          src="/imagem pagina de login.png"
          alt="Family watching TV"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-black/40" />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 flex flex-col lg:flex-row items-center lg:items-center justify-between lg:justify-end h-full gap-4 py-4 lg:py-8 overflow-hidden">
        
        {/* Mobile Only - 3 capas não clicáveis (acima do card) */}
        <div className="block lg:hidden w-full flex justify-center">
          <div className="flex justify-center gap-2 overflow-hidden">
            {visibleContent.slice(0, 3).map((item) => (
              <div
                key={`mobile-${item.type}-${item.id}-${renderTimestamp}`}
                className="relative flex-shrink-0"
                style={{ width: '90px' }}
              >
                <div className="aspect-[2/3] rounded-lg overflow-hidden border-2 border-transparent shadow-lg">
                  <img
                    src={`${item.poster || '/placeholder-poster.jpg'}?t=${renderTimestamp}`}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Category Tag */}
                <div className="absolute top-1 left-1 bg-cyan-500 text-black text-[7px] font-bold px-1 py-0.5 rounded">
                  {item.type === 'movie' ? 'FILME' : 'SÉRIE'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Login Card - Centralizado mobile, Direita em telas grandes */}
        <div className="w-full max-w-sm lg:max-w-md lg:ml-auto">
          <div className="relative bg-[rgba(0,0,0,0.6)] backdrop-blur-[15px] rounded-2xl p-4 lg:p-6 border border-cyan-400/40 shadow-2xl shadow-cyan-500/20">
            
            {/* Logo */}
            <div className="flex justify-center mb-2 lg:mb-4">
              <img src="/logo.png" alt="CineCasa" className="h-[80px] sm:h-[100px] md:h-[120px] lg:h-[150px] xl:h-[200px] w-auto object-contain" />
            </div>

            <h1 className="text-white text-xl lg:text-2xl font-bold text-center mb-3 lg:mb-4">
              {isForgotPassword ? "Recuperar Senha" : isSignUp ? "Criar Conta" : "Bem-vindo de Volta"}
            </h1>

            {/* Form */}
            <form onSubmit={isForgotPassword ? handleForgotPassword : isSignUp ? handleSignUp : handleEmailLogin} className="space-y-3 lg:space-y-4">
              {/* Campo de E-mail */}
              <div className="relative flex items-center">
                <div className="absolute left-3 flex items-center justify-center text-gray-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Seu e-mail"
                  className="w-full bg-white/5 border border-gray-400/50 rounded-xl py-2.5 lg:py-3 pl-10 pr-4 text-white placeholder-gray-300 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all text-sm backdrop-blur-sm"
                  required
                />
              </div>

              {/* Password Input - Hidden in forgot password mode */}
              {!isForgotPassword && (
                <div className="relative flex items-center">
                  <div className="absolute left-3 flex items-center justify-center text-gray-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="senha"
                    className="w-full bg-white/5 border border-gray-400/50 rounded-xl py-2.5 lg:py-3 pl-10 pr-16 text-white placeholder-gray-300 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all text-sm backdrop-blur-sm"
                    required={!isForgotPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 flex items-center justify-center text-cyan-400 hover:text-cyan-300 transition-colors w-5 h-5"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5 flex-shrink-0" /> : <Eye className="w-5 h-5 flex-shrink-0" />}
                  </button>
                </div>
              )}

              {/* Enter Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-2.5 lg:py-3 rounded-xl transition-all shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 disabled:opacity-50 text-sm flex justify-center items-center text-center"
              >
                {isLoading ? "Carregando..." : isForgotPassword ? "ENVIAR LINK" : isSignUp ? "CRIAR CONTA" : "ENTRAR"}
              </button>
            </form>

            {/* Forgot Password - Only show in login mode */}
            {!isSignUp && !isForgotPassword && (
              <div className="text-center mt-1.5 lg:mt-2">
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
              <div className="text-center mt-1.5 lg:mt-2">
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
            <div className="text-center mt-3 lg:mt-4">
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

        {/* Desktop Only - 4 capas não clicáveis no rodapé (só lg+) */}
        <div className="hidden lg:block md:hidden sm:hidden w-full flex justify-center mt-auto">
          <div className="flex justify-center gap-3 overflow-hidden">
            {visibleContent.slice(0, 4).map((item) => (
              <div
                key={`desktop-${item.type}-${item.id}-${renderTimestamp}`}
                className="relative flex-shrink-0"
                style={{ width: '100px' }}
              >
                <div className="aspect-[2/3] rounded-lg overflow-hidden border-2 border-transparent shadow-lg">
                  <img
                    src={`${item.poster || '/placeholder-poster.jpg'}?t=${renderTimestamp}`}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Category Tag */}
                <div className="absolute top-1 left-1 bg-cyan-500 text-black text-[7px] font-bold px-1 py-0.5 rounded">
                  {item.type === 'movie' ? 'FILME' : 'SÉRIE'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
