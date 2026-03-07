

# Plano: Criar tabelas, inserir dados e conectar TMDB

## Observação importante sobre Supabase

O projeto já está conectado ao Supabase **eqhstnlsmfrwxhvcwoid**. As credenciais fornecidas (daxwoxseopritdbexfcx) são de um projeto diferente. Usarei o projeto já conectado. Se quiser trocar, será necessário reconectar via Settings > Connectors.

## 1. Reestruturar tabelas

Renomear/recriar as tabelas existentes para os nomes solicitados:

| Tabela atual | Nova tabela | Dados |
|---|---|---|
| `movies` | `cinema` | filmes-2.json (~230 registros) |
| `movies_kids` | `filmes_kids` | filmeskids-2.json (~45 registros) |
| `series` | `series` | séries-3.json (~80 registros) |
| `series_kids` | `series_kids` | serieskids-3.json (~12 registros) |
| (nova) | `tv_ao_vivo` | tvaovivo.m3u (~40 canais) |

Migration SQL: DROP das tabelas antigas, CREATE das novas com colunas adequadas, RLS público para SELECT.

**Tabela `tv_ao_vivo`**: id, nome (text), url (text), logo (text), grupo (text)

## 2. Inserir dados

- Usar a edge function `bulk-insert` existente para inserir os JSONs em lotes
- Para o M3U: parsear no código e converter para array JSON antes de inserir
- Atualizar a edge function para suportar as novas tabelas (`cinema`, `filmes_kids`, `tv_ao_vivo`)

## 3. TMDB API key

A chave `b275ce8e1a6b3d5d879bb0907e4f56ad` é pública (read-only). Será armazenada diretamente no código em `src/services/tmdb.ts`.

## 4. Arquivos modificados

| Arquivo | Ação |
|---|---|
| Migration SQL | Criar — drop tabelas antigas, criar novas |
| `supabase/functions/bulk-insert/index.ts` | Modificar — suportar novas tabelas |
| `src/services/tmdb.ts` | Criar — API TMDB com chave |
| `src/integrations/supabase/types.ts` | Auto-atualizado após migration |

## Dados do M3U (parseados)

~40 canais ao vivo organizados por grupo: ABERTOS, KIDS, ESPORTES, JORNALISMO, RELIGIOSO, FILMES, SERIES, VARIEDADES, ESPANHOL.

