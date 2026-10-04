-- Views para o backend (RF07 / RF08). Exclui a linha ESTADUAL; use v_repasse_estadual para ela.

CREATE VIEW v_ultima_atualizacao AS
SELECT max(importado_em) AS ultima_atualizacao
FROM importacao WHERE status = 'concluida';

-- Repasse por município e ano, separado por fundo + total (RF08)
CREATE VIEW v_repasse_municipio_ano AS
SELECT m.id AS municipio_id,
       m.nome AS municipio,
       r.ano,
       COALESCE(sum(r.valor_destinado) FILTER (WHERE f.codigo = 'FDCA'), 0) AS valor_fdca,
       COALESCE(sum(r.valor_destinado) FILTER (WHERE f.codigo = 'FDI'),  0) AS valor_fdi,
       sum(r.valor_destinado) AS valor_total,
       COALESCE(sum(r.qtde_doacoes) FILTER (WHERE f.codigo = 'FDCA'), 0) AS doacoes_fdca,
       COALESCE(sum(r.qtde_doacoes) FILTER (WHERE f.codigo = 'FDI'),  0) AS doacoes_fdi,
       COALESCE(sum(r.valor_darf)   FILTER (WHERE f.codigo = 'FDCA'), 0) AS darf_fdca,
       COALESCE(sum(r.valor_darf)   FILTER (WHERE f.codigo = 'FDI'),  0) AS darf_fdi,
       (SELECT ultima_atualizacao FROM v_ultima_atualizacao) AS ultima_atualizacao
FROM repasse r
JOIN municipio m ON m.id = r.municipio_id
JOIN fundo f ON f.id = r.fundo_id
WHERE NOT m.eh_estadual
GROUP BY m.id, m.nome, r.ano;

-- Acumulado de todos os anos por município
CREATE VIEW v_repasse_municipio_total AS
SELECT municipio_id, municipio,
       sum(valor_fdca) AS valor_fdca, sum(valor_fdi) AS valor_fdi, sum(valor_total) AS valor_total,
       min(ano) AS ano_inicial, max(ano) AS ano_final,
       max(ultima_atualizacao) AS ultima_atualizacao
FROM v_repasse_municipio_ano
GROUP BY municipio_id, municipio;

-- Linha ESTADUAL separada
CREATE VIEW v_repasse_estadual AS
SELECT r.ano,
       COALESCE(sum(r.valor_destinado) FILTER (WHERE f.codigo = 'FDCA'), 0) AS valor_fdca,
       COALESCE(sum(r.valor_destinado) FILTER (WHERE f.codigo = 'FDI'),  0) AS valor_fdi,
       sum(r.valor_destinado) AS valor_total
FROM repasse r JOIN municipio m ON m.id = r.municipio_id JOIN fundo f ON f.id = r.fundo_id
WHERE m.eh_estadual
GROUP BY r.ano;

/* Exemplos de consulta para o backend (paginação + filtro, RNF09):
   SELECT * FROM v_repasse_municipio_ano
   WHERE ano = $1 AND municipio ILIKE '%' || $2 || '%'
   ORDER BY municipio
   LIMIT $3 OFFSET $4;
*/
