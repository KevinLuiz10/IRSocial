-- Carga idempotente: staging -> tabelas finais (upsert).
-- Uso pelo backend (dentro de uma transação):
--   1) INSERT INTO importacao (arquivo_nome, arquivo_hash) VALUES (...) RETURNING id;
--   2) INSERT em lote em stg_repasse com esse importacao_id
--   3) SELECT * FROM fn_carregar_importacao(<id>);
-- Rodar a mesma planilha de novo não duplica nada: linhas idênticas são contadas como "ignoradas".

CREATE OR REPLACE FUNCTION fn_carregar_importacao(p_importacao_id integer)
RETURNS TABLE (linhas_lidas integer, inseridos integer, atualizados integer, ignorados integer)
LANGUAGE plpgsql AS $$
DECLARE
    v_lidas integer;
    v_ins_ma integer; v_upd_ma integer;
    v_ins_rep integer; v_upd_rep integer;
    v_total_rep integer;
BEGIN
    SELECT count(*) INTO v_lidas FROM stg_repasse WHERE importacao_id = p_importacao_id;
    IF v_lidas = 0 THEN
        RAISE EXCEPTION 'Importação % não possui linhas em stg_repasse', p_importacao_id;
    END IF;

    -- 1) municípios novos
    INSERT INTO municipio (nome, eh_estadual)
    SELECT DISTINCT s.municipio_nome, (s.municipio_nome = 'ESTADUAL')
    FROM stg_repasse s
    WHERE s.importacao_id = p_importacao_id
    ON CONFLICT (nome) DO NOTHING;

    -- 2) municipio_ano
    WITH up AS (
        INSERT INTO municipio_ano AS t (municipio_id, ano, potencial, contribuintes, destinacao_pf, qtde_pf, importacao_id)
        SELECT m.id, s.ano, s.potencial, s.contribuintes, s.destinacao_pf, s.qtde_pf, s.importacao_id
        FROM stg_repasse s JOIN municipio m ON m.nome = s.municipio_nome
        WHERE s.importacao_id = p_importacao_id
        ON CONFLICT (municipio_id, ano) DO UPDATE
            SET potencial = EXCLUDED.potencial, contribuintes = EXCLUDED.contribuintes,
                destinacao_pf = EXCLUDED.destinacao_pf, qtde_pf = EXCLUDED.qtde_pf,
                importacao_id = EXCLUDED.importacao_id, atualizado_em = now()
            WHERE (t.potencial, t.contribuintes, t.destinacao_pf, t.qtde_pf)
                  IS DISTINCT FROM (EXCLUDED.potencial, EXCLUDED.contribuintes, EXCLUDED.destinacao_pf, EXCLUDED.qtde_pf)
        RETURNING (xmax = 0) AS inserido
    )
    SELECT count(*) FILTER (WHERE inserido), count(*) FILTER (WHERE NOT inserido)
    INTO v_ins_ma, v_upd_ma FROM up;

    -- 3) repasse (um registro por fundo)
    WITH src AS (
        SELECT m.id AS municipio_id, s.ano, f.id AS fundo_id, s.importacao_id,
               CASE f.codigo WHEN 'FDCA' THEN s.eca_valor       ELSE s.idoso_valor      END AS valor_destinado,
               CASE f.codigo WHEN 'FDCA' THEN s.eca_qtde        ELSE s.idoso_qtde       END AS qtde_doacoes,
               CASE f.codigo WHEN 'FDCA' THEN s.darf_eca_valor  ELSE s.darf_idoso_valor END AS valor_darf,
               CASE f.codigo WHEN 'FDCA' THEN s.darf_eca_qtde   ELSE s.darf_idoso_qtde  END AS qtde_darf
        FROM stg_repasse s
        JOIN municipio m ON m.nome = s.municipio_nome
        CROSS JOIN fundo f
        WHERE s.importacao_id = p_importacao_id
    ), up AS (
        INSERT INTO repasse AS t (municipio_id, ano, fundo_id, valor_destinado, qtde_doacoes, valor_darf, qtde_darf, importacao_id)
        SELECT municipio_id, ano, fundo_id, valor_destinado, qtde_doacoes, valor_darf, qtde_darf, importacao_id FROM src
        ON CONFLICT (municipio_id, ano, fundo_id) DO UPDATE
            SET valor_destinado = EXCLUDED.valor_destinado, qtde_doacoes = EXCLUDED.qtde_doacoes,
                valor_darf = EXCLUDED.valor_darf, qtde_darf = EXCLUDED.qtde_darf,
                importacao_id = EXCLUDED.importacao_id, atualizado_em = now()
            WHERE (t.valor_destinado, t.qtde_doacoes, t.valor_darf, t.qtde_darf)
                  IS DISTINCT FROM (EXCLUDED.valor_destinado, EXCLUDED.qtde_doacoes, EXCLUDED.valor_darf, EXCLUDED.qtde_darf)
        RETURNING (xmax = 0) AS inserido
    )
    SELECT count(*) FILTER (WHERE inserido), count(*) FILTER (WHERE NOT inserido)
    INTO v_ins_rep, v_upd_rep FROM up;

    v_total_rep := v_lidas * 2;  -- 2 fundos por linha da planilha

    UPDATE importacao SET
        status = 'concluida',
        linhas_lidas = v_lidas,
        registros_inseridos = v_ins_ma + v_ins_rep,
        registros_atualizados = v_upd_ma + v_upd_rep,
        registros_ignorados = (v_lidas + v_total_rep) - (v_ins_ma + v_ins_rep + v_upd_ma + v_upd_rep)
    WHERE id = p_importacao_id;

    DELETE FROM stg_repasse WHERE importacao_id = p_importacao_id;

    RETURN QUERY SELECT i.linhas_lidas, i.registros_inseridos, i.registros_atualizados, i.registros_ignorados
                 FROM importacao i WHERE i.id = p_importacao_id;
END;
$$;
