import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Crown, Edit3, Camera, Play, Trophy, Film, Zap, TrendingUp, ThumbsUp, ThumbsDown, LogOut } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useRatings } from '@/hooks/useRatings';

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({ name: user?.email?.split('@')[0] || 'Usuário', bio: 'Apaixonado por filmes e séries.' });

  const handleSave = async () => {
    try {
      await supabase.from('profiles').update({ name: profileData.name }).eq('user_id', user?.id);
      toast({ title: 'Perfil atualizado' });
      setIsEditing(false);
    } catch {
      toast({ title: 'Erro ao salvar', variant: 'destructive' });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: 'Sessão encerrada' });
    navigate('/login');
  };

  if (!user) return <div className="min-h-screen bg-black flex items-center justify-center"><Button onClick={() => navigate('/login')}>Entrar</Button></div>;

  return (
    <div className="min-h-screen bg-black pb-20">
      <div className="relative h-48 bg-gradient-to-r from-red-900/20 to-blue-900/20">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black" />
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-20 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row items-start gap-6 mb-8">
          <div className="relative group">
            <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-black rounded-full bg-gradient-to-br from-red-600 to-red-800">
              <AvatarFallback className="text-3xl font-bold">{profileData.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <button className="absolute bottom-2 right-2 p-2 bg-white/20 rounded-full opacity-0 group-hover:opacity-100"><Camera className="w-4 h-4" /></button>
          </div>

          <div className="flex-1 mb-2">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold text-white">{profileData.name}</h1>
              <Badge className="bg-red-600/20 text-red-400"><Crown className="w-3 h-3 mr-1" />Premium</Badge>
            </div>
            <p className="text-gray-400">{profileData.bio}</p>
            <div className="flex gap-3 mt-4">
              <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}><Edit3 className="w-4 h-4 mr-2" />{isEditing ? 'Salvar' : 'Editar'}</Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/profiles')}><Play className="w-4 h-4 mr-2" />Trocar Perfil</Button>
              <Button variant="destructive" size="sm" onClick={handleLogout}><LogOut className="w-4 h-4 mr-2" />Sair</Button>
            </div>
          </div>
        </motion.div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="achievements">Conquistas</TabsTrigger>
            <TabsTrigger value="ratings">Avaliações</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-white/5 border-white/10 p-4"><div className="text-2xl font-bold text-white">147</div><div className="text-sm text-gray-400">Filmes</div></Card>
              <Card className="bg-white/5 border-white/10 p-4"><div className="text-2xl font-bold text-white">23</div><div className="text-sm text-gray-400">Séries</div></Card>
              <Card className="bg-white/5 border-white/10 p-4"><div className="text-2xl font-bold text-white">47h</div><div className="text-sm text-gray-400">Assistidos</div></Card>
              <Card className="bg-white/5 border-white/10 p-4"><div className="text-2xl font-bold text-white">4.2</div><div className="text-sm text-gray-400">Avaliação</div></Card>
            </div>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Conquistas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[{ icon: Trophy, title: 'Maratonista', desc: '10 episódios em um dia', color: 'text-yellow-500' }, { icon: Film, title: 'Cineasta', desc: '100 filmes assistidos', color: 'text-blue-500' }, { icon: Zap, title: 'Serial Killer', desc: '10 séries completadas', color: 'text-purple-500' }, { icon: TrendingUp, title: 'Em Alta', desc: '7 dias seguidos', color: 'text-green-500' }].map((ach, i) => (
                <Card key={i} className="bg-white/5 border-white/10 p-4 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center ${ach.color}`}><ach.icon className="w-6 h-6" /></div>
                  <div><div className="font-medium text-white">{ach.title}</div><div className="text-sm text-gray-400">{ach.desc}</div></div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="ratings" className="space-y-6">
            <ProfileRatings />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card className="bg-white/5 border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Configurações</h3>
              <div className="space-y-4">
                <div><label className="text-sm text-gray-400">Nome</label><input type="text" value={profileData.name} onChange={(e) => setProfileData({ ...profileData, name: e.target.value })} className="w-full mt-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" /></div>
                <div><label className="text-sm text-gray-400">Bio</label><textarea value={profileData.bio} onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })} className="w-full mt-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" rows={3} /></div>
                <Button onClick={handleSave} className="bg-red-600 hover:bg-red-700">Salvar</Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
