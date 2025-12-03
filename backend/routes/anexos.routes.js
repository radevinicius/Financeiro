import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { run, getOne, query } from '../database/database.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configuração do Multer para upload de arquivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|pdf/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Apenas imagens e PDFs são permitidos!'));
    }
});

/**
 * POST /api/anexos
 * Upload de anexo
 */
router.post('/', authenticateToken, upload.single('arquivo'), async (req, res) => {
    try {
        const { transacao_tipo, transacao_id } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'Nenhum arquivo enviado' });
        }

        const result = await run(
            `INSERT INTO anexos (transacao_tipo, transacao_id, nome_arquivo, caminho_arquivo, tamanho, mime_type)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [transacao_tipo, transacao_id, file.originalname, file.path, file.size, file.mimetype]
        );

        res.status(201).json({
            message: 'Anexo salvo com sucesso',
            anexoId: result.lastInsertRowid,
            file: file
        });
    } catch (error) {
        console.error('Erro ao salvar anexo:', error);
        res.status(500).json({ error: 'Erro ao salvar anexo' });
    }
});

/**
 * GET /api/anexos/:tipo/:id
 * Listar anexos de uma transação
 */
router.get('/:tipo/:id', authenticateToken, async (req, res) => {
    try {
        const { tipo, id } = req.params;
        const anexos = await query(
            'SELECT * FROM anexos WHERE transacao_tipo = $1 AND transacao_id = $2',
            [tipo, id]
        );
        res.json({ anexos });
    } catch (error) {
        console.error('Erro ao listar anexos:', error);
        res.status(500).json({ error: 'Erro ao listar anexos' });
    }
});

/**
 * DELETE /api/anexos/:id
 * Deletar anexo
 */
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const anexo = await getOne('SELECT * FROM anexos WHERE id = $1', [id]);

        if (!anexo) {
            return res.status(404).json({ error: 'Anexo não encontrado' });
        }

        // Deletar arquivo físico
        if (fs.existsSync(anexo.caminho_arquivo)) {
            fs.unlinkSync(anexo.caminho_arquivo);
        }

        await run('DELETE FROM anexos WHERE id = $1', [id]);

        res.json({ message: 'Anexo deletado com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar anexo:', error);
        res.status(500).json({ error: 'Erro ao deletar anexo' });
    }
});

export default router;
