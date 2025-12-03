import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { query, run } from '../database/database.js';
import fs from 'fs';
import path from 'path';

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
 * GET /api/backup/exportar
 * Exportar banco de dados como JSON
 */
router.get('/exportar', authenticateToken, isAdmin, async (req, res) => {
    try {
        const tables = ['usuarios', 'categorias', 'despesas', 'receitas', 'metas', 'preferencias_usuario'];
        const backup = {};

        for (const table of tables) {
            backup[table] = await query(`SELECT * FROM ${table}`);
        }

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=backup-${new Date().toISOString().split('T')[0]}.json`);
        res.json(backup);
    } catch (error) {
        console.error('Erro ao exportar backup:', error);
        res.status(500).json({ error: 'Erro ao exportar backup' });
    }
});

/**
 * POST /api/backup/importar
 * Importar banco de dados de JSON
 */
router.post('/importar', authenticateToken, isAdmin, async (req, res) => {
    try {
        const backup = req.body;

        if (!backup || typeof backup !== 'object') {
            return res.status(400).json({ error: 'Formato de backup inválido' });
        }

        // Ordem de importação para respeitar chaves estrangeiras
        const tables = ['usuarios', 'categorias', 'despesas', 'receitas', 'metas', 'preferencias_usuario'];

        // Limpar tabelas existentes (ordem inversa)
        for (const table of [...tables].reverse()) {
            await run(`DELETE FROM ${table}`);
        }

        // Importar dados
        for (const table of tables) {
            if (backup[table] && Array.isArray(backup[table])) {
                for (const row of backup[table]) {
                    const keys = Object.keys(row);
                    const values = Object.values(row);
                    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

                    await run(
                        `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`,
                        values
                    );
                }
            }
        }

        res.json({ message: 'Backup importado com sucesso' });
    } catch (error) {
        console.error('Erro ao importar backup:', error);
        res.status(500).json({ error: 'Erro ao importar backup' });
    }
});

export default router;
