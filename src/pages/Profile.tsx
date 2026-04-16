import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown, Edit3, Camera, LogOut, Mail, Calendar, Clock, Heart, Star, Settings, ChevronRight, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.email?.split('@')[0] || 'Usuário',
    bio: 'Apaixonado por filmes e series.'
  });

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name: profileData.name })
        .eq('id', user?.id);

      if (error) throw error;

      toast.success('Perfil atualizado com sucesso!');
      setIsEditing(false);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar perfil');
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Sessao encerrada');
      window.location.href = '/login';
    } catch (error) {
      console.error('Erro no logout:', error);
      toast.error('Erro ao sair');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Voce precisa estar logado</p>
          <Button onClick={() => window.location.href = '/login'}>
            Fazer Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Header Background */}
      <div className="relative h-56 bg-gradient-to-r from-red-900/30 via-purple-900/20 to-blue-900/30">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black" />
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-24 relative z-10">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-6"
        >
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="relative group shrink-0">
              <Avatar className="w-28 h-28 md:w-32 md:h-32 border-4 border-black rounded-full bg-gradient-to-br from-red-600 to-red-800">
                <AvatarFallback className="text-4xl font-bold text-white">
                  {profileData.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <button className="absolute bottom-1 right-1 p-2 bg-white/20 hover:bg-white/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="text-2xl md:text-3xl font-bold text-white bg-white/10 border border-white/20 rounded-lg px-3 py-1"
                    autoFocus
                  />
                ) : (
                  <h1 className="text-2xl md:text-3xl font-bold text-white">{profileData.name}</h1>
                )}
                <Badge className="bg-red-600/20 text-red-400 border-red-600/30">
                  <Crown className="w-3 h-3 mr-1" />
                  Premium
                </Badge>
              </div>

              <p className="text-gray-400 mb-1 flex items-center justify-center md:justify-start gap-2">
                <Mail className="w-4 h-4" />
                {user.email}
              </p>

              <p className="text-gray-500 text-sm mb-4 flex items-center justify-center md:justify-start gap-2">
                <Calendar className="w-4 h-4" />
                Membro desde {new Date(user.created_at).toLocaleDateString('pt-BR')}
              </p>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                {isEditing ? (
                  <>
                    <Button size="sm" onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                      Salvar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                    <Edit3 className="w-4 h-4 mr-2" />
                    Editar Perfil
                  </Button>
                )}
                <Button size="sm" variant="destructive" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
        >
          <Card className="bg-white/5 border-white/10 p-4 text-center hover:bg-white/10 transition-colors">
            <div className="text-3xl font-bold text-white mb-1">147</div>
            <div className="text-sm text-gray-400">Filmes Assistidos</div>
          </Card>
          <Card className="bg-white/5 border-white/10 p-4 text-center hover:bg-white/10 transition-colors">
            <div className="text-3xl font-bold text-white mb-1">23</div>
            <div className="text-sm text-gray-400">Séries</div>
          </Card>
          <Card className="bg-white/5 border-white/10 p-4 text-center hover:bg-white/10 transition-colors">
            <div className="text-3xl font-bold text-white mb-1">47h</div>
            <div className="text-sm text-gray-400">Tempo Assistido</div>
          </Card>
          <Card className="bg-white/5 border-white/10 p-4 text-center hover:bg-white/10 transition-colors">
            <div className="text-3xl font-bold text-white mb-1">4.2</div>
            <div className="text-sm text-gray-400">Avaliação Média</div>
          </Card>
        </motion.div>

        {/* Menu Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <h2 className="text-lg font-semibold text-white mb-4">Minha Conta</h2>

          <Link to="/favorites" className="block">
            <Card className="bg-white/5 border-white/10 p-4 flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-600/20 rounded-lg">
                  <Heart className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <div className="font-medium text-white">Meus Favoritos</div>
                  <div className="text-sm text-gray-400">Filmes e séries salvos</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </Card>
          </Link>

          <Link to="/ratings" className="block">
            <Card className="bg-white/5 border-white/10 p-4 flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-600/20 rounded-lg">
                  <Star className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <div className="font-medium text-white">Minhas Avaliações</div>
                  <div className="text-sm text-gray-400">Filmes que você avaliou</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </Card>
          </Link>

          <Link to="/history" className="block">
            <Card className="bg-white/5 border-white/10 p-4 flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600/20 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="font-medium text-white">Histórico</div>
                  <div className="text-sm text-gray-400">Conteúdos assistidos</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </Card>
          </Link>

          <Link to="/settings" className="block">
            <Card className="bg-white/5 border-white/10 p-4 flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-600/20 rounded-lg">
                  <Settings className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <div className="font-medium text-white">Configurações</div>
                  <div className="text-sm text-gray-400">Preferências da conta</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </Card>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
