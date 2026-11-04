import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { query, pool } from '../database/database.js';

const router = express.Router();

// Middleware para verificar se é admin
const isAdmin = (req, res, next) => {
    if (req.user && req.user.tipo === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
    }
};

// Whitelist de tabelas e colunas permitidas para evitar SQL Injection
const ALLOWED_TABLES_COLUMNS = {
    usuarios: ['id', 'nome', 'email', 'telefone', 'senha_hash', 'tipo', 'created_at'],
    categorias: ['id', 'nome', 'tipo', 'usuario_id', 'icone', 'cor', 'created_at'],
    despesas: ['id', 'usuario_id', 'categoria_id', 'valor', 'data', 'descricao', 'origem', 'created_at'],
    receitas: ['id', 'usuario_id', 'categoria_id', 'valor', 'data', 'descricao', 'origem', 'created_at'],
    metas: ['id', 'usuario_id', 'tipo', 'categoria_id', 'valor_meta', 'periodo', 'ativo', 'created_at'],
    preferencias_usuario: ['id', 'usuario_id', 'tema', 'alertas_email', 'alertas_push', 'idioma', 'created_at'],
    despesas_fixas: ['id', 'usuario_id', 'nome', 'valor', 'dia_vencimento', 'categoria_id', 'descricao', 'ativo', 'created_at']
};

/**
 * GET /api/backup/exportar
 * Exportar banco de dados como JSON
 */
router.get('/exportar', authenticateToken, isAdmin, async (req, res) => {
    try {
        const tables = Object.keys(ALLOWED_TABLES_COLUMNS);
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
 * Importar banco de dados de JSON usando transação segura
 */
router.post('/importar', authenticateToken, isAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
        const backup = req.body;

        if (!backup || typeof backup !== 'object') {
            return res.status(400).json({ error: 'Formato de backup inválido' });
        }

        const tables = Object.keys(ALLOWED_TABLES_COLUMNS);

        await client.query('BEGIN');

        // Limpar tabelas existentes (ordem inversa para respeitar FKs)
        for (const table of [...tables].reverse()) {
            await client.query(`DELETE FROM ${table}`);
        }

        // Importar dados validando colunas na whitelist
        for (const table of tables) {
            const allowedCols = new Set(ALLOWED_TABLES_COLUMNS[table]);
            if (backup[table] && Array.isArray(backup[table])) {
                for (const row of backup[table]) {
                    const keys = Object.keys(row).filter(k => allowedCols.has(k));
                    if (keys.length === 0) continue;

                    const values = keys.map(k => row[k]);
                    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

                    await client.query(
                        `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`,
                        values
                    );
                }
            }
        }

        await client.query('COMMIT');
        res.json({ message: 'Backup importado com sucesso' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro ao importar backup:', error);
        res.status(500).json({ error: 'Erro ao importar backup' });
    } finally {
        client.release();
    }
});

export default router;
