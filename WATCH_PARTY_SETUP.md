# Assistir Juntos (Watch Party) - Configuração

O **Assistir Juntos** agora funciona 24 horas por dia, 7 dias por semana, **sem precisar de servidor próprio**!

## Como funciona

Usamos o **Supabase Realtime** (gratuito) para sincronização em tempo real entre os usuários:

- ✅ **Gratuito** - Limite generoso de conexões
- ✅ **24h online** - Não depende do seu computador
- ✅ **Sincronização em tempo real** - Play, pause e seek sincronizados
- ✅ **Múltiplos usuários** - Até 100 pessoas por sala (limite do plano gratuito)

---

## Tecnologias utilizadas

| Serviço | Função | Custo |
|---------|--------|-------|
| **Supabase Realtime** | WebSocket/broadcast | Gratuito |
| **Vercel** | Hospedagem frontend | Gratuito |

---

## O que foi implementado

### 1. Hook useWatchParty (`src/hooks/useWatchParty.ts`)
- Gerencia conexão com Supabase Realtime
- Envia/recebe mensagens de sincronização
- Controla estados (play, pause, seek)

### 2. Cliente Watch Party (`public/js/watch-party.js`)
- Conecta automaticamente via Supabase em produção
- Fallback para Socket.IO em desenvolvimento
- Sincronização periódica (a cada 5 segundos)

---

## Como usar

### Para o Host (quem cria a sala):

1. Clique no botão **"Assistir Juntos"** (ícone de usuários) no navbar
2. Uma nova aba abre com a sala criada
3. Copie o link da URL (ex: `https://cine-casa.vercel.app/watch.html?room=abc123`)
4. Envie o link para seus amigos

### Para os Convidados:

1. Receba o link do host
2. Abra o link no navegador
3. Pronto! O vídeo sincroniza automaticamente

---

## Recursos de sincronização

- ▶️ **Play** - Quando o host dá play, todos os convidados recebem
- ⏸️ **Pause** - Pausa sincronizada para todos
- ⏭️ **Seek** - Mudar o tempo do vídeo sincroniza com todos
- 🔄 **Sync automático** - A cada 5 segundos o tempo é sincronizado
- 👥 **Presence** - Mostra quantos usuários estão na sala

---

## Limitações do plano gratuito

| Recurso | Limite |
|---------|--------|
| Conexões simultâneas | 100 |
| Mensagens por mês | Ilimitado (no plano atual) |
| Salas ativas | Ilimitado |

---

## Solução de problemas

### "Erro ao conectar"
- Verifique se as variáveis do Supabase estão configuradas no Vercel
- Limpe o cache do navegador (Ctrl+F5)

### "Vídeo não sincroniza"
- Verifique se ambos os usuários têm a mesma URL (mesmo room ID)
- Verifique console do navegador (F12) por erros

### "Sala não existe"
- O room ID é gerado automaticamente ao clicar em "Assistir Juntos"
- Certifique-se de compartilhar o link completo com o parâmetro `?room=...`

---

## Configuração avançada (opcional)

### Usar Pusher como alternativa (também gratuito)

Se quiser usar Pusher em vez do Supabase:

1. Crie conta em https://pusher.com
2. Obtenha suas credenciais (app_id, key, secret)
3. Adicione ao `watch-party.js`:

```javascript
const pusher = new Pusher('YOUR_KEY', {
  cluster: 'YOUR_CLUSTER'
});
```

### Usar Ably (alternativa gratuita)

1. Crie conta em https://ably.com
2. Obtenha sua API key
3. Configure no cliente

---

## Ambientes

| Ambiente | Comunicação |
|----------|-------------|
| **Produção (Vercel)** | Supabase Realtime |
| **Desenvolvimento (localhost)** | Socket.IO (se disponível) ou Supabase |

---

**Pronto!** Agora você pode assistir filmes e séries junto com amigos, sincronizado, sem depender de servidor próprio!

GitHub: https://github.com/CineCasa/CineCasa
Deploy: https://cine-casa.vercel.app
