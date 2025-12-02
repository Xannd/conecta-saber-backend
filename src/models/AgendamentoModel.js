const db = require('../database/db');

class AgendamentoModel {
    // Verifica se já existe agendamento idêntico (Aluno + Oferta + Data)
    static async verificarDuplicidade(id_aluno, id_oferta, data_aula) {
        const sql = `
            SELECT id FROM agendamentos 
            WHERE id_aluno = ? AND id_oferta = ? AND data_aula = ?
        `;
        const [rows] = await db.execute(sql, [id_aluno, id_oferta, data_aula]);
        return rows[0];
    }

    static async create(dados) {
        const { id_aluno, id_oferta, data_aula } = dados;
        // Status inicial é sempre SOLICITADO (aguardando aceite do voluntário)
        const sql = `
            INSERT INTO agendamentos (id_aluno, id_oferta, data_aula, status) 
            VALUES (?, ?, ?, 'SOLICITADO')
        `;
        const [result] = await db.execute(sql, [id_aluno, id_oferta, data_aula]);
        return result.insertId;
    }
}

module.exports = AgendamentoModel;