const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const routes = require('./routes'); // Vamos criar isso no Passo 4

const app = express();

// Middlewares Globais
app.use(helmet()); // Proteção básica de headers HTTP
app.use(cors());   // Permite que o Frontend (React/Flutter) acesse a API
app.use(express.json()); // Permite ler JSON no corpo das requisições

// Rotas
app.use('/api', routes); // Prefixo '/api' para todas as rotas

// Rota de teste simples
app.get('/', (req, res) => {
    res.send('API Conecta Saber - Online 🚀');
});

module.exports = app;