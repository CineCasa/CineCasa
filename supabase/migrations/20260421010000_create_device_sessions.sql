-- Criar tabela device_sessions para rastrear dispositivos dos usuários
create table if not exists public.device_sessions (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_fingerprint text not null,
  device_name text null,
  device_type text null,
  ip_address text null,
  user_agent text null,
  last_activity timestamp with time zone null default now(),
  created_at timestamp with time zone null default now(),
  constraint device_sessions_pkey primary key (id),
  constraint device_sessions_user_id_device_fingerprint_key unique (user_id, device_fingerprint)
) TABLESPACE pg_default;

-- Adicionar índices para melhor performance
create index if not exists idx_device_sessions_user_id on public.device_sessions(user_id);
create index if not exists idx_device_sessions_fingerprint on public.device_sessions(device_fingerprint);
create index if not exists idx_device_sessions_last_activity on public.device_sessions(last_activity);

-- Adicionar políticas RLS (Row Level Security)
alter table public.device_sessions enable row level security;

-- Política: usuários podem ver apenas seus próprios dispositivos
create policy "Users can view own devices"
  on public.device_sessions
  for select
  using (auth.uid() = user_id);

-- Política: usuários podem inserir/atualizar apenas seus próprios dispositivos
create policy "Users can insert own devices"
  on public.device_sessions
  for insert
  with check (auth.uid() = user_id);

-- Política: usuários podem atualizar apenas seus próprios dispositivos
create policy "Users can update own devices"
  on public.device_sessions
  for update
  using (auth.uid() = user_id);

-- Política: usuários podem deletar apenas seus próprios dispositivos
create policy "Users can delete own devices"
  on public.device_sessions
  for delete
  using (auth.uid() = user_id);

-- Comentários
dcomment on table public.device_sessions is 'Tabela para rastrear sessões de dispositivos dos usuários';
