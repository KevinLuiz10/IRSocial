const express = require('express');
const { Pool } = require('pg');
const path = require('path');

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

// Servir os arquivos estáticos do React (que serão copiados pelo Docker)
app.use(express.static(path.join(__dirname, 'public')));

// Redirecionar qualquer outra rota para o React Router lidar
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Backend rodando na porta ${port}`);
});