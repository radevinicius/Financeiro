import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { query, getOne } from '../database/database.js';

const router = express.Router();

// Middleware para verificar se é admin
const isAdmin = (req, res, next) => {
    if (req.user && req.user.tipo === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
    }
};

/**
 * GET /api/admin/dashboard
 * Estatísticas gerais do sistema
 */
router.get('/dashboard', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [usersCount, despesasCount, receitasCount] = await Promise.all([
            getOne('SELECT COUNT(*) as total FROM usuarios'),
            getOne('SELECT COUNT(*) as total FROM despesas'),
            getOne('SELECT COUNT(*) as total FROM receitas')
        ]);

        const [totalDespesas, totalReceitas] = await Promise.all([
            getOne('SELECT SUM(valor) as total FROM despesas'),
            getOne('SELECT SUM(valor) as total FROM receitas')
        ]);

        res.json({
            users: usersCount.total,
            transactions: despesasCount.total + receitasCount.total,
            volume: (totalDespesas.total || 0) + (totalReceitas.total || 0),
            details: {
                despesas: totalDespesas.total || 0,
                receitas: totalReceitas.total || 0
            }
        });
    } catch (error) {
        console.error('Erro no dashboard admin:', error);
        res.status(500).json({ error: 'Erro ao carregar dashboard admin' });
    }
});

/**
 * GET /api/admin/usuarios
 * Lista de usuários
 */
router.get('/usuarios', authenticateToken, isAdmin, async (req, res) => {
    try {
        const usuarios = await query(`
            SELECT id, nome, email, tipo, created_at,
            (SELECT COUNT(*) FROM despesas WHERE usuario_id = usuarios.id) as despesas_count,
            (SELECT COUNT(*) FROM receitas WHERE usuario_id = usuarios.id) as receitas_count
            FROM usuarios
            ORDER BY created_at DESC
        `);
        res.json({ usuarios });
    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        res.status(500).json({ error: 'Erro ao listar usuários' });
    }
});

export default router;
