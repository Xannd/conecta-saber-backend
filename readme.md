# Documentação da API - Conecta Saber

Esta API fornece os serviços de backend para a plataforma **Conecta Saber**, conectando alunos a voluntários de reforço escolar, com painel de gestão administrativa.

**Base URL:** `http://localhost:3000/api`
> *Nota: Para acesso Mobile via USB/Wi-Fi, substitua `localhost` pelo seu IP local (ex: `192.168.1.X`).*

---

## 🔐 Autenticação e Segurança

A API utiliza **JWT (JSON Web Token)**.
A maioria das rotas é protegida. Para acessá-las, você deve enviar o token no cabeçalho da requisição.

**Header:**

# Authorization: Bearer <SEU_TOKEN_AQUI>


## 1. Usuários e Autenticação
# Login

Autentica um usuário e retorna o Token de acesso.

# Rota: POST /login

Acesso: Público

Body (JSON):

```json

{
  "email": "usuario@email.com",
  "senha": "123456strongpassword"
}
```

Resposta (200 OK):

JSON
```json
{
  "mensagem": "Login realizado com sucesso!",
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "usuario": { "id": 1, "nome": "Felipe", "tipo_perfil": "ALUNO" }
}
```


## Registro de Usuário

Cadastra um novo usuário no sistema.

# Rota: POST /usuarios/registro

Acesso: Público

Body (JSON):

```json
{
  "nome": "João da Silva",
  "email": "joao@email.com",
  "senha": "senha_segura",
  "tipo_perfil": "ALUNO",
  "telefone": "11999999999",
  "id_escola": 1
}
```

Nota: tipo_perfil pode ser 'ALUNO', 'VOLUNTARIO' ou 'GESTOR'. id_escola é opcional para voluntários.



###  Escolas

Listar Escolas
Retorna a lista de escolas cadastradas (usado no cadastro do aluno).

# Rota: GET /escolas

Acesso: Público

# Cadastrar Escola
Adiciona uma nova escola pública ao banco.

# Rota: POST /escolas

Acesso: Protegido (Requer Token)

Body (JSON):

```json
{
  "nome": "E.E. Conecta Saber",
  "endereco": "Rua das Flores, 123",
  "bairro": "Centro",
  "codigo_inep": "12345678"
}
```

## Ofertas de Aula (Matchmaking)

Criar Oferta
Voluntário disponibiliza horário para uma disciplina.

# Rota: POST /ofertas

Acesso: Protegido (Apenas Voluntários)

Body (JSON):

```json
{
  "disciplina": "Matemática",
  "dias_disponiveis": "Segunda e Quarta",
  "horario_inicio": "14:00",
  "horario_fim": "16:00"
}
```

# Buscar Ofertas
Aluno pesquisa por aulas disponíveis.

Rota: GET /ofertas/busca

Acesso: Protegido

Query Params: ?disciplina=Matematica

## Agendamentos

Solicitar Agendamento
Aluno solicita uma aula com base em uma oferta existente.

Rota: POST /agendamentos

Acesso: Protegido (Apenas Alunos)

Body (JSON):

```json
{
  "id_oferta": 5,
  "data_aula": "2025-12-20"
}
```

Minha Agenda (Confirmada)
Retorna a agenda consolidada do usuário (Aulas confirmadas).

Rota: GET /agendamentos/agenda

Acesso: Protegido

# Listar Pendências (Voluntário)
Voluntário vê solicitações de alunos aguardando aprovação.

Rota: GET /agendamentos/pendentes

Acesso: Protegido (Apenas Voluntários)

# Responder Solicitação
Voluntário aceita ou recusa um agendamento.

Rota: PATCH /agendamentos/:id_agendamento/responder

Acesso: Protegido (Apenas dono da oferta)

Body (JSON):

```json
{
  "novo_status": "CONFIRMADO"
}
```

Opções: 'CONFIRMADO' ou 'CANCELADO'.

# Concluir Aula (Pós-Aula)
Voluntário registra presença e feedback.

Rota: PATCH /agendamentos/:id_agendamento/conclusao

Acesso: Protegido

Body (JSON):

```json
{
  "presenca_confirmada": true,
  "feedback": "O aluno teve bom desempenho."
}
```


## Painel de Gestão (Dashboard)

Dashboard Geral
Retorna KPIs e estatísticas conforme o perfil.

# Rota: GET /gestao/dashboard

Acesso: Protegido

Listar Histórico Completo
Gestor audita todos os agendamentos do sistema.

# Rota: GET /gestao/historico

Acesso: Protegido (Apenas Gestores)

Gestão de Voluntários
Listar e aprovar voluntários pendentes.

Listar: GET /gestao/voluntarios?status=PENDENTE

Aprovar: PATCH /gestao/voluntarios/:id/aprovar

Acesso: Protegido (Apenas Gestores)

## 📋 Status do Banco de Dados

Agendamentos
SOLICITADO: Aguardando aceite.

CONFIRMADO: Aula agendada.

CANCELADO: Recusado/Cancelado.

CONCLUIDO: Aula finalizada.

Conta Voluntário
PENDENTE: Aguardando aprovação do Gestor.

ATIVO: Pode ofertar aulas.