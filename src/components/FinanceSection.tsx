import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { DollarSign, TrendingUp, Users, CreditCard, Calendar, ArrowUp, ArrowDown, CheckCircle } from "lucide-react";

interface MonthlyData {
  month: string;
  count: number;
  revenue: number;
  plans: {
    basic: number;
    pro: number;
  };
}

interface FinanceStats {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  monthlyRevenue: number;
  monthlyData: MonthlyData[];
}

const FinanceSection = () => {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    
    const fetchFinanceData = async () => {
      try {
        // Buscar todos os perfis
        const { data: profiles, error } = await supabase
          .from("profiles" as any)
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        const allProfiles = profiles || [];
        
        // Calcular estatísticas gerais
        const activeUsers = allProfiles.filter((p: any) => p.is_active).length;
        const basicUsers = allProfiles.filter((p: any) => p.plan === "basic" && p.is_active).length;
        const proUsers = allProfiles.filter((p: any) => p.plan === "pro" && p.is_active).length;
        
        const totalRevenue = (basicUsers * 6.99) + (proUsers * 9.99);
        const monthlyRevenue = totalRevenue; // Simplificado - pode ser calculado por mês

        // Agrupar dados por mês
        const monthlyData: MonthlyData[] = [];
        const monthMap = new Map();

        allProfiles.forEach((profile: any) => {
          if (!profile.created_at) return;
          
          const date = new Date(profile.created_at);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const monthName = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
          
          if (!monthMap.has(monthKey)) {
            monthMap.set(monthKey, {
              month: monthName,
              count: 0,
              revenue: 0,
              plans: { basic: 0, pro: 0 }
            });
          }
          
          const monthData = monthMap.get(monthKey);
          monthData.count++;
          
          if (profile.is_active) {
            if (profile.plan === "basic") {
              monthData.plans.basic++;
              monthData.revenue += 6.99;
            } else if (profile.plan === "pro") {
              monthData.plans.pro++;
              monthData.revenue += 9.99;
            }
          }
        });

        monthlyData.push(...Array.from(monthMap.values()).sort((a, b) => 
          new Date(a.month).getTime() - new Date(b.month).getTime()
        ));

        setStats({
          totalUsers: allProfiles.length,
          activeUsers,
          totalRevenue,
          monthlyRevenue,
          monthlyData: monthlyData.slice(-12) // Últimos 12 meses
        });

      } catch (error) {
        console.error("Erro ao buscar dados financeiros:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFinanceData();
  }, [isAdmin]);

  if (!isAdmin) return null;

  if (loading) {
    return (
      <div className="bg-[#1a1a1a] rounded-lg p-6 border border-white/10">
        <div className="animate-pulse">
          <div className="h-6 bg-white/10 rounded mb-4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-white/10 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const maxRevenue = Math.max(...stats.monthlyData.map(d => d.revenue), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#1a1a1a] rounded-lg p-6 border border-white/10"
    >
      <div className="flex items-center gap-3 mb-6">
        <DollarSign className="text-green-500" size={24} />
        <h2 className="text-xl font-bold text-white">Financeiro</h2>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#2a2a2a] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="text-blue-400" size={20} />
            <span className="text-white/60 text-sm">Total Usuários</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
        </div>

        <div className="bg-[#2a2a2a] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="text-green-400" size={20} />
            <span className="text-white/60 text-sm">Ativos</span>
          </div>
          <div className="text-2xl font-bold text-green-400">{stats.activeUsers}</div>
        </div>

        <div className="bg-[#2a2a2a] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="text-yellow-400" size={20} />
            <span className="text-white/60 text-sm">Receita Total</span>
          </div>
          <div className="text-2xl font-bold text-yellow-400">
            R$ {stats.totalRevenue.toFixed(2)}
          </div>
        </div>

        <div className="bg-[#2a2a2a] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="text-purple-400" size={20} />
            <span className="text-white/60 text-sm">Receita Mensal</span>
          </div>
          <div className="text-2xl font-bold text-purple-400">
            R$ {stats.monthlyRevenue.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Gráfico de Barras Mensal */}
      <div className="bg-[#2a2a2a] rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Assinaturas Mensais</h3>
        
        <div className="space-y-3">
          {stats.monthlyData.map((data, index) => (
            <div key={data.month} className="flex items-center gap-4">
              <div className="w-20 text-sm text-white/60">
                {data.month}
              </div>
              
              <div className="flex-1 relative">
                <div className="h-8 bg-[#3a3a3a] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(data.revenue / maxRevenue) * 100}%` }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                    className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full flex items-center px-3"
                  >
                    <div className="flex items-center gap-2 text-xs text-white font-medium">
                      <span>{data.count} usuários</span>
                      <span>•</span>
                      <span>R$ {data.revenue.toFixed(2)}</span>
                    </div>
                  </motion.div>
                </div>
                
                {/* Indicadores de planos */}
                <div className="absolute top-0 right-0 h-8 flex items-center gap-1">
                  {data.plans.basic > 0 && (
                    <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded">
                      Básico: {data.plans.basic}
                    </span>
                  )}
                  {data.plans.pro > 0 && (
                    <span className="bg-purple-500 text-white text-xs px-1.5 py-0.5 rounded">
                      Pro: {data.plans.pro}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {stats.monthlyData.length === 0 && (
          <div className="text-center py-8 text-white/40">
            <Calendar size={48} className="mx-auto mb-2 opacity-50" />
            <p>Nenhum dado mensal disponível</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default FinanceSection;
