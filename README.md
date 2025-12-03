# 💰 Sistema Financeiro iOS-Style

Sistema completo de controle financeiro pessoal com design inspirado no iOS (Human Interface Guidelines da Apple).

## 🌟 Características

- ✅ **Design iOS Autêntico**: Interface elegante e minimalista seguindo o HIG da Apple
- 💎 **Glassmorphism**: Efeitos de blur e transparência característicos do iOS
- 🎨 **Paleta de Cores iOS**: Cores oficiais do sistema iOS
- 📊 **Dashboard Interativo**: Gráficos e estatísticas em tempo real
- 🎙️ **Integração n8n**: Registro via áudio/WhatsApp com NLP em português
- 👥 **Multiusuário**: Suporte para usuários normais e administradores
- 🔒 **Autenticação JWT**: Sistema de login seguro
- 📱 **Responsivo**: Funciona perfeitamente em mobile, tablet e desktop

## 🛠️ Tecnologias

### Backend
- Node.js + Express
- SQLite (better-sqlite3)
- JWT para autenticação
- bcrypt para hash de senhas
- NLP customizado para português

### Frontend
- React 18 + Vite
- React Router v6
- Axios
- Chart.js
- CSS puro (iOS Design System)

## 📦 Instalação

### 1. Backend

```bash
cd backend
npm install
npm run init-db   # Inicializar banco de dados
npm start         # Ou: npm run dev (com auto-reload)
```

O backend estará rodando em `http://localhost:3000`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

O frontend estará rodando em `http://localhost:5173`

## 🚀 Uso

### Criar primeiro usuário administrador

Use um cliente HTTP como Postman ou curl:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Admin",
    "email": "admin@financeiro.com",
    "senha": "senha123",
    "tipo": "admin"
  }'
```

### Login

Acesse `http://localhost:5173/login` e faça login com suas credenciais.

## 🎙️ Integração WhatsApp/n8n

### Endpoints de Webhook

**POST /webhook/n8n/despesa**
```json
{
  "usuario_id": 1,
  "texto": "gastei 50 reais com gasolina hoje"
}
```

**POST /webhook/n8n/receita**
```json
{
  "usuario_id": 1,
  "texto": "recebi 400 de freela ontem"
}
```

### Exemplos de textos reconhecidos

- "gastei 50 reais com gasolina hoje"
- "paguei o aluguel de 800"
- "comprei lanche de 25 reais"
- "recebi 400 de freelas ontem"
- "ganhei salário de 3000"

## 📁 Estrutura do Projeto

```
financeiro/
├── backend/
│   ├── database/
│   │   ├── schema.sql
│   │   ├── database.js
│   │   └── init.js
│   ├── middleware/
│   │   └── auth.middleware.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── usuarios.routes.js
│   │   ├── categorias.routes.js
│   │   ├── despesas.routes.js
│   │   ├── receitas.routes.js
│   │   └── webhook.routes.js
│   ├── services/
│   │   └── nlp.service.js
│   ├── server.js
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Button.jsx
    │   │   ├── Input.jsx
    │   │   ├── Card.jsx
    │   │   ├── Switch.jsx
    │   │   ├── Modal.jsx
    │   │   ├── BottomNav.jsx
    │   │   └── SegmentControl.jsx
    │   ├── screens/
    │   │   ├── LoginScreen.jsx
    │   │   ├── DashboardScreen.jsx
    │   │   ├── ExpenseScreen.jsx
    │   │   ├── IncomeScreen.jsx
    │   │   ├── CategoriesScreen.jsx
    │   │   └── ProfileScreen.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── services/
    │   │   └── api.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    └── package.json
```

## 🎨 Design System

O sistema utiliza as cores oficiais do iOS:
- **iOS Blue**: #007AFF (Primary)
- **iOS Green**: #34C759 (Success/Income)
- **iOS Red**: #FF3B30 (Destructive/Expense)
- **iOS Orange**: #FF9500
- **iOS Purple**: #AF52DE

Tipografia: Inter (fallback para -apple-system)

## 📱 Funcionalidades

### Dashboard
- Cards com glassmorphism mostrando saldo, receitas e despesas
- Gráfico de pizza por categoria
- Filtros por período (Hoje, Semana, Mês, Ano)
- Animações suaves iOS-style

### Despesas/Receitas
- Listagem com ícones de categoria
- Adicionar/Editar/Excluir
- Modal deslizante de baixo para cima (iOS sheet style)
- Indicador de origem (manual vs WhatsApp)

### Categorias
- Criação personalizada com ícones e cores
- Segment control para filtrar por tipo
- Design estilo iOS Settings

### Perfil
- Informações da conta
- Badge de administrador
- Logout

## 🔐 Segurança

- Senhas com hash bcrypt
- JWT com expiração de 7 dias
- Middlewares de autorização
- Proteção de rotas no frontend

## 📄 Licença

MIT

---

Desenvolvido com ❤️ seguindo o Human Interface Guidelines da Apple
