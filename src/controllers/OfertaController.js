const OfertaModel = require('../models/OfertaModel');
const db = require('../database/db');
class OfertaController {
   async criar(req, res) {
      try {
          const id_voluntario = req.usuarioId; // Vem do Token
          const tipo_perfil = req.usuarioPerfil; // Vem do Token

          // 1. Validação de Perfil
          if (tipo_perfil !== 'VOLUNTARIO') {
              return res.status(403).json({ erro: 'Apenas voluntários podem ofertar aulas.' });
          }

          const { disciplina, dias_disponiveis, horario_inicio, horario_fim } = req.body;

          // 2. Validação de Campos
          if (!disciplina || !dias_disponiveis || !horario_inicio || !horario_fim) {
              return res.status(400).json({ erro: 'Todos os campos são obrigatórios.' });
          }

          // 3. VERIFICAÇÃO DE DUPLICIDADE E CONFLITO (Nova Lógica)
          // Verificamos se esse voluntário já tem QUALQUER aula nesses dias e horário inicial.
          // Isso evita:
          // a) Cadastrar Matemática duas vezes (Duplicidade)
          // b) Cadastrar Matemática e Inglês no mesmo horário (Conflito de Agenda)
          
          const sqlCheck = `
              SELECT id, disciplina FROM ofertas_aulas 
              WHERE id_voluntario = ? 
              AND dias_disponiveis = ? 
              AND horario_inicio = ?
          `;
          
          const [ofertasExistentes] = await db.execute(sqlCheck, [
              id_voluntario, 
              dias_disponiveis, 
              horario_inicio
          ]);

          if (ofertasExistentes.length > 0) {
              const conflito = ofertasExistentes[0];
              return res.status(409).json({ 
                  erro: `Conflito: Você já tem uma oferta de '${conflito.disciplina}' cadastrada para estes dias e horário.` 
              });
          }

          // 4. Criação (Se passou na verificação)
          const idOferta = await OfertaModel.create({
              id_voluntario,
              disciplina,
              dias_disponiveis,
              horario_inicio,
              horario_fim
          });

          return res.status(201).json({
              mensagem: 'Oferta de aula criada com sucesso!',
              id: idOferta
          });

      } catch (error) {
          console.error('Erro ao criar oferta:', error);
          return res.status(500).json({ erro: 'Erro interno ao processar oferta.' });
      }
  }

    async listarMinhasOfertas(req, res) {
        try {
            const id_voluntario = req.usuarioId;
            const ofertas = await OfertaModel.listarPorVoluntario(id_voluntario);
            return res.json(ofertas);
        } catch (error) {
            return res.status(500).json({ erro: 'Erro ao buscar ofertas.' });
        }
    }

    async buscar(req, res) {
      try {
          const { disciplina } = req.query; // Pega da URL ?disciplina=Matematica

          if (!disciplina) {
              // Se não digitar nada, retorna erro ou lista tudo (optei por erro para forçar filtro)
              return res.status(400).json({ erro: 'Informe uma disciplina para pesquisar.' });
          }

          // Busca usando LIKE para encontrar parciais ("Mat" acha "Matemática")
          const ofertas = await OfertaModel.buscarPorDisciplina(disciplina);
          
          return res.json(ofertas);
      } catch (error) {
          console.error(error);
          return res.status(500).json({ erro: 'Erro ao buscar aulas.' });
      }
  }
}

module.exports = new OfertaController();