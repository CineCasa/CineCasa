
-- Drop old tables
DROP TABLE IF EXISTS public.movies CASCADE;
DROP TABLE IF EXISTS public.movies_kids CASCADE;
DROP TABLE IF EXISTS public.series CASCADE;
DROP TABLE IF EXISTS public.series_kids CASCADE;

-- Create cinema table (filmes gerais)
CREATE TABLE public.cinema (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  titulo text NOT NULL,
  tmdb_id text,
  url text,
  trailer text,
  year text,
  rating text,
  description text,
  poster text,
  category text,
  type text DEFAULT 'movie',
  created_at timestamptz DEFAULT now()
);

-- Create filmes_kids table
CREATE TABLE public.filmes_kids (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  titulo text NOT NULL,
  url text,
  genero text,
  year text,
  rating text,
  description text,
  poster text,
  type text DEFAULT 'movie',
  created_at timestamptz DEFAULT now()
);

-- Create series table
CREATE TABLE public.series (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  titulo text NOT NULL,
  tmdb_id text,
  trailer text,
  identificador_archive text,
  type text DEFAULT 'serie',
  created_at timestamptz DEFAULT now()
);

-- Create series_kids table
CREATE TABLE public.series_kids (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  titulo text NOT NULL,
  identificador_archive text,
  genero text,
  year text,
  rating text,
  description text,
  poster text,
  type text DEFAULT 'serie',
  created_at timestamptz DEFAULT now()
);

-- Create tv_ao_vivo table
CREATE TABLE public.tv_ao_vivo (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  nome text NOT NULL,
  url text NOT NULL,
  logo text,
  grupo text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.cinema ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.filmes_kids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.series_kids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tv_ao_vivo ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Allow public read" ON public.cinema FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.filmes_kids FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.series FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.series_kids FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.tv_ao_vivo FOR SELECT USING (true);
