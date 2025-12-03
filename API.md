# 📡 API Documentation - Sistema Financeiro

Base URL Backend: `http://localhost:3000`

---

## 🔐 Autenticação

### Register
**POST** `/api/auth/register`

**Body:**
```json
{
  "nome": "João Silva",
  "email": "joao@example.com",
  "telefone": "11999999999",
  "senha": "senha123",
  "tipo": "normal"  // ou "admin"
}
```

**Response 201:**
```json
{
  "message": "Usuário criado com sucesso",
  "userId": 1,
  "nome": "João Silva",
  "email": "joao@example.com",
  "tipo": "normal"
}
```

---

### Login
**POST** `/api/auth/login`

**Body:**
```json
{
  "email": "joao@example.com",
  "senha": "senha123"
}
```

**Response 200:**
```json
{
  "message": "Login realizado com sucesso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "nome": "João Silva",
    "email": "joao@example.com",
    "telefone": "11999999999",
    "tipo": "normal"
  }
}
```

---

## 👥 Usuários

**Headers:** `Authorization: Bearer {token}`

### Listar Usuários (Admin only)
**GET** `/api/usuarios`

**Response 200:**
```json
{
  "usuarios": [
    {
      "id": 1,
      "nome": "João Silva",
      "email": "joao@example.com",
      "telefone": "11999999999",
      "tipo": "normal",
      "created_at": "2025-12-02 14:30:00"
    }
  ]
}
```

---

### Buscar Usuário
**GET** `/api/usuarios/:id`

---

### Atualizar Usuário
**PUT** `/api/usuarios/:id`

**Body:**
```json
{
  "nome": "João Silva Atualizado",
  "telefone": "11988888888"
}
```

---

### Deletar Usuário (Admin only)
**DELETE** `/api/usuarios/:id`

---

## 📑 Categorias

**Headers:** `Authorization: Bearer {token}`

### Listar Categorias
**GET** `/api/categorias?tipo=despesa`

Query params:
- `tipo` (opcional): "despesa" ou "receita"

**Response 200:**
```json
{
  "categorias": [
    {
      "id": 1,
      "nome": "Alimentação",
      "tipo": "despesa",
      "icone": "🍔",
      "cor": "#FF9500",
      "created_at": "2025-12-02 14:30:00"
    }
  ]
}
```

---

### Criar Categoria
**POST** `/api/categorias`

**Body:**
```json
{
  "nome": "Alimentação",
  "tipo": "despesa",
  "icone": "🍔",
  "cor": "#FF9500"
}
```

---

### Atualizar Categoria
**PUT** `/api/categorias/:id`

**Body:**
```json
{
  "nome": "Comida",
  "icone": "🍕",
  "cor": "#FF2D55"
}
```

---

### Deletar Categoria
**DELETE** `/api/categorias/:id`

---

## 💸 Despesas

**Headers:** `Authorization: Bearer {token}`

### Listar Despesas
**GET** `/api/despesas`

Query params:
- `dataInicio` (opcional): "2025-01-01"
- `dataFim` (opcional): "2025-12-31"
- `categoriaId` (opcional): ID da categoria
- `usuarioId` (opcional, admin only): ID do usuário

**Response 200:**
```json
{
  "despesas": [
    {
      "id": 1,
      "usuario_id": 1,
      "categoria_id": 1,
      "valor": 50.00,
      "data": "2025-12-02",
      "descricao": "Almoço no restaurante",
      "origem": "manual",
      "created_at": "2025-12-02 14:30:00",
      "categoria_nome": "Alimentação",
      "categoria_icone": "🍔",
      "categoria_cor": "#FF9500",
      "usuario_nome": "João Silva"
    }
  ]
}
```

---

### Criar Despesa
**POST** `/api/despesas`

**Body:**
```json
{
  "categoria_id": 1,
  "valor": 50.00,
  "data": "2025-12-02",
  "descricao": "Almoço no restaurante",
  "origem": "manual"  // ou "whatsapp"
}
```

---

### Buscar Despesa
**GET** `/api/despesas/:id`

---

### Atualizar Despesa
**PUT** `/api/despesas/:id`

**Body:**
```json
{
  "categoria_id": 2,
  "valor": 55.00,
  "data": "2025-12-02",
  "descricao": "Almoço atualizado"
}
```

---

### Deletar Despesa
**DELETE** `/api/despesas/:id`

---

## 💰 Receitas

Mesmas rotas de Despesas, mas em `/api/receitas/*`

---

## 🎙️ Webhooks n8n

**Sem autenticação JWT** (use autenticação do n8n)

### Webhook Despesa
**POST** `/webhook/n8n/despesa`

**Body:**
```json
{
  "usuario_id": 1,
  "texto": "gastei 50 reais com gasolina hoje"
}
```

**Response 201:**
```json
{
  "message": "Despesa criada com sucesso via webhook",
  "despesaId": 42,
  "dados_extraidos": {
    "valor": 50,
    "data": "2025-12-02",
    "categoria_sugerida": "transporte",
    "categoria_id": 2
  }
}
```

---

### Webhook Receita
**POST** `/webhook/n8n/receita`

**Body:**
```json
{
  "usuario_id": 1,
  "texto": "recebi 400 de freela"
}
```

**Response 201:**
```json
{
  "message": "Receita criada com sucesso via webhook",
  "receitaId": 12,
  "dados_extraidos": {
    "valor": 400,
    "data": "2025-12-02",
    "categoria_sugerida": "freelance",
    "categoria_id": 9
  }
}
```

---

## 📊 Exemplos de NLP

O parser reconhece padrões em português:

### Despesas:
- "gastei 50 reais com gasolina hoje"
- "paguei o aluguel de 800 ontem"
- "comprei lanche de 25 reais"
- "saiu 100 do mercado dia 15/12"

### Receitas:
- "recebi 400 de freela"
- "ganhei salário de 3000"
- "entrou 200 de dividendos ontem"

### Categorias Reconhecidas:

**Despesas:**
- Alimentação: comida, restaurante, lanche, mercado, supermercado
- Transporte: gasolina, uber, táxi, ônibus, combustível
- Moradia: aluguel, condomínio, água, luz, internet
- Saúde: farmácia, remédio, médico, consulta
- Lazer: cinema, show, festa, viagem, netflix
- Educação: curso, livro, escola, faculdade

**Receitas:**
- Salário: salário, pagamento, trabalho
- Freelance: freela, freelance, bico, extra
- Investimentos: dividendo, investimento, ação

---

## 🔒 Autorização

### Tipos de Usuário

**Admin:**
- Pode ver dados de todos os usuários
- Pode deletar usuários
- Pode gerenciar qualquer despesa/receita

**Normal:**
- Só vê seus próprios dados
- Só pode deletar suas próprias despesas/receitas

---

## ❌ Códigos de Erro

- **400**: Bad Request (dados inválidos)
- **401**: Unauthorized (sem token ou token inválido)
- **403**: Forbidden (sem permissão)
- **404**: Not Found
- **409**: Conflict (email já cadastrado)
- **500**: Internal Server Error

---

## 🧪 Testando com cURL

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@financeiro.com","senha":"admin123"}'
```

### Criar Despesa
```bash
curl -X POST http://localhost:3000/api/despesas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "categoria_id": 1,
    "valor": 50.00,
    "data": "2025-12-02",
    "descricao": "Teste"
  }'
```

### Webhook
```bash
curl -X POST http://localhost:3000/webhook/n8n/despesa \
  -H "Content-Type: application/json" \
  -d '{
    "usuario_id": 1,
    "texto": "gastei 50 reais com gasolina hoje"
  }'
```
