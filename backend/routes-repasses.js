'use strict';

// Mesma API consumida pelo frontend atual; usa somente estatisticas oficiais
// publicadas pela Receita (totais exatos + percentuais, sem valores inventados).
const express = require('express');
const { nomeNormalizado } = require('./scripts/receitaParser');

function criarRotasRepasses(pool) {
    const router = express.Router();
    const tratar = (funcao) => (req, res, next) => Promise.resolve(funcao(req, res)).catch(next);

    function anoValido(valor) {
        const ano = Number(valor);
        return /^\d{4}$/.test(String(valor ?? '')) && ano >= 2000 && ano <= 2100 ? ano : null;
    }
    const atualizado = `i.importado_em AS ultima_atualizacao`;

    router.get('/repasses/anos', tratar(async (req, res) => {
        const r = await pool.query(`SELECT array_agg(ano ORDER BY ano DESC) AS anos,
            max(importado_em) AS ultima_atualizacao FROM (
              SELECT e.ano, i.importado_em
              FROM estatistica_receita_estado_ano e JOIN importacao i ON i.id = e.importacao_id
            ) dados`);
        res.json({ anos: r.rows[0]?.anos || [], ultima_atualizacao: r.rows[0]?.ultima_atualizacao || null });
    }));

    router.get('/repasses/resumo', tratar(async (req, res) => {
        const ano = anoValido(req.query.ano);
        if (!ano) return res.status(400).json({ erro: 'Informe um ano valido.' });
        const r = await pool.query(`SELECT e.*, ${atualizado},
            (SELECT count(*)::int FROM estatistica_receita_municipio_ano WHERE ano = e.ano) AS municipios
            FROM estatistica_receita_estado_ano e
            JOIN importacao i ON i.id = e.importacao_id WHERE e.ano = $1`, [ano]);
        if (!r.rowCount) return res.status(404).json({ erro: 'Dados deste ano nao importados.' });
        res.json(r.rows[0]);
    }));

    router.get('/repasses', tratar(async (req, res) => {
        const ano = anoValido(req.query.ano);
        if (!ano) return res.status(400).json({ erro: 'Informe um ano valido.' });
        const inteiro = (x, padrao, max) => {
            const n = Number(x ?? padrao);
            return Number.isSafeInteger(n) && n > 0 && n <= max ? n : null;
        };
        const pagina = inteiro(req.query.pagina, 1, 100000);
        const limite = inteiro(req.query.limite, 20, 100);
        if (!pagina || !limite) return res.status(400).json({ erro: 'Paginacao invalida.' });
        const busca = nomeNormalizado(req.query.busca || '').slice(0, 100);
        const ordem = req.query.ordem === 'municipio' ? 'm.nome ASC' : 'e.valor_total DESC, m.nome ASC';
        // Evita divergencias por acentos na busca: nomes publicados vem sem acentos.
        const consulta = `FROM estatistica_receita_municipio_ano e
            JOIN municipio m ON m.id = e.municipio_id
            JOIN importacao i ON i.id = e.importacao_id
            WHERE e.ano = $1 AND translate(upper(m.nome),
                'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ', 'AAAAAEEEEIIIIOOOOOUUUUC') LIKE '%' || $2 || '%'`;
        const parametros = [ano, busca];
        const contagem = await pool.query(`SELECT count(*)::int AS total ${consulta}`, parametros);
        const total = contagem.rows[0].total;
        const paginaAtual = Math.min(pagina, Math.max(1, Math.ceil(total / limite)));
        const [dados, ultima] = await Promise.all([
            pool.query(`SELECT e.*, m.nome AS municipio, ${atualizado}
                ${consulta}
                ORDER BY ${ordem} LIMIT $3 OFFSET $4`,
            [...parametros, limite, (paginaAtual - 1) * limite]),
            pool.query(`SELECT i.importado_em AS ultima_atualizacao
                FROM estatistica_receita_estado_ano e
                JOIN importacao i ON i.id = e.importacao_id WHERE e.ano = $1`, [ano]),
        ]);
        res.json({ dados: dados.rows, total,
            pagina: paginaAtual, limite, ultima_atualizacao: ultima.rows[0]?.ultima_atualizacao || null });
    }));

    router.get('/municipios', tratar(async (req, res) => {
        const dados = await pool.query(`SELECT DISTINCT m.id, m.nome
            FROM municipio m JOIN estatistica_receita_municipio_ano e ON e.municipio_id = m.id
            ORDER BY m.nome`);
        res.json(dados.rows);
    }));

    router.get('/municipios/:id/repasses', tratar(async (req, res) => {
        const id = Number(req.params.id);
        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({ erro: 'Identificador do municipio invalido.' });
        }
        const dados = await pool.query(`SELECT e.*, m.nome AS municipio, ${atualizado}
            FROM estatistica_receita_municipio_ano e
            JOIN municipio m ON m.id = e.municipio_id
            JOIN importacao i ON i.id = e.importacao_id
            WHERE e.municipio_id = $1 ORDER BY e.ano`, [id]);
        if (!dados.rowCount) return res.status(404).json({ erro: 'Municipio nao encontrado.' });
        const historico = dados.rows;
        res.json({ municipio: { id, nome: historico[0].municipio }, historico,
            ultima_atualizacao: historico.at(-1).ultima_atualizacao });
    }));

    return router;
}

module.exports = { criarRotasRepasses };
