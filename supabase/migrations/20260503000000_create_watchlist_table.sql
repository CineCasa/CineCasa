-- Migration: Cria tabela watchlist (Minha Lista)
-- Data: 2026-05-03
-- Descrição: Tabela para armazenar os itens da "Minha Lista" dos usuários

-- Criar tabela watchlist
CREATE TABLE IF NOT EXISTS public.watchlist (
  id TEXT NOT NULL,
  conteudo_id TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  user_id UUID NULL,
  content_id INTEGER NOT NULL,
  content_type TEXT NOT NULL,
  titulo TEXT NOT NULL,
  poster TEXT NULL,
  banner TEXT NULL,
  rating TEXT NULL,
  year TEXT NULL,
  genero TEXT NULL,
  CONSTRAINT watchlist_pkey PRIMARY KEY (id),
  CONSTRAINT watchlist_user_id_content_id_content_type_key UNIQUE (user_id, content_id, content_type),
  CONSTRAINT watchlist_content_type_check CHECK (
    content_type = ANY (ARRAY['movie'::TEXT, 'series'::TEXT])
  )
) TABLESPACE pg_default;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON public.watchlist USING btree (user_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_watchlist_content ON public.watchlist USING btree (content_id, content_type) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_watchlist_created_at ON public.watchlist USING btree (created_at DESC) TABLESPACE pg_default;

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;

-- Política: Usuários só podem ver seus próprios itens
CREATE POLICY "watchlist_select_own" ON public.watchlist
  FOR SELECT USING (auth.uid() = user_id);

-- Política: Usuários só podem inserir seus próprios itens
CREATE POLICY "watchlist_insert_own" ON public.watchlist
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política: Usuários só podem atualizar seus próprios itens
CREATE POLICY "watchlist_update_own" ON public.watchlist
  FOR UPDATE USING (auth.uid() = user_id);

-- Política: Usuários só podem deletar seus próprios itens
CREATE POLICY "watchlist_delete_own" ON public.watchlist
  FOR DELETE USING (auth.uid() = user_id);

-- Comentários na tabela
COMMENT ON TABLE public.watchlist IS 'Tabela para armazenar a "Minha Lista" (Watchlist) dos usuários';
COMMENT ON COLUMN public.watchlist.content_type IS 'Tipo do conteúdo: movie ou series';
COMMENT ON COLUMN public.watchlist.content_id IS 'ID do conteúdo (TMDB ID)';
COMMENT ON COLUMN public.watchlist.titulo IS 'Título do filme ou série';
