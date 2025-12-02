const UsuarioModel = require('../models/UsuarioModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

class AuthController {
    async login(req, res) {
        try {
            const { email, senha } = req.body;

            // 1. Verificar se o usuário existe
            const usuario = await UsuarioModel.findByEmail(email);
            
            if (!usuario) {
                return res.status(401).json({ erro: 'Usuário ou senha inválidos.' });
            }

            // 2. Verificar se a senha bate (Comparar a senha enviada com o Hash do banco)
            const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
            
            if (!senhaValida) {
                return res.status(401).json({ erro: 'Usuário ou senha inválidos.' });
            }

            // 3. Gerar o Token JWT
            // O token vai guardar o ID e o PERFIL do usuário (informações úteis para o Front)
            const token = jwt.sign(
                { 
                    id: usuario.id, 
                    perfil: usuario.tipo_perfil,
                    nome: usuario.nome 
                },
                process.env.JWT_SECRET || 'chave_secreta_padrao_dev', // Use variável de ambiente em produção!
                { expiresIn: '8h' } // Token expira em 8 horas
            );

            // 4. Retornar dados (sem a senha!)
            return res.json({
                mensagem: 'Login realizado com sucesso!',
                token: token,
                usuario: {
                    id: usuario.id,
                    nome: usuario.nome,
                    email: usuario.email,
                    tipo_perfil: usuario.tipo_perfil
                }
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ erro: 'Erro interno no login.' });
        }
    }
}

module.exports = new AuthController();