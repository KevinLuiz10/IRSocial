# Banco de Dados — IR Social

Persistência da planilha de repasses (FDCA/FDI) por município do Paraná, por ano (RF09), sem duplicar registros em reimportações (RF10) e com validação dos dados antes da gravação (RNF11).

## Modelo de dados (DER)

```mermaid
erDiagram
    FUNDO {
        smallint id PK
        text codigo
        text nome
    }
    MUNICIPIO {
        integer id PK
        text nome
        char_2 uf
        boolean eh_estadual
    }
    IMPORTACAO {
        integer id PK
        text arquivo_nome
        char_64 arquivo_hash
        timestamptz importado_em
        text status
        integer linhas_lidas
        integer registros_inseridos
        integer registros_atualizados
        integer registros_ignorados
        text erro
    }
    MUNICIPIO_ANO {
        integer municipio_id PK_FK
        smallint ano PK
        numeric potencial
        integer contribuintes
        numeric destinacao_pf
        integer qtde_pf
        integer importacao_id FK
    }
    REPASSE {
        integer municipio_id PK_FK
        smallint ano PK
        smallint fundo_id PK_FK
        numeric valor_destinado
        integer qtde_doacoes
        numeric valor_darf
        integer qtde_darf
        integer importacao_id FK
    }
    STG_REPASSE {
        integer importacao_id PK_FK
        smallint ano PK
        text municipio_nome PK
    }

    MUNICIPIO ||--o{ MUNICIPIO_ANO : "tem dados em"
    MUNICIPIO ||--o{ REPASSE : "recebe"
    FUNDO ||--o{ REPASSE : "financia"
    IMPORTACAO ||--o{ MUNICIPIO_ANO : "gerou"
    IMPORTACAO ||--o{ REPASSE : "gerou"
    IMPORTACAO ||--o{ STG_REPASSE : "alimentou"
```

Decisões relevantes:
- A chave de município é o **nome normalizado** (maiúsculas, espaços colapsados) — a planilha não traz código IBGE.
- A linha `ESTADUAL` da planilha entra em `municipio` com `eh_estadual = true`; as views de município a excluem, e `v_repasse_estadual` a mostra separada.
- O total FDCA + FDI **não é armazenado** — é calculado nas views, porque a planilha tem diferença de até ~R$0,02 por linha por arredondamento entre o total declarado e a soma dos fundos.
- Unicidade (RF10): PK `(municipio_id, ano, fundo_id)` em `repasse` e `(municipio_id, ano)` em `municipio_ano`.

## Fluxo de importação

1. Backend calcula o hash SHA-256 do arquivo e insere em `importacao` (`arquivo_nome`, `arquivo_hash`), obtendo um `importacao_id`.
2. Backend insere em lote as linhas já parseadas da planilha em `stg_repasse`, com esse `importacao_id`.
3. Backend chama `SELECT * FROM fn_carregar_importacao(<importacao_id>)`, dentro de uma transação.
   - A função faz *upsert* de `stg_repasse` para `municipio`, `municipio_ano` e `repasse`.
   - Linhas idênticas às já existentes são identificadas e contadas como **ignoradas** (nem inserem, nem atualizam) — é isso que garante RF10.
   - Ao final, a função grava as contagens (`linhas_lidas`, `registros_inseridos`, `registros_atualizados`, `registros_ignorados`) em `importacao`, marca `status = 'concluida'` e limpa a própria staging.
4. Em caso de erro, o backend faz `ROLLBACK` e marca a importação como `status = 'falhou'` com a mensagem em `erro`.

Essa lógica está implementada em `backend/scripts/importar-planilha.js`, que:
- Lê todas as abas do `.xlsx`, extraindo o **ano do final do nome da aba** (ex.: `doacoesDIRFP_2024` → 2024), nunca pelo nome exato (há um typo documentado em uma das abas).
- Mapeia as 18 colunas **por posição**, não por nome (o nome das colunas de potencial muda por ano).
- Valida antes de gravar (RNF11): nome do município presente e todos os campos numéricos não-negativos. Se qualquer linha falhar, a importação inteira é abortada e nada é gravado.
- Avisa (sem bloquear) se o hash do arquivo já foi importado antes.

## Como subir o banco

Com Docker instalado:

```bash
cp .env.example .env     # ajuste a senha se quiser
docker compose up -d db  # só o Postgres
# ou
docker compose up -d --build   # banco + app (usa o Dockerfile da raiz)
```

O Postgres 16 executa automaticamente os scripts de `db/init/` (`01_schema.sql`, `02_seed.sql`, `03_carga.sql`, `04_views.sql`), na ordem alfabética, no primeiro start do volume `db_data`. Se o volume já existir de uma tentativa anterior, os scripts **não** rodam de novo — nesse caso, `docker compose down -v` para recriar do zero.

Sem Docker (desenvolvimento local alternativo, usando um PostgreSQL 16+ já instalado):

```bash
psql -U postgres -c "CREATE DATABASE irsocial;"
psql -U postgres -d irsocial -f db/init/01_schema.sql
psql -U postgres -d irsocial -f db/init/02_seed.sql
psql -U postgres -d irsocial -f db/init/03_carga.sql
psql -U postgres -d irsocial -f db/init/04_views.sql
```

## Rodando a carga da planilha

```bash
cd backend
npm install
DATABASE_URL="postgres://usuario:senha@localhost:5432/irsocial" npm run importar -- "caminho/para/planilha.xlsx"
```

Rodar duas vezes com o mesmo arquivo é seguro: a segunda vez deve retornar `0 inseridos` e tudo marcado como ignorado.

## Views disponíveis

| View | Uso |
|---|---|
| `v_ultima_atualizacao` | Data/hora da importação mais recente concluída (RF08) |
| `v_repasse_municipio_ano` | Repasse por município e ano, separado por fundo + total (exclui ESTADUAL) |
| `v_repasse_municipio_total` | Acumulado de todos os anos por município |
| `v_repasse_estadual` | Linha ESTADUAL da planilha, separada por ano |

## Exemplo de consulta paginada com filtro por nome (RNF09)

```sql
SELECT *
FROM v_repasse_municipio_ano
WHERE ano = $1
  AND municipio ILIKE '%' || $2 || '%'
ORDER BY municipio
LIMIT $3 OFFSET $4;
```

O índice trigram em `municipio.nome` (`idx_municipio_nome_trgm`) acelera esse `ILIKE '%...%'` mesmo com o termo de busca no meio do nome.

## Observação de segurança

`backend/scripts/importar-planilha.js` usa o pacote `xlsx` (SheetJS) da versão publicada no registro do npm, que tem vulnerabilidades conhecidas de prototype pollution e ReDoS ao processar arquivos `.xlsx` malformados, sem correção disponível via npm. Isso é aceitável enquanto o script for executado manualmente por um integrante do grupo sobre um arquivo confiável (como é hoje). **Se esse parsing for exposto futuramente em um endpoint de upload público**, é necessário trocar para a versão corrigida da SheetJS (distribuída fora do npm, em `cdn.sheetjs.com`) ou para outra biblioteca antes de aceitar arquivos de terceiros.
