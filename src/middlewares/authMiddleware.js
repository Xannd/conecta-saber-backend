const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (req, res, next) => {
    // 1. Buscar o token no cabeçalho da requisição (Header: Authorization)
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ erro: 'Acesso negado. Token não fornecido.' });
    }

    // O formato geralmente é "Bearer <TOKEN>", então separamos para pegar só o código
    const parts = authHeader.split(' ');
    
    if (parts.length !== 2) {
        return res.status(401).json({ erro: 'Erro no formato do Token.' });
    }

    const [ scheme, token ] = parts;

    if (!/^Bearer$/i.test(scheme)) {
        return res.status(401).json({ erro: 'Token mal formatado.' });
    }

    // 2. Verificar se o token é válido
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ erro: 'Token inválido ou expirado.' });
        }

        // 3. Salvar o ID do usuário na requisição para uso posterior
        req.usuarioId = decoded.id;
        req.usuarioPerfil = decoded.perfil;
        
        return next(); // Pode passar, está liberado!
    });
};