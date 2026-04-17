import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff } from "lucide-react";

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || "b275ce8e1a6b3d5d879bb0907e4f56ad";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

interface TrendingMovie {
  id: number;
  title: string;
  poster_path: string;
}

const Login = () => {
  console.log('[Login] RENDER START');
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [trendingMovies, setTrendingMovies] = useState<TrendingMovie[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('[Login] Fetching TMDB...');
    const fetchTrending = async () => {
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_API_KEY}&language=pt-BR&page=1`
        );
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        console.log('[Login] TMDB fetched:', data.results?.length || 0, 'movies');
        setTrendingMovies(data.results?.slice(0, 8) || []);
      } catch (error) {
        console.error("[Login] TMDB error:", error);
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

  console.log('[Login] Rendering with', trendingMovies.length, 'movies, slide', currentSlide);

  return (
    <div style={{ 
      minHeight: '100vh', 
      width: '100%', 
      position: 'relative',
      backgroundColor: '#000',
      color: '#fff'
    }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <img 
          src="https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=2000&auto=format&fit=crop"
          alt="Background"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{ 
          position: 'absolute', 
          inset: 0, 
          background: 'linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.7), rgba(0,0,0,0.5))' 
        }} />
      </div>

      {/* Content Container */}
      <div style={{ 
        position: 'relative', 
        zIndex: 10, 
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <header style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/logo.png" alt="CineCasa" style={{ height: '48px' }} />
          <div>
            <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '20px', letterSpacing: '2px' }}>CINECASA</span>
            <span style={{ color: '#00d4ff', fontSize: '10px', letterSpacing: '2px', display: 'block' }}>ENTRETENIMENTO E LAZER</span>
          </div>
        </header>

        {/* Carousel Section */}
        <div style={{ padding: '0 32px', marginBottom: '20px' }}>
          <h2 style={{ color: '#fff', textAlign: 'center', fontSize: '16px', marginBottom: '16px' }}>
            NOVIDADES DESTA SEMANA
          </h2>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            {visibleMovies.map((movie, idx) => (
              <div key={movie.id} style={{ position: 'relative', width: '100px' }}>
                <img 
                  src={`${TMDB_IMAGE_BASE}${movie.poster_path}`}
                  alt={movie.title}
                  style={{ width: '100%', borderRadius: '8px', border: '2px solid transparent' }}
                />
                <div style={{ 
                  position: 'absolute', 
                  top: '4px', 
                  left: '4px', 
                  background: 'rgba(0, 212, 255, 0.8)', 
                  color: '#000',
                  fontSize: '10px',
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}>
                  {idx === 0 ? "FILMES" : idx === 1 ? "SÉRIES" : "NOVO"}
                </div>
              </div>
            ))}
          </div>

          {/* Slide indicators */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
            {Array.from({ length: Math.ceil(trendingMovies.length / 4) }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                style={{
                  width: idx === currentSlide ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  border: 'none',
                  background: idx === currentSlide ? '#00d4ff' : 'rgba(255,255,255,0.3)',
                  cursor: 'pointer'
                }}
              />
            ))}
          </div>
        </div>

        {/* Login Card */}
        <div style={{ 
          flex: 1,
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '24px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '400px',
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '32px',
            border: '1px solid rgba(0, 212, 255, 0.3)'
          }}>
            {/* Logo in card */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                background: 'linear-gradient(135deg, #00d4ff, #0066cc)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <img src="/logo.png" alt="Logo" style={{ width: '40px' }} />
              </div>
            </div>

            <h1 style={{ color: '#fff', textAlign: 'center', fontSize: '24px', marginBottom: '8px' }}>
              BEM-VINDO DE VOLTA
            </h1>
            <p style={{ color: '#aaa', textAlign: 'center', fontSize: '14px', marginBottom: '32px' }}>
              Faça login para continuar
            </p>

            <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-mail"
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: '16px'
                }}
                required
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha"
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: '16px'
                }}
                required
              />
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #00d4ff, #0066cc)',
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                {isLoading ? "Carregando..." : "ENTRAR"}
              </button>
            </form>

            <p style={{ color: '#00d4ff', textAlign: 'center', marginTop: '16px', fontSize: '14px' }}>
              Esqueceu a senha?
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '24px 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.2)' }} />
              <span style={{ color: '#888', fontSize: '12px' }}>OU</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.2)' }} />
            </div>

            <button
              onClick={handleGoogleLogin}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: '#fff',
                color: '#333',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                cursor: 'pointer'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>

            <p style={{ color: '#888', textAlign: 'center', marginTop: '24px', fontSize: '14px' }}>
              Não tem uma conta? <span style={{ color: '#00d4ff', textDecoration: 'underline' }}>Assine Agora</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
