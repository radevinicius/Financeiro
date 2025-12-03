# ⚠️ Nota Importante sobre Better-SQLite3 no Windows

O pacote `better-sqlite3` requer compilação de código nativo C++, o que necessita das seguintes ferramentas no Windows:

## Opção 1: Instalar dependências de compilação

1. **Python 3.6+**: [python.org](https://www.python.org/downloads/)
2. **Visual Studio Build Tools**: [visualstudio.microsoft.com](https://visualstudio.microsoft.com/downloads/)
   - Selecione "Desktop development with C++"

3. Depois execute:
```bash
cd backend
npm install
```

## Opção 2: Usar alternativa sem compilação nativa

### Substituir por sql.js (SQLite puro JavaScript)

1. Edite `backend/package.json`:

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "sql.js": "^1.8.0",    // ← Trocar por este
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "dotenv": "^16.3.1"
  }
}
```

2. Adapte `backend/database/database.js` para usar sql.js

## Opção 3: Usar Docker

Crie um `Dockerfile` na raiz do projeto:

```dockerfile
FROM node:18-alpine

WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./

EXPOSE 3000 5173
CMD ["npm", "start"]
```

## Verificar se funcionou

```bash
cd backend
npm run init-db
```

Se aparecer "✅ Banco de dados inicializado com sucesso!", está tudo certo!

---

**O código está 100% completo, apenas aguardando a instalação correta das dependências.**
