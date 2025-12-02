const mysql = require('mysql2/promise'); // Importante usar a versão com promise para usar 'await'
require('dotenv').config(); // Para ler o arquivo .env

// Criação do Pool de Conexões (Gerencia múltiplas conexões simultâneas)
const pool = mysql.createPool({
    host: process.env.DB_HOST,       // Pega do .env
    user: process.env.DB_USER,       // Pega do .env
    password: process.env.DB_PASSWORD, // Pega do .env
    database: process.env.DB_NAME,   // Pega do .env (conecta_saber)
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Teste de conexão (aparece no terminal quando o servidor inicia)
pool.getConnection()
    .then(connection => {
        console.log('✅ MySQL Conectado com sucesso!');
        connection.release();
    })
    .catch(error => {
        console.error('❌ Erro ao conectar no MySQL:', error.code);
        if (error.code === 'ECONNREFUSED') {
            console.error('   -> Verifique se o XAMPP/MySQL está rodando.');
        }
    });

module.exports = pool;