# Sistema de Gamificação CineCasa - Arquitetura Enterprise

## Visão Geral

Sistema profissional de avatar/gamificação implementado do zero com arquitetura moderna, escalável e pronta para produção.

## 📁 Arquivos Criados

### Database Migrations
- `20260429010000_gamification_schema_part1.sql` - Tabelas base (user_avatar_items, user_equipped_avatar, achievements, user_achievements)
- `20260429010100_gamification_schema_part2.sql` - XP, Levels e Streaks
- `20260429010200_gamification_rls_policies.sql` - Políticas de segurança RLS
- `20260429010300_gamification_seed_data.sql` - Dados iniciais (avatar items, achievements, level config)

### Services (Camada de Negócio)
- `src/services/AvatarService.ts` - Gestão de avatar, inventário, equipamento
- `src/services/XPService.ts` - Sistema de experiência, níveis, leaderboard
- `src/services/AchievementService.ts` - Conquistas e progresso
- `src/services/GamificationService.ts` - Orquestração de eventos e integração

### Hooks React Query
- `src/hooks/useAvatar.ts` - Hooks para avatar e inventário
- `src/hooks/useXP.ts` - Hooks para XP e níveis
- `src/hooks/useAchievements.ts` - Hooks para conquistas
- `src/hooks/useGamification.ts` - Hooks para eventos de gamificação
- `src/hooks/useGamificationIntegration.ts` - Integração com streaming existente

### UI Components
- `src/components/gamification/AvatarBuilder.tsx` - Editor de avatar profissional
- `src/components/gamification/XPProgress.tsx` - Barra de progresso de XP
- `src/components/gamification/AchievementCard.tsx` - Card de conquista
- `src/components/gamification/AchievementsList.tsx` - Lista de conquistas
- `src/components/gamification/GamificationProvider.tsx` - Context provider
- `src/components/gamification/index.ts` - Barrel export

### Arquivos Removidos (Sistema Antigo)
- `src/components/AvatarCustomizer.tsx` ❌
- `src/hooks/useAvatarCustomization.ts` ❌
- `src/components/ui/avatar.tsx` ❌ (mantido apenas o Radix UI base)

## 🏗️ Arquitetura

### Estrutura de Dados

```
avatar_items (catálogo global)
├── id, name, category, type
├── rarity, unlock_type, xp_required
├── price, is_active, display_order
└── metadata JSONB

user_avatar_items (inventário do usuário)
├── user_id, avatar_item_id
├── unlocked_at, unlocked_by
├── is_favorite, times_equipped
└── CONSTRAINT unique_user_item

user_equipped_avatar (slots equipados)
├── user_id (unique)
├── slot_body, slot_hair, slot_eyes
├── slot_top, slot_bottom
├── slot_accessory_1, slot_accessory_2
├── slot_background, slot_badge, slot_frame
└── customization_config JSONB

achievements (catálogo de conquistas)
├── code (unique), name, description
├── category, requirement_type, requirement_value
├── xp_reward, avatar_item_reward
├── tier (bronze/silver/gold/platinum/diamond)
├── is_hidden, is_active
└── next_achievement_id (série)

user_achievements (progresso do usuário)
├── user_id, achievement_id
├── progress_current, progress_target
├── is_completed, completed_at
└── notification_seen_at

user_xp (experiência)
├── user_id (unique)
├── total_xp, xp_watching, xp_rating
├── xp_social, xp_achievements, xp_special
├── active_multiplier, multiplier_expires_at
└── last_xp_at

user_levels (níveis)
├── user_id (unique)
├── current_level, current_title
├── xp_for_current_level, xp_needed_for_next
├── total_levels_achieved, max_level_reached
└── level_history JSONB[]

user_streaks (sequências)
├── user_id (unique)
├── watch_streak_days, watch_streak_max, watch_streak_last_at
├── login_streak_days, login_streak_max
├── rating_streak_days, rating_streak_max
└── streak_freezes

level_config (configuração de níveis)
├── level (unique), title
├── xp_required, xp_for_level
├── features_unlocked JSONB
└── avatar_item_reward
```

### Fluxos Principais

#### 1. Ganho de XP
```
Usuário assiste/avalia → gamificationService.processEvent()
├── xpService.gainXP()
│   ├── Calcula multiplicador
│   ├── Atualiza user_xp
│   ├── Cria xp_logs
│   └── Retorna XPGainResult
├── achievementService.trackProgress()
│   ├── Verifica conquistas relevantes
│   ├── Atualiza progresso
│   └── Completa se atingiu target
└── Retorna GamificationResult
```

#### 2. Sistema de Avatar
```
Usuário abre AvatarBuilder
├── useAvatarItems() → Busca catálogo
├── useUserAvatarItems() → Busca inventário
├── useEquippedAvatar() → Busca equipados
└── Renderiza tabs por categoria

Usuário equipa item
├── useEquipItem.mutate()
├── AvatarService.equipItem()
│   ├── Valida ownership
│   ├── Atualiza user_equipped_avatar
│   └── Incrementa times_equipped
└── invalidateQueries() → Refresh UI
```

#### 3. Conquistas
```
Evento de gamificação → trackAchievement()
├── Busca ou cria user_achievements
├── Incrementa progress_current
├── Se progress >= target:
│   ├── Marca is_completed = true
│   ├── Set completed_at
│   ├── Award XP reward
│   └── Unlock avatar_item_reward
└── Retorna boolean (se completou)
```

## 🔒 Segurança (RLS Policies)

- **avatar_items**: SELECT público, INSERT/UPDATE apenas admin
- **user_avatar_items**: Usuário vê apenas seus itens
- **user_equipped_avatar**: Usuário gerencia apenas seu avatar
- **achievements**: SELECT público
- **user_achievements**: Usuário vê apenas suas conquistas
- **user_xp**: Usuário vê apenas seu XP
- **user_levels**: SELECT público (para leaderboard)
- **user_streaks**: Usuário vê apenas suas streaks
- **xp_logs**: Usuário vê apenas seus logs

## 🎮 Sistema de XP

### Fontes de XP
| Ação | XP Base | Bônus |
|------|---------|-------|
| Assistir filme/ep | 10 | +1 por 10min |
| Avaliar conteúdo | 5 | +5 se 4+ estrelas |
| Escrever review | 20 | +10 se >200 chars |
| Completar série | 50 | +5 por episódio |
| Streak diário | 50 | ×2 milestone |
| Interação social | 2-10 | - |

### Multiplicadores
- Premium: 1.5x por 24h
- Eventos: 2x-3x temporário
- Streak 7+ dias: 1.2x

## 🏆 Sistema de Conquistas

### Categorias
- **watching**: Assistir filmes/séries
- **rating**: Avaliar conteúdo
- **social**: Interações comunitárias
- **streak**: Sequências diárias
- **special**: Conquistas especiais/eventos

### Tiers
- Bronze → Silver → Gold → Platinum → Diamond

### Exemplos Implementados
- `watch_1`, `watch_10`, `watch_50`, `watch_100`, `watch_500`
- `rate_1`, `rate_10`, `rate_50`, `rate_100`
- `streak_3`, `streak_7`, `streak_30`, `streak_365`
- `genre_action`, `genre_horror`, `genre_comedy`, `genre_romance`
- `completist` (completar série)

## 🎨 Sistema de Avatar

### Categorias de Itens
- **body**: Tons de pele, formatos
- **hair**: Cabelos, cores, estilos
- **eyes**: Olhos, cores, formatos
- **clothing**: Roupas, tops, bottoms
- **accessories**: Óculos, chapéus, coroas
- **background**: Fundos sólidos, gradientes, padrões
- **badge**: Emblemas de conquista
- **frame**: Molduras de perfil

### Raridade
- Common (cinza) - Grátis/inicial
- Uncommon (verde) - XP baixo
- Rare (azul) - XP médio
- Epic (roxo) - Conquistas
- Legendary (dourado) - Eventos especiais
- Mythic (rosa) - Exclusivos

### Slots de Equipamento
- 1 corpo (base)
- 1 cabelo
- 1 olhos
- 1 top + 1 bottom (roupas)
- 2 acessórios
- 1 background
- 1 badge
- 1 frame

## 🔌 Integração com Sistema Existente

### Uso nos Hooks de Streaming
```typescript
// Em useWatchProgress ou similar
import { useStreamingGamification } from '@/hooks/useGamificationIntegration';

function VideoPlayer({ userId, contentId }) {
  const { onWatchComplete } = useStreamingGamification();

  const handleVideoComplete = async () => {
    await onWatchComplete(userId, contentId, 'movie', 90, 'action');
  };
}
```

### Uso no Sistema de Ratings
```typescript
// Em RatingComponent
import { useStreamingGamification } from '@/hooks/useGamificationIntegration';

function RatingComponent({ userId, contentId }) {
  const { onRateContent } = useStreamingGamification();

  const handleRate = async (rating: number) => {
    await saveRating(contentId, rating);
    await onRateContent(userId, contentId, 'movie');
  };
}
```

## 📊 Performance

### Otimizações Implementadas
- React Query com staleTime configurado
- Cache de level_config (10min)
- Cache de achievements (10min)
- Invalidação seletiva de queries
- Indexes em todas as FKs
- Indexes em campos de busca frequentes

### Lazy Loading
- Avatar items carregam sob demanda por categoria
- XP logs paginados
- Leaderboard limitado a top N

## 🚀 Deploy

### 1. Aplicar Migrations
```bash
# Executar no SQL Editor do Supabase na ordem:
1. 20260429010000_gamification_schema_part1.sql
2. 20260429010100_gamification_schema_part2.sql
3. 20260429010200_gamification_rls_policies.sql
4. 20260429010300_gamification_seed_data.sql
```

### 2. Commit e Push
```bash
git add -A
git commit -m "feat: Sistema completo de gamificação enterprise v2.0"
git push origin main
```

### 3. Verificar Deploy
- GitHub Actions executará build
- Vercel fará deploy automático
- Verificar console por erros

## 📈 Próximos Passos (Opcional)

1. **Avatar Rendering**: Implementar SVG dinâmico com base nos slots equipados
2. **Animations**: Adicionar microinteractions (Framer Motion já instalado)
3. **Leaderboard Real-time**: Usar Supabase Realtime para ranking ao vivo
4. **Seasonal Events**: Sistema de eventos sazonais com itens limitados
5. **Trading**: Sistema de troca de itens entre usuários
6. **Achievements NFT**: Integração opcional com blockchain para conquistas raras

## 📝 API Reference

### AvatarService
```typescript
avatarService.getAllItems(): Promise<AvatarItem[]>
avatarService.getUserItems(userId: string): Promise<UserAvatarItem[]>
avatarService.equipItem(userId, slot, itemId): Promise<void>
avatarService.unlockItem(userId, itemId, unlockedBy): Promise<UserAvatarItem>
```

### XPService
```typescript
xpService.gainXP(userId, amount, source, sourceId): Promise<XPGainResult>
xpService.getLevelInfo(userId): Promise<LevelInfo>
xpService.getTopUsers(limit): Promise<LeaderboardEntry[]>
xpService.setMultiplier(userId, multiplier, expiresAt): Promise<void>
```

### AchievementService
```typescript
achievementService.getAll(): Promise<Achievement[]>
achievementService.getUserProgress(userId): Promise<AchievementProgress[]>
achievementService.trackProgress(userId, code, increment): Promise<boolean>
```

### GamificationService
```typescript
gamificationService.processEvent(event): Promise<GamificationResult>
gamificationService.updateWatchStreak(userId): Promise<StreakResult>
gamificationService.getLeaderboard(limit): Promise<LeaderboardEntry[]>
```

---

**Versão**: 2.0.0  
**Data**: 2026-04-29  
**Status**: ✅ Pronto para produção
