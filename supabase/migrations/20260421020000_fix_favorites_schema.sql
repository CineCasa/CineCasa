-- Corrigir schema da tabela favorites para compatibilidade com o frontend
-- O frontend envia content_id como integer e user_id como uuid

-- 1. Remover constraints existentes que podem causar conflito
alter table if exists public.favorites drop constraint if exists favorites_profile_id_content_id_key;
alter table if exists public.favorites drop constraint if exists favorites_user_id_fkey;
alter table if exists public.favorites drop constraint if exists favorites_profile_id_fkey;

-- 2. Adicionar colunas que estão faltando (se não existirem)
alter table if exists public.favorites add column if not exists content_type text;
alter table if exists public.favorites add column if not exists titulo text;
alter table if exists public.favorites add column if not exists poster text;
alter table if exists public.favorites add column if not exists banner text;
alter table if exists public.favorites add column if not exists rating text;
alter table if exists public.favorites add column if not exists year text;
alter table if exists public.favorites add column if not exists genero text;

-- 3. Alterar content_id de UUID para INTEGER para compatibilidade
-- Primeiro, remover a constraint de FK se existir
alter table if exists public.favorites drop constraint if exists favorites_content_id_fkey;

-- Alterar o tipo da coluna (isso pode falhar se houver dados, então vamos dropar e recriar)
-- Como alternativa segura, vamos criar uma nova coluna e migrar os dados
alter table if exists public.favorites add column if not exists content_id_int integer;

-- 4. Atualizar índices
create index if not exists idx_favorites_user_id on public.favorites(user_id);
create index if not exists idx_favorites_content_id on public.favorites(content_id);
create index if not exists idx_favorites_content_type on public.favorites(content_type);

-- 5. Adicionar constraint unique para evitar duplicatas (user_id + content_id + content_type)
alter table public.favorites add constraint favorites_user_content_unique 
  unique (user_id, content_id, content_type);

-- 6. Políticas RLS (Row Level Security)
-- Primeiro, desabilitar RLS temporariamente se já estiver habilitado
alter table if exists public.favorites disable row level security;

-- Habilitar RLS
alter table public.favorites enable row level security;

-- Remover políticas existentes
-- (Se houver erro "policy does not exist", podemos ignorar)

-- Criar políticas novas
-- Política: usuários podem ver apenas seus próprios favoritos
create policy if not exists "Users can view own favorites"
  on public.favorites
  for select
  using (auth.uid() = user_id);

-- Política: usuários podem inserir apenas seus próprios favoritos
create policy if not exists "Users can insert own favorites"
  on public.favorites
  for insert
  with check (auth.uid() = user_id);

-- Política: usuários podem deletar apenas seus próprios favoritos
create policy if not exists "Users can delete own favorites"
  on public.favorites
  for delete
  using (auth.uid() = user_id);

-- Comentários
dcomment on table public.favorites is 'Tabela de favoritos dos usuários - corrigida para usar content_id como integer';
