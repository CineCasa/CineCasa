import { motion } from 'framer-motion';
import { TrendingUp, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MonthlyActivity {
  month: string;
  hours: number;
}

interface StatsChartSectionProps {
  monthlyActivity: MonthlyActivity[];
  totalHoursThisMonth: number;
  growthPercentage: number;
}

export function StatsChartSection({ 
  monthlyActivity, 
  totalHoursThisMonth, 
  growthPercentage 
}: StatsChartSectionProps) {
  const maxHours = Math.max(...monthlyActivity.map(m => m.hours), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl overflow-hidden",
        "bg-[#0f172a]/80 border border-white/10"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <BarChart3 className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Estatísticas</h3>
            <p className="text-xs text-gray-500">Seu resumo de atividade</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-3xl font-bold text-white">{totalHoursThisMonth}h</p>
            <p className="text-sm text-gray-400">Este mês</p>
          </div>
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-full text-sm",
            growthPercentage >= 0 ? "text-green-400 bg-green-500/20" : "text-red-400 bg-red-500/20"
          )}>
            <TrendingUp className="w-4 h-4" />
            <span>{growthPercentage >= 0 ? '+' : ''}{growthPercentage}%</span>
          </div>
        </div>

        {/* Chart */}
        <div className="h-32 flex items-end justify-between gap-2">
          {monthlyActivity.map((month, index) => {
            const height = (month.hours / maxHours) * 100;
            const isCurrentMonth = index === monthlyActivity.length - 1;
            
            return (
              <div key={month.month} className="flex-1 flex flex-col items-center gap-2">
                {/* Bar */}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className={cn(
                    "w-full max-w-[40px] rounded-t-lg relative",
                    isCurrentMonth 
                      ? "bg-gradient-to-t from-cyan-500 to-cyan-400"
                      : "bg-gradient-to-t from-cyan-500/30 to-cyan-400/30"
                  )}
                >
                  {/* Glow for current month */}
                  {isCurrentMonth && (
                    <div className="absolute inset-0 bg-cyan-400 blur-lg opacity-50" />
                  )}
                </motion.div>
                
                {/* Label */}
                <span className={cn(
                  "text-[10px] font-medium",
                  isCurrentMonth ? "text-cyan-400" : "text-gray-500"
                )}>
                  {month.month}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

export default StatsChartSection;
