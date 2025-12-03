import express from 'express';
import { parseFinancialText } from '../services/nlp.service.js';
import { run, getOne, query } from '../database/database.js';

const router = express.Router();

/**
 * POST /webhook/n8n/despesa
 * Webhook para criar despesa via n8n (áudio → texto)
 * 
 * Body esperado:
 * {
 *   "usuario_id": 1,
 *   "texto": "gastei 50 reais com gasolina hoje"
 * }
 */
router.post('/n8n/despesa', async (req, res) => {
    try {
        const { usuario_id, texto } = req.body;

        if (!usuario_id || !texto) {
            return res.status(400).json({
                error: 'usuario_id e texto são obrigatórios',
                exemplo: {
                    usuario_id: 1,
                    texto: 'gastei 50 reais com gasolina hoje'
                }
            });
        }

        // Processar texto com NLP
        const parsed = parseFinancialText(texto);

        if (!parsed.sucesso) {
            return res.status(400).json({
                error: 'Não foi possível extrair informações do texto',
                texto_recebido: texto,
                parsed
            });
        }

        // Encontrar categoria por nome sugerido
        const categoria = await getOne(`
      SELECT id FROM categorias 
      WHERE usuario_id = $1
      AND tipo = 'despesa'
      AND LOWER(nome) LIKE $2
      LIMIT 1
    `, [usuario_id, `%${parsed.categoriaSugerida}%`]);

        // Se não encontrar, usar categoria "Outros"
        let categoriaId = categoria?.id;
        if (!categoriaId) {
            const outros = await getOne(`
        SELECT id FROM categorias 
        WHERE usuario_id = $1 AND tipo = 'despesa' AND nome = 'Outros'
      `, [usuario_id]);
            categoriaId = outros?.id;
        }

        if (!categoriaId) {
            return res.status(400).json({
                error: 'Nenhuma categoria de despesa encontrada para este usuário. Crie categorias primeiro.'
            });
        }

        // Criar despesa
        const result = await run(`
      INSERT INTO despesas (usuario_id, categoria_id, valor, data, descricao, origem)
      VALUES ($1, $2, $3, $4, $5, 'whatsapp') RETURNING id
    `, [usuario_id, categoriaId, parsed.valor, parsed.data, texto]);

        res.status(201).json({
            message: 'Despesa criada com sucesso via webhook',
            despesaId: result.lastInsertRowid,
            dados_extraidos: {
                valor: parsed.valor,
                data: parsed.data,
                categoria_sugerida: parsed.categoriaSugerida,
                categoria_id: categoriaId
            }
        });

    } catch (error) {
        console.error('Erro no webhook de despesa:', error);
        res.status(500).json({ error: 'Erro ao processar webhook' });
    }
});

/**
 * POST /webhook/n8n/receita
 * Webhook para criar receita via n8n (áudio → texto)
 * 
 * Body esperado:
 * {
 *   "usuario_id": 1,
 *   "texto": "recebi 400 de freela hoje"
 * }
 */
router.post('/n8n/receita', async (req, res) => {
    try {
        const { usuario_id, texto } = req.body;

        if (!usuario_id || !texto) {
            return res.status(400).json({
                error: 'usuario_id e texto são obrigatórios',
                exemplo: {
                    usuario_id: 1,
                    texto: 'recebi 400 de freela hoje'
                }
            });
        }

        // Processar texto com NLP
        const parsed = parseFinancialText(texto);

        if (!parsed.sucesso) {
            return res.status(400).json({
                error: 'Não foi possível extrair informações do texto',
                texto_recebido: texto,
                parsed
            });
        }

        // Encontrar categoria por nome sugerido
        const categoria = await getOne(`
      SELECT id FROM categorias 
      WHERE usuario_id = $1
      AND tipo = 'receita'
      AND LOWER(nome) LIKE $2
      LIMIT 1
    `, [usuario_id, `%${parsed.categoriaSugerida}%`]);

        // Se não encontrar, usar categoria "Outros"
        let categoriaId = categoria?.id;
        if (!categoriaId) {
            const outros = await getOne(`
        SELECT id FROM categorias 
        WHERE usuario_id = $1 AND tipo = 'receita' AND nome = 'Outros'
      `, [usuario_id]);
            categoriaId = outros?.id;
        }

        if (!categoriaId) {
            return res.status(400).json({
                error: 'Nenhuma categoria de receita encontrada para este usuário. Crie categorias primeiro.'
            });
        }

        // Criar receita
        const result = await run(`
      INSERT INTO receitas (usuario_id, categoria_id, valor, data, descricao, origem)
      VALUES ($1, $2, $3, $4, $5, 'whatsapp') RETURNING id
    `, [usuario_id, categoriaId, parsed.valor, parsed.data, texto]);

        res.status(201).json({
            message: 'Receita criada com sucesso via webhook',
            receitaId: result.lastInsertRowid,
            dados_extraidos: {
                valor: parsed.valor,
                data: parsed.data,
                categoria_sugerida: parsed.categoriaSugerida,
                categoria_id: categoriaId
            }
        });

    } catch (error) {
        console.error('Erro no webhook de receita:', error);
        res.status(500).json({ error: 'Erro ao processar webhook' });
    }
});

export default router;
