# CineCasa Design System: Premium Streaming Blueprint

## 1. Arquitetura de Camadas

### CAMADA 0 (Fundo)
- Backdrop TMDB com `blur(20px)` e `scale(1.1)`
- Vignette: gradientes pretos para legibilidade

### CAMADA 1 (Conteúdo)
- Poster: `rounded-lg drop-shadow-2xl`
- Glow: gradiente cyan-azul com blur e shadow neon
- Hover: `scale-105`

### CAMADA 2 (Interface)
- Cards: `backdrop-blur-md bg-black/40 border-cyan-500/20`
- Hover: `hover:scale-105 hover:border-cyan-400/50`

## 2. Tipografia e Metadados

### Título
- Mobile: `text-4xl` → Desktop: `text-7xl` → 4K: `text-8xl`
- `font-bold drop-shadow-2xl`

### Badges
- 4K Ultra HD: cyan badge com ícone
- TMDB: gradiente cyan-azul com nota em destaque
- Recomendação: porcentagem calculada da nota TMDB

## 3. Seção Elenco

### Avatar
- Circular: `rounded-full w-20 h-20`
- Borda: `border-2 border-cyan-400`
- Glow: `box-shadow: 0 0 15px rgba(0,229,255,0.4)`
- Hover: `scale-110` com intensificação do brilho
- Scroll horizontal no mobile

## 4. Integração Técnica

### TMDB API
- Endpoint: `/movie/{id}?append_to_response=credits,videos`
- API Key: `import.meta.env.VITE_TMDB_API_KEY`
- Language: `pt-BR`

### Supabase
- Tabelas: `cinema`, `series`
- Busca por `id` ou `id_n`

## 5. Responsividade

### Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: 1024px - 1920px
- 4K TV: > 1920px
- 8K/Projector: > 2560px

### Device-Specific
- TVs: touch targets maiores (60px)
- Focus: outline cyan para navegação por controle
- Safe zones: padding 5% nas laterais
