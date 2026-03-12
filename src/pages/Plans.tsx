import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Shield, Zap, Star, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";

const Plans = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showPixModal, setShowPixModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const PIX_KEY = "cinecasa@exemplo.com.br";

  const handleSelectPlan = (plan: string) => {
    setSelectedPlan(plan);
    setShowPixModal(true);
  };

  const copyPixKey = () => {
    navigator.clipboard.writeText(PIX_KEY);
    toast.success("Chave Pix copiada!");
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-hidden relative">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-50"
        style={{
          backgroundImage: 'url(/plans-bg.jpg)',
        }}
      />
      
      {/* Overlay for better text visibility */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60" />
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-[#00A8E1]/8 blur-[150px] rounded-full" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-[#00A8E1]/8 blur-[150px] rounded-full" />
        <div className="absolute inset-0 bg-[url('/placeholder.svg')] opacity-[0.02] bg-repeat bg-[length:300px]" />
      </div>

      {/* Header */}
      <nav className="relative z-20 flex items-center justify-between px-6 sm:px-12 py-6">
        <div className="flex flex-col items-start leading-none">
          <div className="relative">
            <img 
              src="/cinecasa-logo.png" 
              alt="CineCasa" 
              className="h-12 sm:h-16 w-auto object-contain mb-2 relative z-10"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/favicon.ico";
              }}
              onLoad={() => {
                console.log('Logo carregado com sucesso');
              }}
            />
            <div className="absolute inset-0 bg-[#00A8E1]/20 rounded-full blur-2xl -z-10 scale-150"></div>
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold text-white/50 tracking-widest uppercase">
            Entretenimento e lazer
          </span>
        </div>
        <Link
          to="/login"
          className="flex items-center gap-2 px-4 py-2 border border-white/20 hover:border-[#00A8E1] text-white/70 hover:text-white rounded-lg transition-all text-sm font-bold"
        >
          Já tem conta? Entrar
        </Link>
      </nav>

      {/* Content */}
      <div className="relative z-20 max-w-6xl mx-auto px-4 sm:px-8 pb-20 pt-8">
        {/* Hero text */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <span className="text-[#00A8E1] font-black tracking-[0.3em] uppercase text-xs sm:text-sm">
            Escolha sua assinatura
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mt-4 mb-6">
            Filmes, séries e muito mais
          </h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">
            Assine agora e tenha acesso a um catálogo com milhares de títulos
          </p>
        </motion.div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Basic Plan */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="relative group"
          >
            <div className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent" />
              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-white mb-2">Básico</h3>
                <div className="mb-6">
                  <span className="text-4xl font-black text-white">R$4,99</span>
                  <span className="text-white/60">/mês</span>
                </div>
                
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3 text-white/80">
                    <Check className="w-5 h-5 text-green-400" />
                    <span>Acesso a todo o catálogo</span>
                  </li>
                  <li className="flex items-center gap-3 text-white/80">
                    <Check className="w-5 h-5 text-green-400" />
                    <span>Qualidade HD</span>
                  </li>
                  <li className="flex items-center gap-3 text-white/80">
                    <Check className="w-5 h-5 text-green-400" />
                    <span>1 dispositivo simultâneo</span>
                  </li>
                </ul>

                <button
                  onClick={() => handleSelectPlan("BASIC")}
                  className="w-full py-4 bg-white/10 border border-white/20 text-white rounded-xl font-semibold hover:bg-white/20 transition-all duration-300"
                >
                  SELECIONAR BÁSICO — R$4,99
                </button>
              </div>
            </div>
          </motion.div>

          {/* Pro Plan */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="relative group"
          >
            <div className="absolute inset-0 rounded-2xl border-2 border-[#00A8E1] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 -z-10 animate-pulse">
              <div className="absolute inset-0 rounded-2xl bg-black/20 backdrop-blur-sm" />
            </div>
            <div className="relative bg-gradient-to-br from-[#00A8E1]/10 to-transparent border border-[#00A8E1]/30 rounded-2xl p-8 hover:border-[#00A8E1]/60 transition-all duration-300">
              <div className="absolute top-4 right-4">
                <span className="bg-[#00A8E1] text-white text-xs font-bold px-3 py-1 rounded-full">
                  MAIS POPULAR
                </span>
              </div>
              
              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-white mb-2">PRO</h3>
                <div className="mb-6">
                  <span className="text-4xl font-black text-white">R$9,99</span>
                  <span className="text-white/60">/mês</span>
                </div>
                
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3 text-white/80">
                    <Check className="w-5 h-5 text-green-400" />
                    <span>Tudo do Básico +</span>
                  </li>
                  <li className="flex items-center gap-3 text-white/80">
                    <Check className="w-5 h-5 text-green-400" />
                    <span>Qualidade 4K + HDR</span>
                  </li>
                  <li className="flex items-center gap-3 text-white/80">
                    <Check className="w-5 h-5 text-green-400" />
                    <span>4 dispositivos simultâneos</span>
                  </li>
                  <li className="flex items-center gap-3 text-white/80">
                    <Check className="w-5 h-5 text-green-400" />
                    <span>Downloads offline</span>
                  </li>
                </ul>

                <button
                  className="w-full py-4 backdrop-blur-md bg-gradient-to-r from-[#00A8E1] to-[#0090c0] text-white rounded-xl font-normal hover:from-[#0090c0] hover:to-[#00A8E1] transition-all duration-300 shadow-[0_0_20px_rgba(0,168,225,0.4)] hover:shadow-[0_0_30px_rgba(0,168,225,0.6)]"
                  onClick={() => handleSelectPlan("PRO")}
                >
                  SELECIONAR PRO — R$9,99
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid md:grid-cols-3 gap-8"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-[#00A8E1]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-[#00A8E1]" />
            </div>
            <h4 className="text-xl font-bold text-white mb-2">Streaming Rápido</h4>
            <p className="text-white/60">
              Sem buffer e com qualidade superior em qualquer dispositivo
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-[#00A8E1]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-[#00A8E1]" />
            </div>
            <h4 className="text-xl font-bold text-white mb-2">Assinatura Segura</h4>
            <p className="text-white/60">
              Pagamentos protegidos e cancelamento a qualquer momento
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-[#00A8E1]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-[#00A8E1]" />
            </div>
            <h4 className="text-xl font-bold text-white mb-2">Catálogo Premium</h4>
            <p className="text-white/60">
              Os melhores filmes, séries e conteúdos exclusivos
            </p>
          </div>
        </motion.div>
      </div>

      {/* PIX Modal */}
      {showPixModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowPixModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-black/90 border border-white/20 rounded-2xl p-8 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-white mb-4">
              Assinatura {selectedPlan}
            </h3>
            
            <div className="bg-white/10 rounded-lg p-6 mb-6">
              <p className="text-white/60 mb-2">Chave PIX:</p>
              <p className="text-[#00A8E1] font-mono text-sm mb-4">{PIX_KEY}</p>
              <button
                onClick={copyPixKey}
                className="w-full py-2 bg-[#00A8E1] text-white rounded-lg hover:bg-[#0090c0] transition-colors"
              >
                Copiar Chave PIX
              </button>
            </div>

            <div className="text-white/60 text-sm mb-6">
              <p>Após o pagamento, envie o comprovante para:</p>
              <p className="text-[#00A8E1]">suporte@cinecasa.com</p>
            </div>

            <div className="flex gap-4">
              <button
                className="flex-1 py-3 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all"
                onClick={() => setShowPixModal(false)}
              >
                Cancelar
              </button>
              <button
                className="flex-1 py-3 bg-[#00A8E1] text-white rounded-xl font-black hover:bg-[#0090c0] transition-all border-2 border-[#00A8E1] animate-pulse"
                onClick={() => {
                  localStorage.setItem("selectedPlan", selectedPlan || "");
                  setShowPixModal(false);
                  navigate("/login");
                }}
              >
                Já fiz o pagamento
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Plans;
