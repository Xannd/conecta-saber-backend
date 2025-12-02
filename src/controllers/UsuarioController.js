const UsuarioModel = require('../models/UsuarioModel');
const bcrypt = require('bcrypt');

class UsuarioController {
    async registrar(req, res) {
        try {
            const { nome, email, senha, tipo_perfil, telefone, id_escola } = req.body;

            // 1. Validação básica
            if (!nome || !email || !senha || !tipo_perfil) {
                return res.status(400).json({ erro: 'Preencha todos os campos obrigatórios.' });
            }

            // 2. Verificar se usuário já existe
            const usuarioExistente = await UsuarioModel.findByEmail(email);
            if (usuarioExistente) {
                return res.status(409).json({ erro: 'E-mail já cadastrado.' });
            }

            // 3. Criptografar a senha (RNF03 - Segurança)
            const salt = await bcrypt.genSalt(10);
            const senha_hash = await bcrypt.hash(senha, salt);

            // 4. Criar usuário
            const novoId = await UsuarioModel.create({
                nome,
                email,
                senha_hash,
                tipo_perfil,
                telefone,
                id_escola
            });

            res.status(201).json({
                mensagem: 'Usuário cadastrado com sucesso!',
                id: novoId,
                status: tipo_perfil === 'VOLUNTARIO' ? 'PENDENTE' : 'ATIVO'
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ erro: 'Erro interno do servidor.' });
        }
    }
}

module.exports = new UsuarioController();