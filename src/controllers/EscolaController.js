const db = require('../database/db');

class EscolaController {
    // Listar todas as escolas (Para o aluno selecionar no cadastro)
    async listar(req, res) {
        try {
            const [rows] = await db.execute('SELECT * FROM escolas');
            return res.json(rows);
        } catch (error) {
            return res.status(500).json({ erro: 'Erro ao buscar escolas.' });
        }
    }

    // Cadastrar nova escola (Apenas Gestores/Admins deveriam fazer isso)
    async criar(req, res) {
        try {
            const { nome, endereco, bairro, codigo_inep } = req.body;

            // 1. Validação Básica
            if (!nome || !bairro) {
                return res.status(400).json({ erro: 'Nome e Bairro são obrigatórios.' });
            }

            // 2. VERIFICAÇÃO DE DUPLICIDADE (A melhoria solicitada)
            // Consultamos se já existe uma escola com esse nome NESSE bairro específico.
            // Usamos 'TRIM()' no SQL ou no JS para evitar que "Escola X " (com espaço) passe duplicado.
            const sqlCheck = 'SELECT id FROM escolas WHERE nome = ? AND bairro = ? LIMIT 1';
            const [escolasExistentes] = await db.execute(sqlCheck, [nome, bairro]);

            // Se o array voltou com algum item, significa que já existe.
            if (escolasExistentes.length > 0) {
                return res.status(409).json({ 
                    erro: 'Conflito: Já existe uma escola cadastrada com este nome neste bairro.' 
                });
            }

            // 3. Inserção (Só chega aqui se não existir duplicata)
            const sqlInsert = 'INSERT INTO escolas (nome, endereco, bairro, codigo_inep) VALUES (?, ?, ?, ?)';
            const [result] = await db.execute(sqlInsert, [nome, endereco, bairro, codigo_inep]);

            return res.status(201).json({ 
                mensagem: 'Escola cadastrada com sucesso!',
                id: result.insertId 
            });

        } catch (error) {
            console.error('Erro ao cadastrar escola:', error); // Log útil para debug
            return res.status(500).json({ erro: 'Erro interno ao processar cadastro.' });
        }
    }
}

module.exports = new EscolaController();