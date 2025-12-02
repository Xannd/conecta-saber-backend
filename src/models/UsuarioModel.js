const db = require('../database/db');

class UsuarioModel {
    // Busca usuário por e-mail (para evitar duplicidade)
    static async findByEmail(email) {
        const sql = 'SELECT * FROM usuarios WHERE email = ?';
        const [rows] = await db.execute(sql, [email]);
        return rows[0];
    }

    // Cria novo usuário
    static async create(dados) {
        const { nome, email, senha_hash, tipo_perfil, telefone, id_escola } = dados;
        
        // Define status inicial: Voluntários pendentes, outros ativos
        const status_conta = tipo_perfil === 'VOLUNTARIO' ? 'PENDENTE' : 'ATIVO';

        const sql = `
            INSERT INTO usuarios (nome, email, senha_hash, tipo_perfil, telefone, id_escola, status_conta) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        const [result] = await db.execute(sql, [
            nome, email, senha_hash, tipo_perfil, telefone, id_escola, status_conta
        ]);
        
        return result.insertId; // Retorna o ID do novo usuário
    }
}

module.exports = UsuarioModel;