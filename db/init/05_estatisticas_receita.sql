-- Dados oficiais da tabela HTML da Receita Federal (por municipio do PR).
-- Complemento ao modelo anterior: nao altera repasse/municipio_ano nem suas views.
-- A pagina oficial informa totais exatos e percentuais arredondados por fundo,
-- e NAO permite preencher com precisao as colunas monetarias de cada fundo.
CREATE TABLE IF NOT EXISTS estatistica_receita_municipio_ano (
    municipio_id           integer NOT NULL REFERENCES municipio(id),
    ano                    smallint NOT NULL CHECK (ano BETWEEN 2000 AND 2100),
    potencial              numeric(14,2) NOT NULL CHECK (potencial >= 0),
    contribuintes          integer NOT NULL CHECK (contribuintes >= 0),
    destinacao_pf          numeric(14,2) NOT NULL CHECK (destinacao_pf >= 0),
    qtde_pf                integer NOT NULL CHECK (qtde_pf >= 0),
    valor_total            numeric(14,2) NOT NULL CHECK (valor_total >= 0),
    doacoes_total          integer NOT NULL CHECK (doacoes_total >= 0),
    percentual_fdca        numeric(5,2) NOT NULL CHECK (percentual_fdca BETWEEN 0 AND 100),
    percentual_fdi         numeric(5,2) NOT NULL CHECK (percentual_fdi BETWEEN 0 AND 100),
    valor_darf             numeric(14,2) NOT NULL CHECK (valor_darf >= 0),
    qtde_darf              integer NOT NULL CHECK (qtde_darf >= 0),
    fonte_url              text NOT NULL,
    importacao_id          integer NOT NULL REFERENCES importacao(id),
    atualizado_em          timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (municipio_id, ano)
);
CREATE INDEX IF NOT EXISTS idx_estatistica_receita_ano_valor
    ON estatistica_receita_municipio_ano (ano, valor_total DESC);

-- Total publicado para o Estado (linha TOTAL): preservado sem recalculo.
CREATE TABLE IF NOT EXISTS estatistica_receita_estado_ano (
    ano                    smallint PRIMARY KEY CHECK (ano BETWEEN 2000 AND 2100),
    potencial              numeric(14,2) NOT NULL CHECK (potencial >= 0),
    contribuintes          integer NOT NULL CHECK (contribuintes >= 0),
    destinacao_pf          numeric(14,2) NOT NULL CHECK (destinacao_pf >= 0),
    qtde_pf                integer NOT NULL CHECK (qtde_pf >= 0),
    valor_total            numeric(14,2) NOT NULL CHECK (valor_total >= 0),
    doacoes_total          integer NOT NULL CHECK (doacoes_total >= 0),
    percentual_fdca        numeric(5,2) NOT NULL CHECK (percentual_fdca BETWEEN 0 AND 100),
    percentual_fdi         numeric(5,2) NOT NULL CHECK (percentual_fdi BETWEEN 0 AND 100),
    valor_darf             numeric(14,2) NOT NULL CHECK (valor_darf >= 0),
    qtde_darf              integer NOT NULL CHECK (qtde_darf >= 0),
    estadual_valor          numeric(14,2) NOT NULL DEFAULT 0 CHECK (estadual_valor >= 0),
    estadual_doacoes        integer NOT NULL DEFAULT 0 CHECK (estadual_doacoes >= 0),
    fonte_url              text NOT NULL,
    importacao_id          integer NOT NULL REFERENCES importacao(id),
    atualizado_em          timestamptz NOT NULL DEFAULT now()
);
