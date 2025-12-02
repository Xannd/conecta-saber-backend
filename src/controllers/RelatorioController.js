const db = require('../database/db');

class RelatorioController {
    // Retorna estatísticas gerais do sistema
    async dashboardGeral(req, res) {
        try {
            const perfil = req.usuarioPerfil; // 'GESTOR' ou 'VOLUNTARIO'
            const id_usuario = req.usuarioId;

            // --- CENÁRIO 1: É UM VOLUNTÁRIO (Vê só os dados dele) ---
            if (perfil === 'VOLUNTARIO') {
                // 1. Minhas aulas dadas (Concluídas)
                const sqlAulasDadas = `
                    SELECT COUNT(*) as total 
                    FROM agendamentos a
                    JOIN ofertas_aulas o ON a.id_oferta = o.id
                    WHERE o.id_voluntario = ? AND a.status = 'CONCLUIDO'
                `;
                const [rowsAulas] = await db.execute(sqlAulasDadas, [id_usuario]);
                
                // 2. Meus alunos atendidos (Distintos)
                const sqlAlunos = `
                    SELECT COUNT(DISTINCT a.id_aluno) as total
                    FROM agendamentos a
                    JOIN ofertas_aulas o ON a.id_oferta = o.id
                    WHERE o.id_voluntario = ? AND a.status = 'CONCLUIDO'
                `;
                const [rowsAlunos] = await db.execute(sqlAlunos, [id_usuario]);

                // 3. Minhas próximas aulas (Confirmadas)
                const sqlProximas = `
                    SELECT a.data_aula, o.horario_inicio, u.nome as nome_aluno, o.disciplina
                    FROM agendamentos a
                    JOIN ofertas_aulas o ON a.id_oferta = o.id
                    JOIN usuarios u ON a.id_aluno = u.id
                    WHERE o.id_voluntario = ? AND a.status = 'CONFIRMADO' AND a.data_aula >= CURRENT_DATE
                    ORDER BY a.data_aula ASC
                    LIMIT 5
                `;
                const [proximas] = await db.execute(sqlProximas, [id_usuario]);

                return res.json({
                    perfil: 'VOLUNTARIO',
                    kpis: {
                        aulas_concluidas: rowsAulas[0].total,
                        alunos_impactados: rowsAlunos[0].total
                    },
                    proximas_aulas: proximas
                });
            }

            // --- CENÁRIO 2: É UM GESTOR (Vê tudo - Mantivemos o código anterior) ---
            if (perfil === 'GESTOR') {
                // (Código anterior do Gestor...)
                const sqlStatus = 'SELECT status, COUNT(*) as total FROM agendamentos GROUP BY status';
                const [statsStatus] = await db.execute(sqlStatus);

                const sqlTopVoluntarios = `
                    SELECT u.nome, COUNT(a.id) as total_aulas
                    FROM agendamentos a
                    JOIN ofertas_aulas o ON a.id_oferta = o.id
                    JOIN usuarios u ON o.id_voluntario = u.id
                    WHERE a.status = 'CONCLUIDO'
                    GROUP BY u.id
                    ORDER BY total_aulas DESC LIMIT 5
                `;
                const [topVoluntarios] = await db.execute(sqlTopVoluntarios);
                const totalAulasConcluidas = statsStatus.find(s => s.status === 'CONCLUIDO')?.total || 0;

                return res.json({
                    perfil: 'GESTOR',
                    impacto_social: {
                        total_aulas_realizadas: totalAulasConcluidas,
                        estimativa_horas_ensino: totalAulasConcluidas * 2
                    },
                    resumo_status: statsStatus,
                    top_voluntarios: topVoluntarios
                });
            }

            // Se for ALUNO tentando acessar painel de gestão
            return res.status(403).json({ erro: 'Acesso restrito.' });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ erro: 'Erro ao gerar dashboard.' });
        }
    }
    // Listar Voluntários (Com filtro opcional por status)
    async listarVoluntarios(req, res) {
        try {
            const { status } = req.query; // ?status=PENDENTE
            let sql = 'SELECT id, nome, email, telefone, status_conta, created_at FROM usuarios WHERE tipo_perfil = "VOLUNTARIO"';
            const params = [];

            if (status) {
                sql += ' AND status_conta = ?';
                params.push(status);
            }
            
            sql += ' ORDER BY created_at DESC';

            const [rows] = await db.execute(sql, params);
            return res.json(rows);
        } catch (error) {
            return res.status(500).json({ erro: 'Erro ao listar voluntários.' });
        }
    }

    // Aprovar Voluntário (Mudar status para ATIVO)
    async aprovarVoluntario(req, res) {
        try {
            const { id } = req.params;
            await db.execute('UPDATE usuarios SET status_conta = "ATIVO" WHERE id = ?', [id]);
            return res.json({ mensagem: 'Voluntário aprovado com sucesso!' });
        } catch (error) {
            return res.status(500).json({ erro: 'Erro ao aprovar voluntário.' });
        }
    }

    // Listar TODOS os Agendamentos (Visão Geral do Gestor)
    async listarTodosAgendamentos(req, res) {
        try {
            const sql = `
                SELECT 
                    a.id, a.data_aula, a.status,
                    u_aluno.nome as aluno,
                    u_voluntario.nome as voluntario,
                    o.disciplina
                FROM agendamentos a
                JOIN usuarios u_aluno ON a.id_aluno = u_aluno.id
                JOIN ofertas_aulas o ON a.id_oferta = o.id
                JOIN usuarios u_voluntario ON o.id_voluntario = u_voluntario.id
                ORDER BY a.data_aula DESC
                LIMIT 50
            `;
            const [rows] = await db.execute(sql);
            return res.json(rows);
        } catch (error) {
            return res.status(500).json({ erro: 'Erro ao listar histórico.' });
        }
    }
}

module.exports = new RelatorioController();