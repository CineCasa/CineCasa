import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Users, CheckCircle, XCircle, ShieldCheck, Mail, Calendar, CreditCard, LogOut, Home } from "lucide-react";

interface Profile {
  id: string;
  email: string;
  plan: string;
  is_active: boolean;
  is_admin: boolean;
  updated_at: string;
}

const Admin = () => {
  const { isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles" as any)
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setProfiles((data as any) || []);
    } catch (error: any) {
      toast.error("Erro ao carregar perfis: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchProfiles();
    }
  }, [isAdmin]);

  const handleUpdateStatus = async (id: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles" as any)
        .update({ is_active: active })
        .eq("id", id);

      if (error) throw error;
      toast.success(`Usuário ${active ? "ativado" : "desativado"} com sucesso!`);
      fetchProfiles();
    } catch (error: any) {
      toast.error("Erro ao atualizar status: " + error.message);
    }
  };

  const handleUpdatePlan = async (id: string, plan: string) => {
    try {
      const { error } = await supabase
        .from("profiles" as any)
        .update({ plan: plan, is_active: true })
        .eq("id", id);

      if (error) throw error;
      toast.success(`Plano atualizado para ${plan.toUpperCase()}!`);
      fetchProfiles();
    } catch (error: any) {
      toast.error("Erro ao atualizar plano: " + error.message);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white p-4">
        <div className="text-center">
          <XCircle size={64} className="mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold">Acesso Negado</h1>
          <p className="text-white/60">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-24 pb-12 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="text-[#00A8E1]" size={32} />
              <h1 className="text-3xl font-black tracking-tighter italic">PAINEL ADMINISTRATIVO</h1>
            </div>
            <p className="text-white/40">Gerencie usuários, planos e liberações do sistema.</p>
          </div>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg transition-colors text-sm font-bold"
            >
              <Home size={16} /> Início
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg transition-all text-sm font-bold"
            >
              <LogOut size={16} /> Sair
            </button>
            <div className="bg-[#151515] p-4 rounded-xl border border-white/5 flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-white/40 mb-1">Total Usuários</span>
              <span className="text-2xl font-black text-[#00A8E1]">{profiles.length}</span>
            </div>
            <div className="bg-[#151515] p-4 rounded-xl border border-white/5 flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-white/40 mb-1">Ativos</span>
              <span className="text-2xl font-black text-green-500">
                {profiles.filter(p => p.is_active).length}
              </span>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-[#00A8E1] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white/40 animate-pulse">Carregando usuários...</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {profiles.map((profile) => (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#151515] rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${profile.is_active ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                      <Users size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-lg">{profile.email}</span>
                        {profile.is_admin && (
                          <span className="bg-[#00A8E1]/20 text-[#00A8E1] text-[10px] font-black px-2 py-0.5 rounded uppercase">Admin</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs text-white/40">
                         <span className="flex items-center gap-1"><Mail size={12} /> {profile.id.slice(0, 8)}...</span>
                         <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(profile.updated_at).toLocaleDateString()}</span>
                         <span className={`flex items-center gap-1 font-bold ${profile.plan === 'pro' ? 'text-amber-500' : 'text-[#00A8E1]'}`}>
                           <CreditCard size={12} /> PLANO: {profile.plan.toUpperCase()}
                         </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {profile.is_active ? (
                      <button 
                        onClick={() => handleUpdateStatus(profile.id, false)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 text-sm font-bold rounded-lg transition-all hover:text-white"
                      >
                        <XCircle size={18} /> DESATIVAR
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleUpdateStatus(profile.id, true)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-500 hover:bg-green-500 text-sm font-bold rounded-lg transition-all hover:text-white"
                      >
                        <CheckCircle size={18} /> ATIVAR
                      </button>
                    )}

                    <div className="h-8 w-px bg-white/5 mx-2 hidden lg:block" />

                    <div className="flex gap-2">
                       <button 
                        onClick={() => handleUpdatePlan(profile.id, 'basic')}
                        className={`px-3 py-2 text-[10px] font-black rounded-lg transition-all ${profile.plan === 'basic' ? 'bg-[#00A8E1] text-white shadow-[0_0_15px_rgba(0,168,225,0.4)]' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                       >
                         BASIC
                       </button>
                       <button 
                        onClick={() => handleUpdatePlan(profile.id, 'pro')}
                        className={`px-3 py-2 text-[10px] font-black rounded-lg transition-all ${profile.plan === 'pro' ? 'bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                       >
                         PRO
                       </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
