import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { query, getOne, run } from '../database/database.js';

const router = express.Router();

/**
 * GET /api/metas
 * Listar metas do usuário
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const metas = await query(
            `SELECT m.*, c.nome as categoria_nome, c.icone as categoria_icone
             FROM metas m
             LEFT JOIN categorias c ON m.categoria_id = c.id
             WHERE m.usuario_id = $1 AND m.ativo = 1
             ORDER BY m.created_at DESC`,
            [req.user.id]
        );

        res.json({ metas });
    } catch (error) {
        console.error('Erro ao listar metas:', error);
        res.status(500).json({ error: 'Erro ao listar metas' });
    }
});

/**
 * POST /api/metas
 * Criar nova meta
 */
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { tipo, categoria_id, valor_meta, periodo } = req.body;

        if (!tipo || !valor_meta || !periodo) {
            return res.status(400).json({ error: 'Tipo, valor_meta e período são obrigatórios' });
        }

        const result = await run(
            `INSERT INTO metas (usuario_id, tipo, categoria_id, valor_meta, periodo)
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [req.user.id, tipo, categoria_id || null, valor_meta, periodo]
        );

        res.status(201).json({
            message: 'Meta criada com sucesso',
            metaId: result.lastInsertRowid
        });
    } catch (error) {
        console.error('Erro ao criar meta:', error);
        res.status(500).json({ error: 'Erro ao criar meta' });
    }
});

/**
 * GET /api/metas/progresso
 * Calcular progresso das metas
 */
router.get('/progresso', authenticateToken, async (req, res) => {
    try {
        const metas = await query(
            'SELECT * FROM metas WHERE usuario_id = $1 AND ativo = 1',
            [req.user.id]
        );

        const hoje = new Date();
        const mes = hoje.getMonth() + 1;
        const ano = hoje.getFullYear();

        const progresso = await Promise.all(metas.map(async (meta) => {
            let valorAtual = 0;

            if (meta.tipo === 'economia') {
                // Calcular receitas - despesas no período (PostgreSQL)
                const [receitas, despesas] = await Promise.all([
                    query(`SELECT SUM(valor) as total FROM receitas 
                           WHERE usuario_id = $1 
                           AND EXTRACT(MONTH FROM data) = $2 
                           AND EXTRACT(YEAR FROM data) = $3`,
                        [req.user.id, mes, ano]),
                    query(`SELECT SUM(valor) as total FROM despesas 
                           WHERE usuario_id = $1 
                           AND EXTRACT(MONTH FROM data) = $2 
                           AND EXTRACT(YEAR FROM data) = $3`,
                        [req.user.id, mes, ano])
                ]);
                valorAtual = (receitas[0]?.total || 0) - (despesas[0]?.total || 0);
            } else if (meta.tipo === 'limite_categoria' && meta.categoria_id) {
                // Calcular despesas da categoria no período
                const result = await query(
                    `SELECT SUM(valor) as total FROM despesas 
                     WHERE usuario_id = $1 
                     AND categoria_id = $2 
                     AND EXTRACT(MONTH FROM data) = $3 
                     AND EXTRACT(YEAR FROM data) = $4`,
                    [req.user.id, meta.categoria_id, mes, ano]
                );
                valorAtual = result[0]?.total || 0;
            } else if (meta.tipo === 'limite_total') {
                // Calcular total de despesas no período
                const result = await query(
                    `SELECT SUM(valor) as total FROM despesas 
                     WHERE usuario_id = $1 
                     AND EXTRACT(MONTH FROM data) = $2 
                     AND EXTRACT(YEAR FROM data) = $3`,
                    [req.user.id, mes, ano]
                );
                valorAtual = result[0]?.total || 0;
            }

            return {
                ...meta,
                valor_atual: valorAtual,
                percentual: (valorAtual / meta.valor_meta) * 100
            };
        }));

        res.json({ progresso });
    } catch (error) {
        console.error('Erro ao calcular progresso:', error);
        res.status(500).json({ error: 'Erro ao calcular progresso' });
    }
});

/**
 * DELETE /api/metas/:id
 * Deletar meta (soft delete)
 */
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const meta = await getOne(
            'SELECT id FROM metas WHERE id = $1 AND usuario_id = $2',
            [id, req.user.id]
        );

        if (!meta) {
            return res.status(404).json({ error: 'Meta não encontrada' });
        }

        await run('UPDATE metas SET ativo = 0 WHERE id = $1', [id]);

        res.json({ message: 'Meta deletada com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar meta:', error);
        res.status(500).json({ error: 'Erro ao deletar meta' });
    }
});

export default router;
