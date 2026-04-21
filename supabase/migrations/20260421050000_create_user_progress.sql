-- Criar tabela user_progress para rastrear progresso de vídeo dos usuários
-- Esta tabela é usada tanto pelo player quanto pela seção "Continuar Assistindo"

create table if not exists public.user_progress (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content_id integer not null,
  content_type text not null, -- 'movie' ou 'series'
  "current_time" integer not null default 0, -- segundos
  duration integer not null default 0, -- segundos
  progress integer not null default 0, -- porcentagem 0-100
  episode_id integer null, -- apenas para séries
  season_number integer null, -- apenas para séries
  episode_number integer null, -- apenas para séries
  updated_at timestamp with time zone not null default now(),
  constraint user_progress_pkey primary key (id),
  constraint user_progress_user_content_unique unique (user_id, content_id, content_type, episode_id)
) tablespace pg_default;

-- Criar índices para performance
comment on table public.user_progress is 'Tabela para rastrear progresso de vídeo dos usuários';
create index idx_user_progress_user_id on public.user_progress(user_id);
create index idx_user_progress_content_id on public.user_progress(content_id);
create index idx_user_progress_content_type on public.user_progress(content_type);
create index idx_user_progress_updated_at on public.user_progress(updated_at desc);

-- Habilitar RLS
alter table public.user_progress enable row level security;

-- Políticas de segurança
create policy "Users can view own progress"
  on public.user_progress
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own progress"
  on public.user_progress
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own progress"
  on public.user_progress
  for update
  using (auth.uid() = user_id);

create policy "Users can delete own progress"
  on public.user_progress
  for delete
  using (auth.uid() = user_id);
