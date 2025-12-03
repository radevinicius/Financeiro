import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { query, getOne, run } from '../database/database.js';

const router = express.Router();

/**
 * GET /api/categorias
 * Listar categorias do usuário
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { tipo } = req.query; // Filtrar por tipo (receita/despesa)

        let sql = `
      SELECT id, nome, tipo, icone, cor, created_at
      FROM categorias
      WHERE usuario_id = $1
    `;

        const params = [req.user.id];

        if (tipo) {
            sql += ' AND tipo = $2';
            params.push(tipo);
        }

        sql += ' ORDER BY nome ASC';

        const categorias = await query(sql, params);

        res.json({ categorias });
    } catch (error) {
        console.error('Erro ao listar categorias:', error);
        res.status(500).json({ error: 'Erro ao listar categorias' });
    }
});

/**
 * POST /api/categorias
 * Criar nova categoria
 */
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { nome, tipo, icone, cor } = req.body;

        // Validações
        if (!nome || !tipo) {
            return res.status(400).json({ error: 'Nome e tipo são obrigatórios' });
        }

        if (!['receita', 'despesa'].includes(tipo)) {
            return res.status(400).json({ error: 'Tipo deve ser "receita" ou "despesa"' });
        }

        // Debug logs
        console.log('Criando categoria:', { nome, tipo, usuario_id: req.user?.id, icone, cor });
        console.log('req.user:', req.user);

        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: 'Usuário não autenticado' });
        }

        const result = await run(
            `INSERT INTO categorias (nome, tipo, usuario_id, icone, cor)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [nome, tipo, req.user.id, icone || '📊', cor || '#007AFF']
        );

        res.status(201).json({
            message: 'Categoria criada com sucesso',
            categoriaId: result.lastInsertRowid
        });
    } catch (error) {
        console.error('Erro ao criar categoria:', error);
        res.status(500).json({ error: 'Erro ao criar categoria' });
    }
});

/**
 * PUT /api/categorias/:id
 * Atualizar categoria
 */
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, icone, cor } = req.body;

        // Verificar se categoria pertence ao usuário
        const categoria = await getOne(
            'SELECT id FROM categorias WHERE id = $1 AND usuario_id = $2',
            [id, req.user.id]
        );

        if (!categoria) {
            return res.status(404).json({ error: 'Categoria não encontrada' });
        }

        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (nome) {
            updates.push(`nome = $${paramIndex++}`);
            values.push(nome);
        }
        if (icone) {
            updates.push(`icone = $${paramIndex++}`);
            values.push(icone);
        }
        if (cor) {
            updates.push(`cor = $${paramIndex++}`);
            values.push(cor);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'Nenhum campo para atualizar' });
        }

        values.push(id);

        await run(`UPDATE categorias SET ${updates.join(', ')} WHERE id = $${paramIndex}`, values);

        res.json({ message: 'Categoria atualizada com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar categoria:', error);
        res.status(500).json({ error: 'Erro ao atualizar categoria' });
    }
});

/**
 * DELETE /api/categorias/:id
 * Deletar categoria
 */
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar se categoria pertence ao usuário
        const categoria = await getOne(
            'SELECT id FROM categorias WHERE id = $1 AND usuario_id = $2',
            [id, req.user.id]
        );

        if (!categoria) {
            return res.status(404).json({ error: 'Categoria não encontrada' });
        }

        await run('DELETE FROM categorias WHERE id = $1', [id]);

        res.json({ message: 'Categoria deletada com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar categoria:', error);
        res.status(500).json({ error: 'Erro ao deletar categoria' });
    }
});

export default router;
