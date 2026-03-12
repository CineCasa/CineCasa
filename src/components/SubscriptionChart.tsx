import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Users, TrendingUp, CreditCard, Calendar, Activity } from "lucide-react";

interface SubscriptionData {
  plan_name: string;
  count: number;
  percentage: number;
  color: string;
}

interface MonthlyData {
  month: string;
  basic: number;
  pro: number;
  total: number;
}

const SubscriptionChart = () => {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);

  useEffect(() => {
    fetchSubscriptionData();
    fetchMonthlyData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      // Buscar dados das tabelas planos e usuario_plano
      const { data: plans, error: plansError } = await supabase
        .from('planos')
        .select('id, nome, preco');

      if (plansError) throw plansError;

      const { data: userPlans, error: userPlansError } = await supabase
        .from('usuario_plano')
        .select('plano_id, status, updated_at')
        .eq('status', 'ativo');

      if (userPlansError) throw userPlansError;

      // Contar usuários por plano
      const planCounts: { [key: string]: number } = {};
      plans?.forEach(plan => {
        planCounts[plan.nome] = 0;
      });

      userPlans?.forEach(userPlan => {
        const plan = plans?.find(p => p.id === userPlan.plano_id);
        if (plan) {
          planCounts[plan.nome] = (planCounts[plan.nome] || 0) + 1;
        }
      });

      const total = Object.values(planCounts).reduce((sum, count) => sum + count, 0);

      const data: SubscriptionData[] = plans?.map(plan => ({
        plan_name: plan.nome,
        count: planCounts[plan.nome] || 0,
        percentage: total > 0 ? Math.round((planCounts[plan.nome] / total) * 100) : 0,
        color: plan.nome === 'PRO' ? '#00A8E1' : '#64748b'
      })) || [];

      setSubscriptionData(data);
      setTotalUsers(total);
      setActiveUsers(userPlans?.length || 0);
    } catch (error) {
      console.error('Erro ao buscar dados de assinaturas:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyData = async () => {
    try {
      // Gerar dados dos últimos 6 meses
      const months = [];
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      for (let i = 5; i >= 0; i--) {
        const month = new Date(currentYear, currentMonth - i, 1);
        const monthName = month.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
        
        // Simulação de dados (em produção, buscar do banco)
        const basic = Math.floor(Math.random() * 50) + 20;
        const pro = Math.floor(Math.random() * 30) + 10;
        
        months.push({
          month: monthName,
          basic,
          pro,
          total: basic + pro
        });
      }
      
      setMonthlyData(months);
    } catch (error) {
      console.error('Erro ao buscar dados mensais:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <div className="animate-pulse">
          <div className="h-6 bg-white/20 rounded mb-4"></div>
          <div className="h-32 bg-white/20 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#00A8E1]/20 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-[#00A8E1]" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Total de Usuários</p>
              <p className="text-white text-xl font-bold">{totalUsers}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Assinaturas Ativas</p>
              <p className="text-white text-xl font-bold">{activeUsers}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Taxa de Conversão</p>
              <p className="text-white text-xl font-bold">
                {totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0}%
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Receita Mensal</p>
              <p className="text-white text-xl font-bold">
                R$ {subscriptionData.reduce((sum, plan) => {
                  const price = plan.plan_name === 'PRO' ? 9.99 : 6.99;
                  return sum + (plan.count * price);
                }, 0).toFixed(2)}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Gráfico de Pizza - Distribuição de Planos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
      >
        <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Distribuição de Assinaturas
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Gráfico de Pizza Simples */}
          <div className="flex items-center justify-center">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full transform -rotate-90">
                {subscriptionData.map((plan, index) => {
                  const percentage = plan.percentage;
                  const strokeDasharray = `${percentage} ${100 - percentage}`;
                  const radius = 80;
                  const circumference = 2 * Math.PI * radius;
                  const strokeDashoffset = circumference - (percentage / 100) * circumference;
                  
                  return (
                    <circle
                      key={plan.plan_name}
                      cx="96"
                      cy="96"
                      r={radius}
                      fill="none"
                      stroke={plan.color}
                      strokeWidth="20"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={index === 0 ? 0 : -subscriptionData.slice(0, index).reduce((sum, p) => sum + p.percentage, 0) * circumference / 100}
                      className="transition-all duration-500"
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-white text-2xl font-bold">{totalUsers}</p>
                  <p className="text-white/60 text-sm">Total</p>
                </div>
              </div>
            </div>
          </div>

          {/* Legenda e Detalhes */}
          <div className="space-y-4">
            {subscriptionData.map((plan) => (
              <div key={plan.plan_name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: plan.color }}
                  />
                  <span className="text-white font-medium">{plan.plan_name}</span>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold">{plan.count} usuários</p>
                  <p className="text-white/60 text-sm">{plan.percentage}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Gráfico de Linhas - Crescimento Mensal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
      >
        <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Crescimento Mensal
        </h3>
        
        <div className="h-64 flex items-end justify-between gap-2">
          {monthlyData.map((month, index) => (
            <div key={month.month} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex flex-col gap-1">
                <div 
                  className="bg-[#00A8E1] rounded-t"
                  style={{ height: `${(month.pro / Math.max(...monthlyData.map(m => m.total))) * 200}px` }}
                  title={`PRO: ${month.pro}`}
                />
                <div 
                  className="bg-[#64748b] rounded-b"
                  style={{ height: `${(month.basic / Math.max(...monthlyData.map(m => m.total))) * 200}px` }}
                  title={`BÁSICO: ${month.basic}`}
                />
              </div>
              <p className="text-white/60 text-xs rotate-45 origin-left">{month.month}</p>
            </div>
          ))}
        </div>
        
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#00A8E1] rounded" />
            <span className="text-white/60 text-sm">PRO</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#64748b] rounded" />
            <span className="text-white/60 text-sm">BÁSICO</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SubscriptionChart;
