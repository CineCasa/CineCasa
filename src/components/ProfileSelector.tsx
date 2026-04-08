import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Lock, Check, X } from 'lucide-react';
import { useProfiles, Profile } from '@/hooks/useProfiles';
import { useNavigate } from 'react-router-dom';

export function ProfileSelector() {
  const { 
    profiles, 
    currentProfile, 
    loading, 
    createProfile, 
    deleteProfile, 
    switchProfile,
    maxProfiles,
    avatarColors 
  } = useProfiles();
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [newProfileName, setNewProfileName] = useState('');
  const [selectedColor, setSelectedColor] = useState(avatarColors[0]);
  const [isKids, setIsKids] = useState(false);
  const navigate = useNavigate();

  const handleCreateProfile = async () => {
    if (!newProfileName.trim()) return;
    
    await createProfile({
      name: newProfileName,
      color: selectedColor,
      is_kids: isKids,
    });
    
    setIsAdding(false);
    setNewProfileName('');
    setSelectedColor(avatarColors[0]);
    setIsKids(false);
  };

  const handleDeleteProfile = async (profile: Profile) => {
    if (confirm(`Tem certeza que deseja excluir o perfil "${profile.name}"?`)) {
      await deleteProfile(profile.id);
    }
  };

  const handleSelectProfile = (profile: Profile) => {
    switchProfile(profile.id);
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] flex flex-col items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Quem está assistindo?
        </h1>
        <p className="text-gray-400">
          Selecione um perfil para começar
        </p>
      </motion.div>

      {/* Profiles Grid */}
      <div className="flex flex-wrap justify-center gap-6 md:gap-8 max-w-4xl">
        <AnimatePresence>
          {profiles.map((profile, index) => (
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: index * 0.1 }}
              className="relative group"
            >
              {/* Profile Avatar */}
              <div
                onClick={() => handleSelectProfile(profile)}
                className={`w-28 h-28 md:w-32 md:h-32 rounded-lg cursor-pointer overflow-hidden transition-all duration-300 ${
                  currentProfile?.id === profile.id 
                    ? 'ring-4 ring-white scale-110' 
                    : 'hover:scale-105'
                }`}
                style={{ backgroundColor: profile.color }}
              >
                {profile.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white/80">
                    {profile.name.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Kids Badge */}
                {profile.is_kids && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                    KIDS
                  </div>
                )}
              </div>

              {/* Profile Name */}
              <p className="mt-3 text-center text-gray-400 group-hover:text-white transition-colors">
                {profile.name}
              </p>

              {/* Edit/Delete Buttons (hover) */}
              {!profile.is_main && (
                <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingProfile(profile);
                    }}
                    className="p-1.5 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors"
                  >
                    <Edit2 className="w-3 h-3 text-white" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProfile(profile);
                    }}
                    className="p-1.5 bg-red-600 rounded-full hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-3 h-3 text-white" />
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add Profile Button */}
        {profiles.length < maxProfiles && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: profiles.length * 0.1 }}
          >
            <button
              onClick={() => setIsAdding(true)}
              className="w-28 h-28 md:w-32 md:h-32 rounded-lg border-2 border-gray-600 flex flex-col items-center justify-center gap-2 hover:border-gray-400 transition-colors group"
            >
              <Plus className="w-12 h-12 text-gray-600 group-hover:text-gray-400" />
              <span className="text-xs text-gray-600 group-hover:text-gray-400">
                Adicionar
              </span>
            </button>
          </motion.div>
        )}
      </div>

      {/* Manage Profiles Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-16 px-8 py-3 border border-gray-600 text-gray-400 hover:text-white hover:border-white transition-colors rounded text-sm tracking-wider uppercase"
      >
        Gerenciar Perfis
      </motion.button>

      {/* Add Profile Modal */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#141414] rounded-lg p-8 max-w-md w-full"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Adicionar Perfil</h2>
              
              {/* Name Input */}
              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">Nome</label>
                <input
                  type="text"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder="Nome do perfil"
                  className="w-full bg-white/10 border border-white/20 rounded px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white/40"
                  maxLength={15}
                />
              </div>

              {/* Color Selection */}
              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">Cor</label>
                <div className="flex flex-wrap gap-2">
                  {avatarColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-10 h-10 rounded-full transition-all ${
                        selectedColor === color ? 'ring-2 ring-white scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Kids Toggle */}
              <div className="mb-8">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => setIsKids(!isKids)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      isKids ? 'bg-green-600' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      isKids ? 'translate-x-7' : 'translate-x-1'
                    }`} />
                  </div>
                  <span className="text-white">Perfil Infantil</span>
                  {isKids && <Lock className="w-4 h-4 text-green-500" />}
                </label>
                <p className="text-xs text-gray-500 mt-2 ml-[60px]">
                  Mostra apenas conteúdo adequado para crianças
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-3 border border-gray-600 text-gray-400 hover:text-white hover:border-white rounded transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateProfile}
                  disabled={!newProfileName.trim()}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Criar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ProfileSelector;
