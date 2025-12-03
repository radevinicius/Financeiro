import jwt from 'jsonwebtoken';
import { getOne } from '../database/database.js';

/**
 * Middleware de autenticação JWT
 */
export async function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Buscar usuário no banco
        const user = await getOne('SELECT id, nome, email, tipo FROM usuarios WHERE id = $1', [decoded.userId]);

        if (!user) {
            return res.status(401).json({ error: 'Usuário não encontrado' });
        }

        // Adicionar usuário ao request
        req.user = user;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Token inválido ou expirado' });
    }
}

/**
 * Middleware para verificar se usuário é admin
 */
export function requireAdmin(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    if (req.user.tipo !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem acessar este recurso.' });
    }

    next();
}

/**
 * Middleware para verificar se usuário pode acessar recurso
 * (próprio recurso ou admin)
 */
export function canAccessResource(req, res, next) {
    const resourceUserId = parseInt(req.params.id || req.body.usuario_id);

    if (req.user.tipo === 'admin' || req.user.id === resourceUserId) {
        next();
    } else {
        return res.status(403).json({ error: 'Acesso negado' });
    }
}
