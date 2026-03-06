

# Plano: Criar tabelas Supabase e inserir dados dos catálogos

## Estrutura dos dados

Analisei os 4 arquivos JSON. Cada um tem campos ligeiramente diferentes:

| Arquivo | Registros | Campos principais |
|---|---|---|
| `filmes.json` | ~230 filmes | titulo, tmdb_id, url, trailer, year, rating, desc, poster, categories, type |
| `filmeskids.json` | ~45 filmes kids | titulo, url, genero, year, rating, desc, poster, type |
| `séries.json` | ~60 séries | titulo, tmdb_id, trailer, identificador_archive, type |
| `serieskids.json` | ~12 séries kids | titulo, identificador_archive, genero, year, rating, desc, poster, type |

## Plano de execução

### 1. Criar 4 tabelas no Supabase (migration)

```text
movies          - filmes gerais
movies_kids     - filmes infantis  
series          - séries gerais
series_kids     - séries infantis
```

Todas com RLS desabilitado (conteúdo público, sem autenticação ainda). Cada tabela terá colunas que cobrem todos os campos do respectivo JSON, com valores nullable para campos opcionais.

**Tabela `movies`:**
- id (serial PK), titulo (text), tmdb_id (text), url (text), trailer (text), year (text), rating (text), description (text), poster (text), category (text), type (text)

**Tabela `movies_kids`:**
- id (serial PK), titulo (text), url (text), genero (text), year (text), rating (text), description (text), poster (text), type (text)

**Tabela `series`:**
- id (serial PK), titulo (text), tmdb_id (text), trailer (text), identificador_archive (text), type (text)

**Tabela `series_kids`:**
- id (serial PK), titulo (text), identificador_archive (text), genero (text), year (text), rating (text), description (text), poster (text), type (text)

### 2. Inserir dados via SQL INSERT

Após criar as tabelas, inserir todos os registros de cada JSON na tabela correspondente usando o insert tool. Os dados serão divididos em batches para respeitar limites.

### 3. Adicionar RLS policy pública (SELECT)

Criar política `allow_public_read` em cada tabela para permitir leitura anônima, já que é um catálogo público.

### Arquivos de código a modificar

Nenhuma modificação de código nesta etapa -- apenas criação de schema e inserção de dados no Supabase. A integração com o frontend será feita depois.

