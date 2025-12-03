import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware.js';
import { query, getOne, run } from '../database/database.js';

const router = express.Router();

/**
 * GET /api/usuarios
 * Listar todos os usuários (admin only)
 */
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const usuarios = await query(`
      SELECT id, nome, email, telefone, tipo, created_at
      FROM usuarios
      ORDER BY created_at DESC
    `);

        res.json({ usuarios });
    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        res.status(500).json({ error: 'Erro ao listar usuários' });
    }
});

/**
 * GET /api/usuarios/:id
 * Buscar usuário específico
 */
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Usuário só pode ver seus próprios dados, exceto admin
        if (req.user.tipo !== 'admin' && req.user.id !== parseInt(id)) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const usuario = await getOne(`
      SELECT id, nome, email, telefone, tipo, created_at
      FROM usuarios
      WHERE id = $1
    `, [id]);

        if (!usuario) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        res.json({ usuario });
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        res.status(500).json({ error: 'Erro ao buscar usuário' });
    }
});

/**
 * PUT /api/usuarios/:id
 * Atualizar usuário
 */
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, telefone } = req.body;

        // Usuário só pode editar seus próprios dados, exceto admin
        if (req.user.tipo !== 'admin' && req.user.id !== parseInt(id)) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (nome) {
            updates.push(`nome = $${paramIndex++}`);
            values.push(nome);
        }
        if (telefone !== undefined) {
            updates.push(`telefone = $${paramIndex++}`);
            values.push(telefone);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'Nenhum campo para atualizar' });
        }

        values.push(id);

        await run(`UPDATE usuarios SET ${updates.join(', ')} WHERE id = $${paramIndex}`, values);

        res.json({ message: 'Usuário atualizado com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        res.status(500).json({ error: 'Erro ao atualizar usuário' });
    }
});

/**
 * DELETE /api/usuarios/:id
 * Deletar usuário (admin only)
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        await run('DELETE FROM usuarios WHERE id = $1', [id]);

        res.json({ message: 'Usuário deletado com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar usuário:', error);
        res.status(500).json({ error: 'Erro ao deletar usuário' });
    }
});

export default router;
