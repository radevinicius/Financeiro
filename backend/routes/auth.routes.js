import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { run, getOne } from '../database/database.js';
import { createDefaultCategories } from '../database/database.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Registrar novo usuário
 */
router.post('/register', async (req, res) => {
    try {
        const { nome, email, telefone, senha, tipo } = req.body;

        // Validações
        if (!nome || !email || !senha) {
            return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
        }

        // Verificar se email já existe
        const existingUser = await getOne('SELECT id FROM usuarios WHERE email = $1', [email]);
        if (existingUser) {
            return res.status(409).json({ error: 'Email já cadastrado' });
        }

        // Hash da senha
        const senhaHash = await bcrypt.hash(senha, 10);

        // Inserir usuário
        const result = await run(
            `INSERT INTO usuarios (nome, email, telefone, senha_hash, tipo) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [nome, email, telefone || null, senhaHash, tipo || 'normal']
        );

        let userId = result.lastInsertRowid;

        if (!userId) {
            console.log('ID não retornado, tentando buscar por email...');
            const newUser = await getOne('SELECT id FROM usuarios WHERE email = $1', [email]);
            if (newUser) {
                userId = newUser.id;
                console.log('Usuário encontrado por email, ID:', userId);
            }
        }

        if (!userId) {
            throw new Error('Falha ao obter ID do usuário criado');
        }

        // Criar categorias padrão
        createDefaultCategories(userId);

        res.status(201).json({
            message: 'Usuário criado com sucesso',
            userId,
            nome,
            email,
            tipo: tipo || 'normal'
        });
    } catch (error) {
        console.error('Erro ao registrar usuário:', error);
        res.status(500).json({ error: 'Erro ao criar usuário: ' + error.message });
    }
});

/**
 * POST /api/auth/login
 * Login de usuário
 */
router.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body;

        // Validações
        if (!email || !senha) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios' });
        }

        // Buscar usuário
        const user = await getOne(
            'SELECT id, nome, email, telefone, senha_hash, tipo FROM usuarios WHERE email = $1',
            [email]
        );

        if (!user) {
            return res.status(401).json({ error: 'Email ou senha incorretos' });
        }

        // Verificar senha
        const senhaValida = await bcrypt.compare(senha, user.senha_hash);
        if (!senhaValida) {
            return res.status(401).json({ error: 'Email ou senha incorretos' });
        }

        // Gerar JWT
        const token = jwt.sign(
            { userId: user.id, tipo: user.tipo },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login realizado com sucesso',
            token,
            user: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                telefone: user.telefone,
                tipo: user.tipo
            }
        });
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        res.status(500).json({ error: 'Erro ao fazer login' });
    }
});

export default router;
