import { useRatings } from '@/hooks/useRatings';
import { ThumbsUp, ThumbsDown, Play, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/components/AuthProvider';

export function ProfileRatings() {
  const { ratings, fetchRatings } = useRatings();
  const navigate = useNavigate();
  const { user } = useAuth();

  const liked = ratings.filter(r => r.rating_type === 'like');
  const disliked = ratings.filter(r => r.rating_type === 'dislike');

  const handleRemove = async (contentId: string, contentType: string) => {
    if (!user) return;
    await supabase.from('ratings').delete().eq('user_id', user.id).eq('content_id', contentId).eq('content_type', contentType);
    await fetchRatings();
    toast.success('Avaliação removida');
  };

  const handlePlay = (item: any) => {
    navigate(item.content_type === 'series' ? `/series/${item.content_id}` : `/movie/${item.content_id}`);
  };

  const RatingCard = ({ item, type }: { item: any, type: 'like' | 'dislike' }) => (
    <Card className="bg-white/5 border-white/10 overflow-hidden">
      <div className="flex gap-4 p-4">
        <div 
          className="w-24 h-36 bg-cover bg-center rounded-md cursor-pointer"
          style={{ backgroundImage: `url(${item.poster || item.banner || '/placeholder.jpg'})` }}
          onClick={() => handlePlay(item)}
        />
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <h4 className="font-semibold text-white">{item.titulo}</h4>
            {type === 'like' ? <ThumbsUp className="w-5 h-5 text-green-500"/> : <ThumbsDown className="w-5 h-5 text-red-500"/>}
          </div>
          <p className="text-sm text-gray-400">{item.content_type === 'series' ? 'Série' : 'Filme'}</p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" variant="ghost" className="text-white" onClick={() => handlePlay(item)}><Play className="w-4 h-4 mr-1"/> Assistir</Button>
            <Button size="sm" variant="ghost" className="text-red-400" onClick={() => handleRemove(item.content_id, item.content_type)}><Trash2 className="w-4 h-4 mr-1"/> Remover</Button>
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><ThumbsUp className="w-5 h-5 text-green-500"/> Gostei ({liked.length})</h3>
        {liked.length === 0 ? <p className="text-gray-400">Você ainda não curtiu nenhum conteúdo.</p> : 
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{liked.map(item => <RatingCard key={item.id} item={item} type="like"/>)}</div>}
      </div>
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><ThumbsDown className="w-5 h-5 text-red-500"/> Não Gostei ({disliked.length})</h3>
        {disliked.length === 0 ? <p className="text-gray-400">Você ainda não avaliou negativamente nenhum conteúdo.</p> : 
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{disliked.map(item => <RatingCard key={item.id} item={item} type="dislike"/>)}</div>}
      </div>
    </div>
  );
}
