import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './database/database.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import usuariosRoutes from './routes/usuarios.routes.js';
import categoriasRoutes from './routes/categorias.routes.js';
import despesasRoutes from './routes/despesas.routes.js';
import receitasRoutes from './routes/receitas.routes.js';
import webhookRoutes from './routes/webhook.routes.js';
import preferenciasRoutes from './routes/preferencias.routes.js';
import metasRoutes from './routes/metas.routes.js';
import relatoriosRoutes from './routes/relatorios.routes.js';
import adminRoutes from './routes/admin.routes.js';
import backupRoutes from './routes/backup.routes.js';
import anexosRoutes from './routes/anexos.routes.js';
import despesasFixasRoutes from './routes/despesas-fixas.routes.js';

// Carregar variáveis de ambiente
dotenv.config();

// Criar app Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log de requisições (desenvolvimento)
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
        next();
    });
}

// Health check
app.get('/', (req, res) => {
    res.json({
        message: '💰 API Financeiro iOS - Online',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/despesas', despesasRoutes);
app.use('/api/receitas', receitasRoutes);
app.use('/api/preferencias', preferenciasRoutes);
app.use('/api/metas', metasRoutes);
app.use('/api/relatorios', relatoriosRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/anexos', anexosRoutes);
app.use('/api/despesas-fixas', despesasFixasRoutes);
app.use('/webhook', webhookRoutes);

// Rota para estatísticas do dashboard
app.get('/api/dashboard/stats', async (req, res) => {
    // Esta rota será implementada se necessário
    res.json({ message: 'Dashboard stats - em desenvolvimento' });
});

// Tratamento de erro 404
app.use((req, res) => {
    res.status(404).json({ error: 'Rota não encontrada' });
});

// Tratamento de erros global
app.use((error, req, res, next) => {
    console.error('Erro não tratado:', error);
    res.status(500).json({
        error: 'Erro interno do servidor',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
});

// Iniciar servidor com inicialização assíncrona do banco
async function startServer() {
    try {
        // Inicializar banco de dados
        await initDatabase();

        // Iniciar servidor
        app.listen(PORT, () => {
            console.log(`\n🚀 Servidor rodando na porta ${PORT}`);
            console.log(`📡 API: http://localhost:${PORT}`);
            console.log(`🏥 Health: http://localhost:${PORT}/\n`);
        });
    } catch (error) {
        console.error('❌ Erro ao iniciar servidor:', error);
        process.exit(1);
    }
}

startServer();

export default app;
