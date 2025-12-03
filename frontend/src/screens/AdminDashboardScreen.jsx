import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import Card from '../components/Card';
import './AdminDashboardScreen.css';

export default function AdminDashboardScreen() {
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [statsRes, usersRes] = await Promise.all([
                adminAPI.getDashboard(),
                adminAPI.getUsuarios()
            ]);
            setStats(statsRes.data);
            setUsers(usersRes.data.usuarios);
            setLoading(false);
        } catch (error) {
            console.error('Erro ao carregar admin:', error);
            setLoading(false);
        }
    };

    if (loading) return <div className="page center"><div className="ios-spinner"></div></div>;

    return (
        <div className="page fade-in">
            <h1 className="admin-title">Painel Administrativo</h1>

            <div className="admin-stats-grid">
                <Card padding="medium">
                    <div className="admin-stat-label">Usuários</div>
                    <div className="admin-stat-value">{stats?.users}</div>
                </Card>
                <Card padding="medium">
                    <div className="admin-stat-label">Transações</div>
                    <div className="admin-stat-value">{stats?.transactions}</div>
                </Card>
                <Card padding="medium">
                    <div className="admin-stat-label">Volume Total</div>
                    <div className="admin-stat-value">R$ {stats?.volume.toFixed(2)}</div>
                </Card>
            </div>

            <h2 className="section-title">Usuários</h2>
            <div className="users-list">
                {users.map(user => (
                    <Card key={user.id} padding="medium" className="user-card">
                        <div className="user-info">
                            <div className="user-avatar">{user.nome.charAt(0)}</div>
                            <div>
                                <div className="user-name">{user.nome}</div>
                                <div className="user-email">{user.email}</div>
                            </div>
                        </div>
                        <div className="user-stats">
                            <span className="badge">{user.tipo}</span>
                            <span className="text-xs text-secondary">
                                {user.despesas_count} despesas • {user.receitas_count} receitas
                            </span>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
