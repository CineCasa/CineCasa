# CineCasa Design System

## Camadas Visuais
- Layer 0: Backdrop com blur(20px)
- Layer 1: Poster com drop-shadow-2xl + glow cyan
- Layer 2: Glassmorphism cards com border-cyan-500/20

## Tipografia
- Título: text-4xl até text-8xl
- Peso: font-bold

## Badges
- 4K: cyan-500/20 + border-cyan-400/50
- TMDB: gradiente cyan-azul
- Rating: calculado da nota TMDB

## Elenco
- Avatar: rounded-full border-2 border-cyan-400
- Hover: scale-110 + glow intensificado

## API
- TMDB: /movie/{id}?append_to_response=credits,videos
- Supabase: tabelas cinema, series
