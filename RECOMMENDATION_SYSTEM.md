# Sistema de Recomendação Personalizado - CineCasa

## Visão Geral

Sistema de recomendação baseado no comportamento do usuário, implementado de forma isolada sem alterar tabelas ou código existente.

## Estrutura Criada

### Tabelas

#### 1. `user_genre_preferences`
Armazena as preferências de gênero de cada usuário com scores calculados.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | bigint | ID auto-incremento |
| `user_id` | uuid | Referência ao usuário (auth.users) |
| `genre` | text | Nome do gênero |
| `score` | integer | Pontuação do gênero (quanto maior, mais o usuário gosta) |
| `updated_at` | timestamptz | Última atualização |

#### 2. `user_interactions`
Log de todas as interações do usuário com conteúdo.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | bigint | ID auto-incremento |
| `user_id` | uuid | Referência ao usuário |
| `content_id` | text | ID do conteúdo (filme/série) |
| `content_type` | text | Tipo: 'movie' ou 'series' |
| `interaction_type` | text | Tipo: 'watched', 'liked', 'saved', 'rated' |
| `rating` | integer | Nota (1-10) para interações 'rated' |
| `genre` | text | Gênero principal do conteúdo |
| `created_at` | timestamptz | Data da interação |

### Funções RPC (Supabase)

#### `get_recommended_content(p_user_id uuid, p_limit integer)`
Retorna conteúdo recomendado para o usuário.

```sql
SELECT * FROM get_recommended_content('user-uuid', 5);
```

**Retorno:**
- `id`, `tmdb_id`, `title`, `poster`, `year`, `rating`, `type`, `genre_match`, `relevance_score`

#### `log_user_interaction(...)`
Registra uma interação e atualiza as preferências automaticamente.

```sql
SELECT log_user_interaction(
  'user-uuid',
  'content-id',
  'movie',
  'watched',
  null,
  'Ação'
);
```

#### `get_recommended_movies(p_user_id uuid, p_limit integer)`
Retorna apenas filmes recomendados.

#### `get_recommended_series(p_user_id uuid, p_limit integer)`
Retorna apenas séries recomendadas.

## Regras de Pontuação

| Interação | Pontos | Condição |
|-----------|--------|----------|
| `watched` | +1 | Assistiu o conteúdo |
| `liked` | +2 | Curtiu o conteúdo |
| `saved` | +1 | Salvou na watchlist |
| `rated` | +3 | Avaliou 8-10 |
| `rated` | +1 | Avaliou 5-7 |
| `rated` | 0 | Avaliou abaixo de 5 |

## Uso no Frontend

### Hook: `useRecommendedForYou`

```typescript
import { useRecommendedForYou } from '@/hooks/useRecommendedForYou';

function MyComponent() {
  const { 
    recommendations, 
    isLoading, 
    error, 
    refresh, 
    logInteraction 
  } = useRecommendedForYou(user?.id);

  // recommendations: Array de conteúdos recomendados
  // isLoading: boolean
  // error: string | null
  // refresh: () => Promise<void> - Recarrega recomendações
  // logInteraction: Registra interação do usuário

  return (
    <ContentCarousel
      title="Recomendado para você"
      items={recommendations}
      onCardClick={(item) => {
        // Registrar que o usuário assistiu
        logInteraction(
          item.id, 
          item.type, 
          'watched',
          item.genreMatch
        );
        navigate(`/details/${item.type}/${item.id}`);
      }}
    />
  );
}
```

### Exemplo: Registrar Interações

```typescript
// Quando usuário assiste um filme
await logInteraction('123', 'movie', 'watched', 'Ação');

// Quando usuário curte uma série
await logInteraction('456', 'series', 'liked', 'Drama');

// Quando usuário salva na watchlist
await logInteraction('789', 'movie', 'saved', 'Comédia');

// Quando usuário avalia (nota 9)
await logInteraction('101', 'movie', 'rated', 'Terror'); // rating passado via RPC
```

## Integração na Home

A seção "Recomendado para você 🎯" foi adicionada automaticamente em `PremiumHome.tsx` entre:
- **Negritude em Alta** ✊🏾
- **Orgulho Nacional** 🇧🇷

## Fallback

Se o usuário não tiver interações registradas:
1. Retorna filmes populares (mais recentes do catálogo)
2. Cache de 1 hora para evitar requisições excessivas
3. Embaralhamento para variedade a cada refresh

## Cache

- Cache local de 1 hora usando localStorage
- Chave: `cinecasa_recommended_for_you_cache_{userId}`
- Para forçar refresh: chamar `refresh()` ou limpar localStorage

## Deploy

Execute a migration no Supabase:

```bash
supabase db push
```

Ou execute manualmente via SQL Editor no painel do Supabase.

## Teste

1. Faça login como usuário
2. Navegue e assista alguns conteúdos
3. Verifique se as interações foram registradas:
   ```sql
   SELECT * FROM user_interactions WHERE user_id = 'seu-uuid';
   ```
4. Verifique as preferências calculadas:
   ```sql
   SELECT * FROM user_genre_preferences WHERE user_id = 'seu-uuid';
   ```
5. Teste a função de recomendação:
   ```sql
   SELECT * FROM get_recommended_content('seu-uuid', 5);
   ```

## Segurança

- RLS (Row Level Security) habilitado em todas as tabelas
- Usuários só acessam seus próprios dados
- Funções executam como SECURITY DEFINER

## Observações

- Sistema totalmente isolado - não altera tabelas existentes
- Opcional - não quebra funcionalidades se não estiver configurado
- Feature adicional - pode ser removido sem impacto
