import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/AuthProvider';
// CORRIGIDO: caminho correto do supabase client
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit2, Trash2, User, Baby } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/**
 * CORREÇÕES:
 * - Import supabase: @/lib/supabase → @/integrations/supabase/client
 * - useAuth retorna {user}, não {session} → corrigido
 * - Tabela 'profiles' no banco tem email/is_admin/display_name (é a conta do usuário)
 * - Sub-perfis usam tabela 'user_profiles': id, user_id, name, avatar_url, plan, points
 * - Insert/delete agora usa user_profiles com os campos corretos
 */

interface UserProfile {
  id: string;
  user_id: string;
  name: string | null;
  avatar_url: string | null;
  plan: string | null;
  points: number | null;
  created_at: string;
}

const AVATAR_COLORS = [
  '#e50914', '#564d4d', '#b20710', '#221f1f',
  '#f5f5f1', '#46d369', '#0071eb', '#e87c03',
];

const DEFAULT_AVATARS = [
  '/avatars/avatar-1.png',
  '/avatars/avatar-2.png',
  '/avatars/avatar-3.png',
  '/avatars/avatar-4.png',
  '/avatars/avatar-5.png',
];

export default function Profiles() {
  const navigate = useNavigate();
  // CORRIGIDO: useAuth retorna {user}, não {session}
  const { user } = useAuth();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(DEFAULT_AVATARS[0]);
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (user?.id) fetchProfiles();
  }, [user?.id]);

  const fetchProfiles = async () => {
    if (!user?.id) return;

    setLoading(true);
    // CORRIGIDO: usa user_profiles (sub-perfis) em vez de profiles (conta do usuário)
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, user_id, name, avatar_url, plan, points, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      toast({ title: 'Erro ao carregar perfis', description: error.message, variant: 'destructive' });
    } else {
      setProfiles(data || []);
    }
    setLoading(false);
  };

  const handleAddProfile = async () => {
    if (!user?.id || !newProfileName.trim()) return;

    // CORRIGIDO: insere em user_profiles com campos reais da tabela
    const { error } = await supabase
      .from('user_profiles')
      .insert([{
        user_id: user.id,
        name: newProfileName.trim(),
        avatar_url: selectedAvatar,
        plan: 'free',
        points: 0,
      }]);

    if (error) {
      toast({ title: 'Erro ao criar perfil', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Perfil criado com sucesso!' });
      setNewProfileName('');
      setSelectedAvatar(DEFAULT_AVATARS[0]);
      setShowAddModal(false);
      fetchProfiles();
    }
  };

  const handleEditProfile = async () => {
    if (!editingProfile || !newProfileName.trim()) return;

    const { error } = await supabase
      .from('user_profiles')
      .update({ name: newProfileName.trim(), avatar_url: selectedAvatar })
      .eq('id', editingProfile.id);

    if (error) {
      toast({ title: 'Erro ao atualizar perfil', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Perfil atualizado!' });
      setEditingProfile(null);
      setNewProfileName('');
      fetchProfiles();
    }
  };

  const handleDeleteProfile = async (profileId: string) => {
    if (profiles.length <= 1) {
      toast({ title: 'Não é possível remover o único perfil', variant: 'destructive' });
      return;
    }

    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', profileId);

    if (error) {
      toast({ title: 'Erro ao remover perfil', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Perfil removido' });
      fetchProfiles();
    }
  };

  const handleSelectProfile = (profile: UserProfile) => {
    localStorage.setItem('current_profile_id', profile.id);
    localStorage.setItem('current_profile_name', profile.name || 'Usuário');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#00d9ff] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-2">
          Quem está assistindo?
        </h1>
        <p className="text-gray-400 text-center mb-10">Selecione seu perfil para continuar</p>

        {/* Grade de perfis */}
        <div className="flex flex-wrap justify-center gap-6 mb-10">
          {profiles.map(profile => (
            <motion.div
              key={profile.id}
              whileHover={{ scale: 1.05 }}
              className="group relative flex flex-col items-center gap-2 cursor-pointer"
              onClick={() => handleSelectProfile(profile)}
            >
              <div className="relative w-24 h-24 md:w-28 md:h-28">
                <div className="w-full h-full rounded-lg overflow-hidden bg-gray-700 border-2 border-transparent group-hover:border-[#00d9ff] transition-colors">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.name || ''}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-600">
                      <User className="w-10 h-10 text-gray-300" />
                    </div>
                  )}
                </div>
                {/* Ações */}
                <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingProfile(profile);
                      setNewProfileName(profile.name || '');
                      setSelectedAvatar(profile.avatar_url || DEFAULT_AVATARS[0]);
                    }}
                    className="w-6 h-6 bg-[#00d9ff] rounded-full flex items-center justify-center hover:bg-[#00c4e6]"
                  >
                    <Edit2 className="w-3 h-3 text-black" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteProfile(profile.id); }}
                    className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    <Trash2 className="w-3 h-3 text-white" />
                  </button>
                </div>
              </div>
              <span className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">
                {profile.name || 'Sem nome'}
              </span>
              {profile.plan && profile.plan !== 'free' && (
                <span className="text-xs text-[#00d9ff] font-bold uppercase">{profile.plan}</span>
              )}
            </motion.div>
          ))}

          {/* Botão adicionar perfil */}
          {profiles.length < 5 && (
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex flex-col items-center gap-2 cursor-pointer group"
              onClick={() => setShowAddModal(true)}
            >
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-lg border-2 border-dashed border-gray-600 group-hover:border-[#00d9ff] flex items-center justify-center transition-colors">
                <Plus className="w-10 h-10 text-gray-500 group-hover:text-[#00d9ff] transition-colors" />
              </div>
              <span className="text-sm text-gray-400 group-hover:text-white transition-colors">
                Adicionar perfil
              </span>
            </motion.div>
          )}
        </div>

        {/* Link para gerenciar perfis */}
        <div className="text-center">
          <button
            onClick={() => navigate('/profile')}
            className="text-gray-400 hover:text-white text-sm border border-gray-600 hover:border-white px-6 py-2 rounded transition-colors"
          >
            Gerenciar perfis
          </button>
        </div>
      </motion.div>

      {/* Modal adicionar/editar */}
      {(showAddModal || editingProfile) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => { setShowAddModal(false); setEditingProfile(null); setNewProfileName(''); }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">
              {editingProfile ? 'Editar perfil' : 'Novo perfil'}
            </h2>

            {/* Seleção de avatar */}
            <div className="flex gap-3 mb-4 overflow-x-auto pb-1">
              {DEFAULT_AVATARS.map((av, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedAvatar(av)}
                  className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-colors ${
                    selectedAvatar === av ? 'border-[#00d9ff]' : 'border-transparent'
                  }`}
                >
                  <img src={av} alt={`Avatar ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            <input
              type="text"
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') editingProfile ? handleEditProfile() : handleAddProfile(); }}
              placeholder="Nome do perfil"
              maxLength={30}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#00d9ff] mb-4"
              autoFocus
            />

            <div className="flex gap-3">
              <button
                onClick={() => { setShowAddModal(false); setEditingProfile(null); setNewProfileName(''); }}
                className="flex-1 py-2.5 border border-gray-600 rounded-xl text-gray-300 hover:border-white hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={editingProfile ? handleEditProfile : handleAddProfile}
                disabled={!newProfileName.trim()}
                className="flex-1 py-2.5 bg-[#00d9ff] text-black font-bold rounded-xl hover:bg-[#00c4e6] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {editingProfile ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
