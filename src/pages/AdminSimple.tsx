import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const AdminPanel = () => {
  const [sections, setSections] = useState([]);
  const [newTitle, setNewTitle] = useState('');

  const fetchSections = async () => {
    const { data } = await supabase.from('home_sections').select('*').order('order_index');
    setSections(data || []);
  };

  useEffect(() => { fetchSections(); }, []);

  const updateSectionTitle = async (id, title) => {
    const { error } = await supabase
      .from('home_sections')
      .update({ title })
      .eq('id', id);

    if (!error) {
      toast.success("Home atualizada!");
      fetchSections();
    }
  };

  return (
    <div className="p-8 bg-zinc-950 min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-8">Painel Administrativo v4</h1>
      
      <section className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
        <h2 className="text-xl font-semibold mb-4">Gerenciar Fileiras da Home</h2>
        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.id} className="flex gap-4 items-center bg-zinc-800 p-3 rounded-lg">
              <span className="text-zinc-500 w-8">#{section.order_index}</span>
              <Input 
                defaultValue={section.title} 
                className="bg-zinc-900 border-zinc-700"
                onBlur={(e) => updateSectionTitle(section.id, e.target.value)}
              />
              <div className="text-xs text-zinc-500 uppercase">{section.query_type}</div>
              <Button variant="destructive" size="sm">Remover</Button>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-600/10 border border-blue-600/20 p-6 rounded-xl">
          <h3 className="text-blue-500 font-bold">Total de Usuários</h3>
          <p className="text-3xl font-bold mt-2">Carregando...</p>
        </div>
        {/* Adicione mais cards de estatísticas aqui */}
      </section>
    </div>
  );
};
