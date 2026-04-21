-- Migration para alterar content_id de UUID para INTEGER de forma definitiva
-- Esta migration dropará a tabela e recriará com o schema correto

-- 1. Fazer backup dos dados existentes (se houver)
create table if not exists public.favorites_backup as select * from public.favorites;

-- 2. Dropar a tabela original
drop table if exists public.favorites cascade;

-- 3. Recriar a tabela com o schema correto
create table public.favorites (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content_id integer not null,
  content_type text not null,
  titulo text null,
  poster text null,
  banner text null,
  rating text null,
  year text null,
  genero text null,
  created_at timestamp with time zone null default now(),
  constraint favorites_pkey primary key (id),
  constraint favorites_user_content_unique unique (user_id, content_id, content_type)
);

-- 4. Criar índices
comment on table public.favorites is 'Tabela de favoritos dos usuários';
create index idx_favorites_user_id on public.favorites(user_id);
create index idx_favorites_content_id on public.favorites(content_id);
create index idx_favorites_content_type on public.favorites(content_type);

-- 5. Habilitar RLS
alter table public.favorites enable row level security;

-- 6. Criar políticas
create policy "Users can view own favorites"
  on public.favorites
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own favorites"
  on public.favorites
  for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own favorites"
  on public.favorites
  for delete
  using (auth.uid() = user_id);

-- Nota: Os dados antigos estão em favorites_backup mas não podem ser restaurados automaticamente
-- pois o tipo da coluna mudou de UUID para INTEGER
