-- IR Social - Esquema do banco (PostgreSQL 16)
-- Executado automaticamente no primeiro start do container (docker-entrypoint-initdb.d)

CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- busca por nome de município (RNF09)

-- Fundos sociais: seed fixo (ver 02_seed.sql)
CREATE TABLE fundo (
    id      smallint PRIMARY KEY,
    codigo  text NOT NULL UNIQUE CHECK (codigo IN ('FDCA', 'FDI')),
    nome    text NOT NULL
);

-- Municípios do PR (+ linha "ESTADUAL" da planilha, marcada por flag)
CREATE TABLE municipio (
    id            integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome          text NOT NULL UNIQUE,           -- normalizado: MAIÚSCULAS, sem acento, sem espaços extras
    uf            char(2) NOT NULL DEFAULT 'PR' CHECK (uf = 'PR'),
    eh_estadual   boolean NOT NULL DEFAULT false  -- true somente para ESTADUAL (não é município)
);
CREATE INDEX idx_municipio_nome_trgm ON municipio USING gin (nome gin_trgm_ops);

-- Trilha de auditoria de cada upload da planilha; origem da "última atualização" (RF08)
CREATE TABLE importacao (
    id                    integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    arquivo_nome          text NOT NULL,
    arquivo_hash          char(64) NOT NULL,      -- SHA-256 do arquivo
    importado_em          timestamptz NOT NULL DEFAULT now(),
    status                text NOT NULL DEFAULT 'em_andamento'
                          CHECK (status IN ('em_andamento', 'concluida', 'falhou')),
    linhas_lidas          integer NOT NULL DEFAULT 0,
    registros_inseridos   integer NOT NULL DEFAULT 0,
    registros_atualizados integer NOT NULL DEFAULT 0,
    registros_ignorados   integer NOT NULL DEFAULT 0,  -- já existiam idênticos
    erro                  text
);
CREATE INDEX idx_importacao_hash ON importacao (arquivo_hash);

-- Dados do município no ano que não pertencem a um fundo específico
CREATE TABLE municipio_ano (
    municipio_id   integer NOT NULL REFERENCES municipio(id),
    ano            smallint NOT NULL CHECK (ano BETWEEN 2000 AND 2100),
    potencial      numeric(14,2) NOT NULL CHECK (potencial >= 0),
    contribuintes  integer NOT NULL CHECK (contribuintes >= 0),
    destinacao_pf  numeric(14,2) NOT NULL CHECK (destinacao_pf >= 0),
    qtde_pf        integer NOT NULL CHECK (qtde_pf >= 0),
    importacao_id  integer NOT NULL REFERENCES importacao(id),
    atualizado_em  timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (municipio_id, ano)
);

-- Repasse por município x ano x fundo. A PK evita duplicação (RF10).
-- O total (FDCA + FDI) NÃO é armazenado: é calculado nas views.
CREATE TABLE repasse (
    municipio_id    integer NOT NULL REFERENCES municipio(id),
    ano             smallint NOT NULL CHECK (ano BETWEEN 2000 AND 2100),
    fundo_id        smallint NOT NULL REFERENCES fundo(id),
    valor_destinado numeric(14,2) NOT NULL CHECK (valor_destinado >= 0),  -- "Destinação" (declarado) - valor principal
    qtde_doacoes    integer NOT NULL CHECK (qtde_doacoes >= 0),
    valor_darf      numeric(14,2) NOT NULL CHECK (valor_darf >= 0),       -- "Valor DARF" (efetivamente pago)
    qtde_darf       integer NOT NULL CHECK (qtde_darf >= 0),
    importacao_id   integer NOT NULL REFERENCES importacao(id),
    atualizado_em   timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (municipio_id, ano, fundo_id)
);
CREATE INDEX idx_repasse_ano ON repasse (ano, fundo_id);

-- Área de staging: o backend insere aqui as linhas da planilha (já parseadas)
-- e chama fn_carregar_importacao(). Valores em formato "largo", como na planilha.
CREATE UNLOGGED TABLE stg_repasse (
    importacao_id     integer NOT NULL REFERENCES importacao(id) ON DELETE CASCADE,
    ano               smallint NOT NULL,
    municipio_nome    text NOT NULL,
    potencial         numeric(14,2) NOT NULL,
    contribuintes     integer NOT NULL,
    destinacao_pf     numeric(14,2) NOT NULL,
    qtde_pf           integer NOT NULL,
    eca_valor         numeric(14,2) NOT NULL,
    eca_qtde          integer NOT NULL,
    idoso_valor       numeric(14,2) NOT NULL,
    idoso_qtde        integer NOT NULL,
    darf_eca_valor    numeric(14,2) NOT NULL,
    darf_eca_qtde     integer NOT NULL,
    darf_idoso_valor  numeric(14,2) NOT NULL,
    darf_idoso_qtde   integer NOT NULL,
    PRIMARY KEY (importacao_id, ano, municipio_nome)
);
