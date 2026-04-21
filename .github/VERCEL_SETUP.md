# Configuração de Deploy Automático Vercel

## Secrets Necessários

Configure os seguintes secrets no GitHub (Settings > Secrets and variables > Actions):

### Obrigatórios para Vercel

| Secret | Como Obter |
|--------|-----------|
| `VERCEL_TOKEN` | [Vercel Settings > Tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | No arquivo `.vercel/project.json` após rodar `vercel link` |
| `VERCEL_PROJECT_ID` | No arquivo `.vercel/project.json` após rodar `vercel link` |

### Variáveis de Ambiente da Aplicação

| Secret | Descrição |
|--------|-----------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Anon/Public key do Supabase |
| `VITE_SUPABASE_ANON_KEY` | Mesma que acima (fallback) |
| `VITE_TMDB_API_KEY` | API Key do TMDB |

## Como Configurar

### 1. Instalar Vercel CLI

```bash
npm i -g vercel
```

### 2. Linkar Projeto

```bash
vercel link
```

Isso criará o arquivo `.vercel/project.json` com `orgId` e `projectId`.

### 3. Gerar Token

Acesse: https://vercel.com/account/tokens

Crie um novo token com escopo "Full Account" ou pelo menos acesso ao projeto.

### 4. Configurar no GitHub

Vá em: `Settings > Secrets and variables > Actions > New repository secret`

Adicione cada secret listado acima.

## Funcionamento

O deploy automático ocorrerá quando:
- Push na branch `main` ou `master`
- Arquivos alterados NÃO são apenas documentação (`.md`, `docs/`)

O workflow:
1. Verifica se todos os secrets estão configurados
2. Roda type-check e build
3. Faz deploy na Vercel (production)
4. Verifica se o deploy está acessível
5. Comenta no PR com a URL (se aplicável)

## Troubleshooting

### "VERCEL_TOKEN não configurado"
- Verifique se o secret foi adicionado corretamente no GitHub
- O token pode ter expirado; gere um novo na Vercel

### Build falha
- Verifique se todas as variáveis de ambiente (VITE_*) estão configuradas
- Verifique os logs do GitHub Actions para detalhes do erro

### Deploy não aparece na Vercel
- Verifique se o `VERCEL_ORG_ID` e `VERCEL_PROJECT_ID` estão corretos
- Certifique-se de que o token tem permissão para o projeto
