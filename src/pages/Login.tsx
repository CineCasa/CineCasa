import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff } from "lucide-react";

// Nota: Tabelas cinema e series removidas do sistema

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  // Nota: Estados de conteúdo removidos - tabelas cinema e series não existem mais
  const navigate = useNavigate();

  // Carregar credenciais salvas do localStorage ao montar o componente
  useEffect(() => {
    const savedCredentials = localStorage.getItem('cinecasa_credentials');
    if (savedCredentials) {
      try {
        const { email: savedEmail, password: savedPassword } = JSON.parse(savedCredentials);
        setEmail(savedEmail || '');
        setPassword(savedPassword || '');
        setRememberMe(true);
      } catch (e) {
        console.error('Erro ao carregar credenciais salvas:', e);
      }
    }
  }, []);

  // Nota: Efeitos de conteúdo removidos - tabelas cinema e series não existem mais
  useEffect(() => {
    // Nenhum conteúdo para buscar - tabelas removidas
  }, []);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      // Salvar ou remover credenciais do localStorage baseado no checkbox
      if (rememberMe) {
        localStorage.setItem('cinecasa_credentials', JSON.stringify({ email, password }));
      } else {
        localStorage.removeItem('cinecasa_credentials');
      }
      
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
    console.log('[Login] Iniciando cadastro de novo usuário:', email);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      console.log('[Login] Resposta do signUp:', { data, error });
      if (error) {
        console.error('[Login] Erro no signUp:', error);
        throw error;
      }
      
      if (data.user) {
        console.log('[Login] Usuário criado com sucesso:', data.user.id);
        alert("Conta criada com sucesso! Verifique seu e-mail para confirmar.");
        setIsSignUp(false);
      } else {
        console.log('[Login] SignUp retornou sem usuário');
        alert("Cadastro realizado, mas houve um problema. Tente fazer login.");
      }
    } catch (error: any) {
      console.error('[Login] Erro completo no cadastro:', error);
      alert(error.message || "Erro ao criar conta. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const visibleContent = newContent;
  
  // Timestamp para forçar re-renderização das capas a cada reload
  const renderTimestamp = Date.now();

  return (
    <div className="min-h-screen w-full relative overflow-visible bg-black flex items-center justify-center">
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
      <div className="relative z-10 w-full h-full flex items-center justify-center lg:justify-end px-4">
        
        {/* Login Card - 90% largura em mobile, Direita em telas grandes */}
        <div className="w-[90%] sm:w-[85%] md:w-[80%] lg:w-full max-w-sm lg:max-w-md lg:mr-8 xl:mr-16">
          <div className="relative bg-[rgba(0,0,0,0.6)] backdrop-blur-[15px] rounded-2xl p-4 sm:p-5 border border-cyan-400/40 shadow-2xl shadow-cyan-500/20">
            
            {/* Logo */}
            <div className="flex justify-center mb-2 lg:mb-4">
              <img src="/logo.png" alt="CineCasa" className="h-[200px] w-auto object-contain" />
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

              {/* Lembrar de mim - Checkbox */}
              {!isSignUp && !isForgotPassword && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-400/50 bg-white/5 text-cyan-400 focus:ring-cyan-400/50 focus:ring-2 cursor-pointer"
                  />
                  <label 
                    htmlFor="rememberMe" 
                    className="ml-2 text-sm text-gray-300 cursor-pointer select-none hover:text-gray-200 transition-colors"
                  >
                    Lembrar de mim
                  </label>
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

      </div>
    </div>
  );
};

export default Login;
