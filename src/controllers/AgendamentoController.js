const AgendamentoModel = require("../models/AgendamentoModel");
const db = require("../database/db"); // Para buscar detalhes da oferta

class AgendamentoController {
  async agendar(req, res) {
    try {
      const id_aluno = req.usuarioId; // Vem do Token
      const { id_oferta, data_aula } = req.body; // data_aula formato 'YYYY-MM-DD'

      // --- VERIFICAÇÃO 1: Campos Obrigatórios ---
      if (!id_oferta || !data_aula) {
        return res
          .status(400)
          .json({ erro: "Oferta e Data são obrigatórios." });
      }

      // --- VERIFICAÇÃO 2: Data no Passado ---
      // Não faz sentido agendar aula para ontem
      const dataAtual = new Date();
      const dataSolicitada = new Date(data_aula);
      // Zera as horas para comparar apenas o dia
      dataAtual.setHours(0, 0, 0, 0);

      if (dataSolicitada < dataAtual) {
        return res
          .status(400)
          .json({ erro: "Não é possível agendar para uma data passada." });
      }

      // --- VERIFICAÇÃO 3: Oferta Existe? ---
      // Precisamos garantir que o ID da oferta é real
      const [ofertaExiste] = await db.execute(
        "SELECT id FROM ofertas_aulas WHERE id = ?",
        [id_oferta]
      );
      if (ofertaExiste.length === 0) {
        return res.status(404).json({ erro: "Oferta de aula não encontrada." });
      }

      // --- VERIFICAÇÃO 4: Duplicidade (Sua regra principal) ---
      // O aluno já pediu essa mesma aula nessa mesma data?
      const agendamentoExistente = await AgendamentoModel.verificarDuplicidade(
        id_aluno,
        id_oferta,
        data_aula
      );

      if (agendamentoExistente) {
        return res.status(409).json({
          erro: "Você já solicitou agendamento para esta aula nesta data.",
        });
      }

      // SE PASSOU POR TUDO: CRIA O AGENDAMENTO
      const idAgendamento = await AgendamentoModel.create({
        id_aluno,
        id_oferta,
        data_aula,
      });

      return res.status(201).json({
        mensagem:
          "Solicitação de agendamento enviada! Aguarde a confirmação do voluntário.",
        id: idAgendamento,
        status: "SOLICITADO",
      });
    } catch (error) {
      console.error("Erro no agendamento:", error);
      return res
        .status(500)
        .json({ erro: "Erro interno ao processar agendamento." });
    }
  }
  async listarSolicitacoesVoluntario(req, res) {
    try {
      const id_voluntario = req.usuarioId;

      const sql = `
              SELECT 
                  a.id AS id_agendamento,
                  a.data_aula,
                  a.status,
                  u.nome AS nome_aluno,
                  o.disciplina
              FROM agendamentos a
              JOIN ofertas_aulas o ON a.id_oferta = o.id
              JOIN usuarios u ON a.id_aluno = u.id
              WHERE o.id_voluntario = ? 
              AND a.status = 'SOLICITADO' -- Mostra apenas o que precisa de atenção
              ORDER BY a.data_aula ASC
          `;

      const [solicitacoes] = await db.execute(sql, [id_voluntario]);
      return res.json(solicitacoes);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ erro: "Erro ao buscar solicitações." });
    }
  }
  async listarConfirmados(req, res) {
   try {
       const id_usuario = req.usuarioId;
       const perfil = req.usuarioPerfil; // 'ALUNO' ou 'VOLUNTARIO'

       let sql = '';
       
       if (perfil === 'VOLUNTARIO') {
           // Voluntário quer ver seus alunos agendados
           sql = `
               SELECT 
                   a.id AS id_agendamento,
                   a.data_aula,
                   o.horario_inicio,
                   o.horario_fim,
                   o.disciplina,
                   u.nome AS nome_aluno,
                   u.telefone AS contato_aluno
               FROM agendamentos a
               JOIN ofertas_aulas o ON a.id_oferta = o.id
               JOIN usuarios u ON a.id_aluno = u.id
               WHERE o.id_voluntario = ? 
               AND a.status = 'CONFIRMADO'
               ORDER BY a.data_aula ASC, o.horario_inicio ASC
           `;
       } else {
           // Aluno quer ver suas aulas confirmadas
           sql = `
               SELECT 
                   a.id AS id_agendamento,
                   a.data_aula,
                   o.horario_inicio,
                   o.horario_fim,
                   o.disciplina,
                   u.nome AS nome_voluntario
               FROM agendamentos a
               JOIN ofertas_aulas o ON a.id_oferta = o.id
               JOIN usuarios u ON o.id_voluntario = u.id
               WHERE a.id_aluno = ? 
               AND a.status = 'CONFIRMADO'
               ORDER BY a.data_aula ASC
           `;
       }

       const [agenda] = await db.execute(sql, [id_usuario]);
       return res.json(agenda);

   } catch (error) {
       console.error(error);
       return res.status(500).json({ erro: 'Erro ao buscar agenda confirmada.' });
   }
}
  async responderSolicitacao(req, res) {
    try {
      const id_voluntario = req.usuarioId;
      const { id_agendamento } = req.params; // Vem da URL /agendamentos/:id/responder
      const { novo_status } = req.body; // { "novo_status": "CONFIRMADO" }

      // 1. Validação de Entrada
      const statusPermitidos = ["CONFIRMADO", "CANCELADO"];
      if (!statusPermitidos.includes(novo_status)) {
        return res
          .status(400)
          .json({ erro: "Status inválido. Use CONFIRMADO ou CANCELADO." });
      }

      // 2. VERIFICAÇÃO DE SEGURANÇA (Sua regra de ouro)
      // Verifica se o agendamento existe E se pertence a uma oferta DESSE voluntário
      const sqlCheck = `
           SELECT a.id 
           FROM agendamentos a
           JOIN ofertas_aulas o ON a.id_oferta = o.id
           WHERE a.id = ? AND o.id_voluntario = ?
       `;

      const [agendamento] = await db.execute(sqlCheck, [
        id_agendamento,
        id_voluntario,
      ]);

      if (agendamento.length === 0) {
        return res.status(403).json({
          erro: "Operação proibida. Agendamento não encontrado ou não pertence a você.",
        });
      }

      // 3. Atualização no Banco
      await db.execute("UPDATE agendamentos SET status = ? WHERE id = ?", [
        novo_status,
        id_agendamento,
      ]);

      return res.json({
        mensagem: `Agendamento ${novo_status} com sucesso!`,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ erro: "Erro ao atualizar agendamento." });
    }
  }
  async concluirAula(req, res) {
    try {
      const id_voluntario = req.usuarioId;
      const { id_agendamento } = req.params;
      const { presenca_confirmada, feedback } = req.body; // Boolean e String

      // 1. Validação de Campos
      if (presenca_confirmada === undefined || !feedback) {
        return res
          .status(400)
          .json({ erro: "Presença e Feedback são obrigatórios." });
      }

      // 2. BUSCA E VERIFICAÇÃO DE SEGURANÇA (Dono + Status + Data)
      const sqlCheck = `
           SELECT a.id, a.status, a.data_aula, o.id_voluntario
           FROM agendamentos a
           JOIN ofertas_aulas o ON a.id_oferta = o.id
           WHERE a.id = ?
       `;

      const [rows] = await db.execute(sqlCheck, [id_agendamento]);
      const agendamento = rows[0];

      // 2.1 Verifica se existe
      if (!agendamento) {
        return res.status(404).json({ erro: "Agendamento não encontrado." });
      }

      // 2.2 Verifica se é o dono da oferta (Segurança)
      if (agendamento.id_voluntario !== id_voluntario) {
        return res
          .status(403)
          .json({ erro: "Você não tem permissão para avaliar esta aula." });
      }

      // 2.3 Verifica Status (Só pode concluir aula Confirmada)
      if (agendamento.status !== "CONFIRMADO") {
        return res.status(400).json({
          erro: `Não é possível concluir uma aula com status: ${agendamento.status}`,
        });
      }

      // 2.4 Verificação Temporal (Anti-Futuro)
      const dataAula = new Date(agendamento.data_aula);
      const dataAtual = new Date();
      dataAula.setHours(23, 59, 59); // Consideramos o fim do dia da aula

      if (dataAula > dataAtual) {
        return res.status(400).json({
          erro: "Você não pode finalizar uma aula futura. Aguarde a data do agendamento.",
        });
      }

      // 3. Atualização no Banco
      // Mudamos status para CONCLUIDO e salvamos os dados
      const sqlUpdate = `
           UPDATE agendamentos 
           SET status = 'CONCLUIDO', 
               presenca_confirmada = ?, 
               feedback_voluntario = ?
           WHERE id = ?
       `;

      await db.execute(sqlUpdate, [
        presenca_confirmada,
        feedback,
        id_agendamento,
      ]);

      return res.json({
        mensagem: "Aula concluída e feedback registrado com sucesso!",
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ erro: "Erro ao registrar conclusão da aula." });
    }
  }
}

module.exports = new AgendamentoController();
