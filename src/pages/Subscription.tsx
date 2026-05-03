import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Crown, 
  Check, 
  ArrowLeft, 
  Sparkles,
  Monitor,
  Smartphone,
  Tablet,
  Tv
} from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
  color: string;
}

const plans: Plan[] = [
  {
    id: 'basic',
    name: 'Básico',
    price: 'R$ 19,90',
    period: '/mês',
    description: 'Ideal para quem assiste ocasionalmente',
    features: [
      '1 tela simultânea',
      'Resolução HD (720p)',
      'Acesso a filmes e séries',
      'Sem anúncios',
      'Download em 1 dispositivo'
    ],
    color: 'from-gray-500 to-gray-600'
  },
  {
    id: 'standard',
    name: 'Padrão',
    price: 'R$ 29,90',
    period: '/mês',
    description: 'Perfeito para famílias pequenas',
    features: [
      '2 telas simultâneas',
      'Resolução Full HD (1080p)',
      'Acesso a filmes e séries',
      'Sem anúncios',
      'Download em 2 dispositivos',
      'Conteúdo exclusivo'
    ],
    popular: true,
    color: 'from-cyan-500 to-blue-500'
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 'R$ 44,90',
    period: '/mês',
    description: 'A melhor experiência CineCasa',
    features: [
      '4 telas simultâneas',
      'Resolução 4K Ultra HD',
      'Acesso a filmes e séries',
      'Sem anúncios',
      'Download em 4 dispositivos',
      'Conteúdo exclusivo',
      'Áudio Dolby Atmos',
      'Premieres ao vivo'
    ],
    color: 'from-purple-500 to-pink-500'
  }
];

const devices = [
  { icon: Tv, label: 'Smart TV' },
  { icon: Monitor, label: 'Computador' },
  { icon: Smartphone, label: 'Celular' },
  { icon: Tablet, label: 'Tablet' }
];

export default function Subscription() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<string>('standard');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubscribe = async (planId: string) => {
    setIsProcessing(true);
    // Simulação de processamento
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsProcessing(false);
    // Aqui você integraria com gateway de pagamento
    alert(`Plano ${planId} selecionado! Integração com pagamento em breve.`);
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden">
      {/* Background com gradiente sutil */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#050a12] via-black to-black" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      {/* Conteúdo */}
      <div className="relative z-10 min-h-screen pt-24 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <button
              onClick={() => navigate('/profile')}
              className="absolute top-0 left-4 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Voltar</span>
            </button>

            <div className="inline-flex items-center gap-2 mb-4">
              <Crown className="w-8 h-8 text-[#E53935]" />
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              <span className="text-[#E53935]">CineCasa</span> Premium
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Escolha o plano perfeito para você e tenha acesso ilimitado ao melhor do entretenimento
            </p>
          </motion.div>

          {/* Dispositivos Suportados */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-wrap justify-center gap-8 mb-12"
          >
            {devices.map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-2 text-gray-400">
                <Icon className="w-8 h-8" />
                <span className="text-sm">{label}</span>
              </div>
            ))}
          </motion.div>

          {/* Planos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                className={`relative rounded-2xl overflow-hidden ${
                  selectedPlan === plan.id ? 'ring-2 ring-cyan-400' : ''
                }`}
              >
                {/* Badge Popular */}
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-cyan-500 to-blue-500 text-black text-xs font-bold px-4 py-1 rounded-bl-lg z-10">
                    MAIS POPULAR
                  </div>
                )}

                <div className="bg-gradient-to-b from-[#0a0a0f] to-[#050508] border border-white/10 rounded-2xl p-6 h-full flex flex-col hover:border-cyan-500/30 transition-all duration-300">
                  {/* Header do Plano */}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${plan.color} flex items-center justify-center mb-4`}>
                    <Crown className="w-6 h-6 text-white" />
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-1">{plan.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{plan.description}</p>

                  {/* Preço */}
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-gray-400">{plan.period}</span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-300 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Botão */}
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isProcessing}
                    className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
                      selectedPlan === plan.id
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-black hover:from-cyan-400 hover:to-blue-400'
                        : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                    }`}
                  >
                    {isProcessing ? 'Processando...' : selectedPlan === plan.id ? 'Plano Selecionado' : 'Escolher Plano'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Informações Adicionais */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-16 text-center"
          >
            <p className="text-gray-500 text-sm">
              Todos os planos incluem teste gratuito de 7 dias. Cancele quando quiser.
            </p>
            <p className="text-gray-600 text-xs mt-2">
              Pagamento seguro processado por gateway criptografado
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
