const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const { criarRotasRepasses } = require('./routes-repasses');

const app = express();
const port = 8080;

// Conexão com o PostgreSQL via variável de ambiente
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// Rota de teste da API consultando o banco
app.get('/api/status', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW() as time');
        res.json({ status: 'API e Banco conectados!', db_time: result.rows[0].time });
    } catch (err) {
        res.status(500).json({ error: 'Erro no banco', details: err.message });
    }
});

// Rotas oficiais de repasses (antes do fallback HTML do React).
app.use('/api', criarRotasRepasses(pool));

// Servir os arquivos estáticos do React (que serão copiados pelo Docker)
app.use(express.static(path.join(__dirname, 'public')));

// Rotas de API inexistentes devem retornar JSON (nunca o HTML do React).
app.use('/api', (req, res) => {
    res.status(404).json({ erro: 'Rota da API não encontrada.' });
});

// Erros da API precisam retornar JSON, inclusive falhas de conexao/migracao.
app.use('/api', (err, req, res, next) => {
    console.error('Erro na API:', err);
    res.status(500).json({ erro: 'Nao foi possivel consultar os dados no banco. Verifique a migracao e a conexao.' });
});

// Em Express 5, usar middleware final em vez do padrao antigo app.get('*').
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Backend rodando na porta ${port}`);
});