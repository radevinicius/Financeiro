import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { query, getOne, run } from '../database/database.js';

const router = express.Router();

/**
 * GET /api/despesas-fixas
 * Listar todas as despesas fixas do usuário
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const sql = `
            SELECT df.*, c.nome as categoria_nome, c.icone as categoria_icone, c.cor as categoria_cor
            FROM despesas_fixas df
            LEFT JOIN categorias c ON df.categoria_id = c.id
            WHERE df.usuario_id = $1 AND df.ativo = true
            ORDER BY df.dia_vencimento ASC, df.nome ASC
        `;

        const despesasFixas = await query(sql, [req.user.id]);

        res.json({ despesasFixas });
    } catch (error) {
        console.error('Erro ao listar despesas fixas:', error);
        res.status(500).json({ error: 'Erro ao listar despesas fixas' });
    }
});

/**
 * GET /api/despesas-fixas/total
 * Obter total de despesas fixas mensais
 */
router.get('/total', authenticateToken, async (req, res) => {
    try {
        const result = await getOne(
            'SELECT COALESCE(SUM(valor), 0) as total FROM despesas_fixas WHERE usuario_id = $1 AND ativo = true',
            [req.user.id]
        );

        // Garantir que total nunca seja null
        const total = result?.total ?? 0;
        res.json({ total: parseFloat(total) || 0 });
    } catch (error) {
        console.error('Erro ao calcular total:', error);
        res.status(500).json({ error: 'Erro ao calcular total' });
    }
});

/**
 * POST /api/despesas-fixas
 * Criar nova despesa fixa
 */
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { nome, valor, dia_vencimento, categoria_id, descricao } = req.body;

        // Validações
        if (!nome || !valor) {
            return res.status(400).json({ error: 'Nome e valor são obrigatórios' });
        }

        if (dia_vencimento && (dia_vencimento < 1 || dia_vencimento > 31)) {
            return res.status(400).json({ error: 'Dia de vencimento deve estar entre 1 e 31' });
        }

        // Verificar se categoria existe e pertence ao usuário (se fornecida)
        if (categoria_id) {
            const categoria = await getOne(
                'SELECT id FROM categorias WHERE id = $1 AND usuario_id = $2 AND tipo = $3',
                [categoria_id, req.user.id, 'despesa']
            );

            if (!categoria) {
                return res.status(400).json({ error: 'Categoria inválida' });
            }
        }

        const result = await run(
            `INSERT INTO despesas_fixas (usuario_id, nome, valor, dia_vencimento, categoria_id, descricao)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [req.user.id, nome, valor, dia_vencimento || null, categoria_id || null, descricao || null]
        );

        res.status(201).json({
            message: 'Despesa fixa criada com sucesso',
            despesaFixaId: result.lastInsertRowid
        });
    } catch (error) {
        console.error('Erro ao criar despesa fixa:', error);
        res.status(500).json({ error: 'Erro ao criar despesa fixa' });
    }
});

/**
 * PUT /api/despesas-fixas/:id
 * Atualizar despesa fixa
 */
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, valor, dia_vencimento, categoria_id, descricao } = req.body;

        // Verificar se despesa fixa pertence ao usuário
        const despesaFixa = await getOne(
            'SELECT usuario_id FROM despesas_fixas WHERE id = $1',
            [id]
        );

        if (!despesaFixa) {
            return res.status(404).json({ error: 'Despesa fixa não encontrada' });
        }

        if (despesaFixa.usuario_id !== req.user.id) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        // Validar dia de vencimento
        if (dia_vencimento !== undefined && dia_vencimento !== null && (dia_vencimento < 1 || dia_vencimento > 31)) {
            return res.status(400).json({ error: 'Dia de vencimento deve estar entre 1 e 31' });
        }

        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (nome !== undefined) {
            updates.push(`nome = $${paramIndex++}`);
            values.push(nome);
        }
        if (valor !== undefined) {
            updates.push(`valor = $${paramIndex++}`);
            values.push(valor);
        }
        if (dia_vencimento !== undefined) {
            updates.push(`dia_vencimento = $${paramIndex++}`);
            values.push(dia_vencimento);
        }
        if (categoria_id !== undefined) {
            updates.push(`categoria_id = $${paramIndex++}`);
            values.push(categoria_id);
        }
        if (descricao !== undefined) {
            updates.push(`descricao = $${paramIndex++}`);
            values.push(descricao);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'Nenhum campo para atualizar' });
        }

        values.push(id);

        await run(`UPDATE despesas_fixas SET ${updates.join(', ')} WHERE id = $${paramIndex}`, values);

        res.json({ message: 'Despesa fixa atualizada com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar despesa fixa:', error);
        res.status(500).json({ error: 'Erro ao atualizar despesa fixa' });
    }
});

/**
 * DELETE /api/despesas-fixas/:id
 * Deletar despesa fixa (soft delete)
 */
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar se despesa fixa pertence ao usuário
        const despesaFixa = await getOne(
            'SELECT usuario_id FROM despesas_fixas WHERE id = $1',
            [id]
        );

        if (!despesaFixa) {
            return res.status(404).json({ error: 'Despesa fixa não encontrada' });
        }

        if (despesaFixa.usuario_id !== req.user.id) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        // Soft delete
        await run('UPDATE despesas_fixas SET ativo = false WHERE id = $1', [id]);

        res.json({ message: 'Despesa fixa deletada com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar despesa fixa:', error);
        res.status(500).json({ error: 'Erro ao deletar despesa fixa' });
    }
});

export default router;
