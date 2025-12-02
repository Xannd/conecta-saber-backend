const db = require('../database/db');

class OfertaModel {
    // Cria uma nova oferta de aula vinculada a um voluntário
    static async create(dados) {
        const { id_voluntario, disciplina, dias_disponiveis, horario_inicio, horario_fim } = dados;

        const sql = `
            INSERT INTO ofertas_aulas 
            (id_voluntario, disciplina, dias_disponiveis, horario_inicio, horario_fim) 
            VALUES (?, ?, ?, ?, ?)
        `;
        
        const [result] = await db.execute(sql, [
            id_voluntario, disciplina, dias_disponiveis, horario_inicio, horario_fim
        ]);
        
        return result.insertId;
    }

    // Lista todas as ofertas de um voluntário específico (Para ele ver o próprio histórico)
    static async listarPorVoluntario(idVoluntario) {
        const sql = 'SELECT * FROM ofertas_aulas WHERE id_voluntario = ? ORDER BY created_at DESC';
        const [rows] = await db.execute(sql, [idVoluntario]);
        return rows;
    }
    
    // Lista ofertas por disciplina (Será usado na busca do aluno depois)
    static async buscarPorDisciplina(termo) {
        // O termo "%termo%" serve para buscar partes da palavra (ex: "Mat" acha "Matemática")
        const sql = `
            SELECT o.*, u.nome as nome_voluntario 
            FROM ofertas_aulas o
            JOIN usuarios u ON o.id_voluntario = u.id
            WHERE o.disciplina LIKE ?
        `;
        const [rows] = await db.execute(sql, [`%${termo}%`]);
        return rows;
    }
}

module.exports = OfertaModel;