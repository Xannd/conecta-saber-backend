const express        = require('express');
const router         = express.Router();
const authMiddleware = require('../middlewares/authMiddleware'); 

const UsuarioController     = require('../controllers/UsuarioController');
const AuthController        = require('../controllers/AuthController');
const EscolaController      = require('../controllers/EscolaController'); 
const OfertaController      = require('../controllers/OfertaController'); 
const AgendamentoController = require('../controllers/AgendamentoController');
const RelatorioController   = require('../controllers/RelatorioController');

router.get('/status', (req, res) => {
    res.json({ status: 'OK', mensagem: 'API Conecta Saber rodando!' });
});

// --- Rotas de Usuários ---
router.post('/usuarios/registro', UsuarioController.registrar);
router.post('/login', AuthController.login);

// --- rotas de Escolas ---
router.get('/escolas', EscolaController.listar);
router.post('/escolas', authMiddleware, EscolaController.criar);


// --- Rotas de Voluntário ---
router.post('/ofertas', authMiddleware, OfertaController.criar);
router.get('/ofertas/meus-registros', authMiddleware, OfertaController.listarMinhasOfertas);
router.get('/ofertas/busca', authMiddleware, OfertaController.buscar);


// --- Rotas de Agendamento ---
router.post('/agendamentos', authMiddleware, AgendamentoController.agendar);
router.get('/agendamentos/pendentes', authMiddleware, AgendamentoController.listarSolicitacoesVoluntario);
router.get('/agendamentos/agenda', authMiddleware, AgendamentoController.listarConfirmados);
router.patch('/agendamentos/:id_agendamento/responder', authMiddleware, AgendamentoController.responderSolicitacao);
router.patch('/agendamentos/:id_agendamento/conclusao', authMiddleware, AgendamentoController.concluirAula);


// --- Rotas de Relatório ---
router.get('/gestao/dashboard', authMiddleware, RelatorioController.dashboardGeral);
router.get('/gestao/voluntarios', authMiddleware, RelatorioController.listarVoluntarios);
router.patch('/gestao/voluntarios/:id/aprovar', authMiddleware, RelatorioController.aprovarVoluntario);
router.get('/gestao/historico', authMiddleware, RelatorioController.listarTodosAgendamentos);
module.exports = router;