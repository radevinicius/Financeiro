import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { getOne, run } from '../database/database.js';

const router = express.Router();

/**
 * GET /api/preferencias
 * Buscar preferências do usuário logado
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        let preferencias = await getOne(
            'SELECT * FROM preferencias_usuario WHERE usuario_id = $1',
            [req.user.id]
        );

        // Se não existir, criar com valores padrão
        if (!preferencias) {
            await run(
                `INSERT INTO preferencias_usuario (usuario_id, tema, alertas_email, alertas_push, idioma)
                 VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                [req.user.id, 'light', true, true, 'pt-BR']
            );

            preferencias = await getOne(
                'SELECT * FROM preferencias_usuario WHERE usuario_id = $1',
                [req.user.id]
            );
        }

        res.json({ preferencias });
    } catch (error) {
        console.error('Erro ao buscar preferências:', error);
        res.status(500).json({ error: 'Erro ao buscar preferências' });
    }
});

/**
 * PUT /api/preferencias
 * Atualizar preferências do usuário
 */
router.put('/', authenticateToken, async (req, res) => {
    try {
        const { tema, alertas_email, alertas_push, idioma } = req.body;

        // Verificar se preferências existem
        const existentes = await getOne(
            'SELECT id FROM preferencias_usuario WHERE usuario_id = $1',
            [req.user.id]
        );

        if (!existentes) {
            // Criar se não existir
            await run(
                `INSERT INTO preferencias_usuario (usuario_id, tema, alertas_email, alertas_push, idioma)
                 VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                [req.user.id, tema || 'light', alertas_email !== undefined ? alertas_email : true, alertas_push !== undefined ? alertas_push : true, idioma || 'pt-BR']
            );
        } else {
            // Atualizar
            const updates = [];
            const values = [];
            let paramIndex = 1;

            if (tema) {
                updates.push(`tema = $${paramIndex++}`);
                values.push(tema);
            }
            if (alertas_email !== undefined) {
                updates.push(`alertas_email = $${paramIndex++}`);
                values.push(alertas_email);
            }
            if (alertas_push !== undefined) {
                updates.push(`alertas_push = $${paramIndex++}`);
                values.push(alertas_push);
            }
            if (idioma) {
                updates.push(`idioma = $${paramIndex++}`);
                values.push(idioma);
            }

            if (updates.length > 0) {
                values.push(req.user.id);
                await run(
                    `UPDATE preferencias_usuario SET ${updates.join(', ')} WHERE usuario_id = $${paramIndex}`,
                    values
                );
            }
        }

        const preferencias = await getOne(
            'SELECT * FROM preferencias_usuario WHERE usuario_id = $1',
            [req.user.id]
        );

        res.json({
            message: 'Preferências atualizadas com sucesso',
            preferencias
        });
    } catch (error) {
        console.error('Erro ao atualizar preferências:', error);
        res.status(500).json({ error: 'Erro ao atualizar preferências' });
    }
});

export default router;
