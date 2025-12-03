import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware.js';
import { query, getOne, run } from '../database/database.js';

const router = express.Router();

/**
 * GET /api/despesas
 * Listar despesas (com filtros)
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { dataInicio, dataFim, categoriaId, usuarioId } = req.query;

        let sql = `
      SELECT d.*, c.nome as categoria_nome, c.icone as categoria_icone, c.cor as categoria_cor,
             u.nome as usuario_nome
      FROM despesas d
      LEFT JOIN categorias c ON d.categoria_id = c.id
      LEFT JOIN usuarios u ON d.usuario_id = u.id
      WHERE 1=1
    `;

        const params = [];
        let paramIndex = 1;

        // Admin pode ver de todos, usuário normal só vê suas próprias
        if (req.user.tipo === 'admin') {
            if (usuarioId) {
                sql += ` AND d.usuario_id = $${paramIndex++}`;
                params.push(usuarioId);
            }
        } else {
            sql += ` AND d.usuario_id = $${paramIndex++}`;
            params.push(req.user.id);
        }

        if (dataInicio) {
            sql += ` AND d.data >= $${paramIndex++}`;
            params.push(dataInicio);
        }

        if (dataFim) {
            sql += ` AND d.data <= $${paramIndex++}`;
            params.push(dataFim);
        }

        if (categoriaId) {
            sql += ` AND d.categoria_id = $${paramIndex++}`;
            params.push(categoriaId);
        }

        sql += ' ORDER BY d.data DESC, d.created_at DESC';

        const despesas = await query(sql, params);

        res.json({ despesas });
    } catch (error) {
        console.error('Erro ao listar despesas:', error);
        res.status(500).json({ error: 'Erro ao listar despesas' });
    }
});

/**
 * GET /api/despesas/:id
 * Buscar despesa específica
 */
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const despesa = await getOne(`
      SELECT d.*, c.nome as categoria_nome, c.icone as categoria_icone
      FROM despesas d
      LEFT JOIN categorias c ON d.categoria_id = c.id
      WHERE d.id = $1
    `, [id]);

        if (!despesa) {
            return res.status(404).json({ error: 'Despesa não encontrada' });
        }

        // Verificar permissão
        if (req.user.tipo !== 'admin' && despesa.usuario_id !== req.user.id) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        res.json({ despesa });
    } catch (error) {
        console.error('Erro ao buscar despesa:', error);
        res.status(500).json({ error: 'Erro ao buscar despesa' });
    }
});

/**
 * POST /api/despesas
 * Criar nova despesa
 */
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { categoria_id, valor, data, descricao, origem } = req.body;

        //  Validações
        if (!categoria_id || !valor || !data) {
            return res.status(400).json({ error: 'Categoria, valor e data são obrigatórios' });
        }

        // Verificar se categoria existe e pertence ao usuário
        const categoria = await getOne(
            'SELECT id FROM categorias WHERE id = $1 AND usuario_id = $2 AND tipo = $3',
            [categoria_id, req.user.id, 'despesa']
        );

        if (!categoria) {
            return res.status(400).json({ error: 'Categoria inválida' });
        }

        const result = await run(
            `INSERT INTO despesas (usuario_id, categoria_id, valor, data, descricao, origem)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [req.user.id, categoria_id, valor, data, descricao || null, origem || 'manual']
        );

        res.status(201).json({
            message: 'Despesa criada com sucesso',
            despesaId: result.lastInsertRowid
        });
    } catch (error) {
        console.error('Erro ao criar despesa:', error);
        res.status(500).json({ error: 'Erro ao criar despesa' });
    }
});

/**
 * PUT /api/despesas/:id
 * Atualizar despesa
 */
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { categoria_id, valor, data, descricao } = req.body;

        // Verificar se despesa pertence ao usuário (ou se é admin)
        const despesa = await getOne('SELECT usuario_id FROM despesas WHERE id = $1', [id]);

        if (!despesa) {
            return res.status(404).json({ error: 'Despesa não encontrada' });
        }

        if (req.user.tipo !== 'admin' && despesa.usuario_id !== req.user.id) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (categoria_id) {
            updates.push(`categoria_id = $${paramIndex++}`);
            values.push(categoria_id);
        }
        if (valor) {
            updates.push(`valor = $${paramIndex++}`);
            values.push(valor);
        }
        if (data) {
            updates.push(`data = $${paramIndex++}`);
            values.push(data);
        }
        if (descricao !== undefined) {
            updates.push(`descricao = $${paramIndex++}`);
            values.push(descricao);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'Nenhum campo para atualizar' });
        }

        values.push(id);

        await run(`UPDATE despesas SET ${updates.join(', ')} WHERE id = $${paramIndex}`, values);

        res.json({ message: 'Despesa atualizada com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar despesa:', error);
        res.status(500).json({ error: 'Erro ao atualizar despesa' });
    }
});

/**
 * DELETE /api/despesas/:id
 * Deletar despesa
 */
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar se despesa pertence ao usuário (ou se é admin)
        const despesa = await getOne('SELECT usuario_id FROM despesas WHERE id = $1', [id]);

        if (!despesa) {
            return res.status(404).json({ error: 'Despesa não encontrada' });
        }

        if (req.user.tipo !== 'admin' && despesa.usuario_id !== req.user.id) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        await run('DELETE FROM despesas WHERE id = $1', [id]);

        res.json({ message: 'Despesa deletada com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar despesa:', error);
        res.status(500).json({ error: 'Erro ao deletar despesa' });
    }
});

export default router;
