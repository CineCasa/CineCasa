-- Alterar o tipo da coluna content_id de UUID para INTEGER
-- Isso requer dropar e recriar a coluna, pois a conversão direta pode falhar

-- 1. Dropar constraints que dependem de content_id
alter table if exists public.favorites drop constraint if exists favorites_user_content_unique;
alter table if exists public.favorites drop constraint if exists favorites_profile_id_content_id_key;
alter table if exists public.favorites drop constraint if exists favorites_content_id_fkey;

-- 2. Renomear coluna antiga (backup)
alter table if exists public.favorites rename column content_id to content_id_old;

-- 3. Criar nova coluna com tipo INTEGER
alter table if exists public.favorites add column content_id integer;

-- 4. Copiar dados da coluna antiga para a nova (se houver dados válidos)
-- Nota: UUIDs não podem ser convertidos diretamente para integer
-- Então esta migration assume que a tabela está vazia ou os dados serão perdidos

-- 5. Remover coluna antiga
alter table if exists public.favorites drop column if exists content_id_old;

-- 6. Criar índice e constraint na nova coluna
create index if not exists idx_favorites_content_id on public.favorites(content_id);

-- 7. Recriar constraint unique
alter table public.favorites add constraint favorites_user_content_unique 
  unique (user_id, content_id, content_type);

-- Comentário
comment on column public.favorites.content_id is 'ID do conteúdo (filme/série) como integer';
