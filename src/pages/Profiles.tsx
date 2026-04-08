import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { Plus, Edit2, Trash2, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  name: string;
  avatar?: string;
  isKids?: boolean;
}

export default function Profiles() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [isKids, setIsKids] = useState(false);

  useEffect(() => {
    fetchProfiles();
  }, [session]);

  const fetchProfiles = async () => {
    if (!session?.user?.id) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', session.user.id);
    
    if (error) {
      toast({
        title: 'Erro ao carregar perfis',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setProfiles(data || []);
    }
    setLoading(false);
  };

  const handleAddProfile = async () => {
    if (!session?.user?.id || !newProfileName.trim()) return;

    const { error } = await supabase
      .from('profiles')
      .insert([{
        user_id: session.user.id,
        name: newProfileName.trim(),
        is_kids: isKids,
      }]);

    if (error) {
      toast({
        title: 'Erro ao criar perfil',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Perfil criado',
        description: 'O perfil foi criado com sucesso.',
      });
      setNewProfileName('');
      setIsKids(false);
      setShowAddModal(false);
      fetchProfiles();
    }
  };

  const handleDeleteProfile = async (profileId: string) => {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', profileId);

    if (error) {
      toast({
        title: 'Erro ao excluir perfil',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Perfil excluído',
        description: 'O perfil foi excluído com sucesso.',
      });
      fetchProfiles();
    }
  };

  const handleSelectProfile = (profile: Profile) => {
    localStorage.setItem('selectedProfile', JSON.stringify(profile));
    navigate('/home');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#000401] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000401] flex flex-col items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Quem está assistindo?</h1>
        <p className="text-gray-400">Selecione um perfil para continuar</p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-4xl">
        {profiles.map((profile) => (
          <motion.div
            key={profile.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            className="group cursor-pointer"
            onClick={() => handleSelectProfile(profile)}
          >
            <div className="relative">
              <div className={`w-32 h-32 md:w-40 md:h-40 rounded-lg overflow-hidden border-2 border-transparent group-hover:border-white transition-all ${
                profile.isKids ? 'bg-blue-500/20' : 'bg-gray-700'
              }`}>
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-16 h-16 text-gray-500" />
                  </div>
                )}
              </div>
              
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Edit functionality
                  }}
                  className="p-1.5 bg-white/20 hover:bg-white/40 rounded-full"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteProfile(profile.id);
                  }}
                  className="p-1.5 bg-red-600/80 hover:bg-red-600 rounded-full"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <p className="mt-4 text-center text-lg text-gray-400 group-hover:text-white transition-colors">
              {profile.name}
            </p>
            {profile.isKids && (
              <p className="text-center text-sm text-blue-400">Kids</p>
            )}
          </motion.div>
        ))}

        {/* Add Profile Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          className="group cursor-pointer"
          onClick={() => setShowAddModal(true)}
        >
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-lg border-2 border-dashed border-gray-600 group-hover:border-white flex items-center justify-center transition-all">
            <Plus className="w-12 h-12 text-gray-600 group-hover:text-white transition-colors" />
          </div>
          <p className="mt-4 text-center text-lg text-gray-600 group-hover:text-white transition-colors">
            Adicionar perfil
          </p>
        </motion.div>
      </div>

      {/* Add Profile Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#000401] border border-white/10 rounded-xl w-full max-w-md p-6"
          >
            <h2 className="text-2xl font-bold mb-6">Adicionar Perfil</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Nome</label>
                <input
                  type="text"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-red-600"
                  placeholder="Nome do perfil"
                />
              </div>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isKids}
                  onChange={(e) => setIsKids(e.target.checked)}
                  className="w-5 h-5 rounded border-white/20 bg-white/5"
                />
                <span>Perfil infantil</span>
              </label>
            </div>

            <div className="flex justify-end gap-4 mt-8">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-6 py-2 border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddProfile}
                disabled={!newProfileName.trim()}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Criar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
