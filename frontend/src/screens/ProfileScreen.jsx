import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import ThemeToggle from '../components/ThemeToggle';
import { backupAPI } from '../services/api';
import './ProfileScreen.css';

export default function ProfileScreen() {
    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleExportBackup = async () => {
        try {
            const response = await backupAPI.exportar();
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `backup-${new Date().toISOString().split('T')[0]}.json`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Erro ao exportar backup:', error);
            alert('Erro ao exportar backup');
        }
    };

    return (
        <div className="page fade-in">
            <div className="profile-header">
                <div className="profile-avatar">
                    {user?.nome?.charAt(0).toUpperCase() || '👤'}
                </div>
                <h1 className="profile-name">{user?.nome}</h1>
                <p className="profile-email">{user?.email}</p>
                {isAdmin() && (
                    <span className="admin-badge">👑 Administrador</span>
                )}
            </div>

            <div className="profile-sections">
                <Card padding="none">
                    <div className="profile-section-header">
                        <h3>Informações da Conta</h3>
                    </div>

                    <div className="ios-list-item">
                        <div className="profile-info-item">
                            <span className="profile-icon">📧</span>
                            <div>
                                <div className="profile-info-label">Email</div>
                                <div className="profile-info-value">{user?.email}</div>
                            </div>
                        </div>
                    </div>

                    {user?.telefone && (
                        <div className="ios-list-item">
                            <div className="profile-info-item">
                                <span className="profile-icon">📱</span>
                                <div>
                                    <div className="profile-info-label">Telefone</div>
                                    <div className="profile-info-value">{user?.telefone}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="ios-list-item">
                        <div className="profile-info-item">
                            <span className="profile-icon">🔑</span>
                            <div>
                                <div className="profile-info-label">Tipo de Conta</div>
                                <div className="profile-info-value">
                                    {isAdmin() ? 'Administrador' : 'Usuário Normal'}
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card padding="none">
                    <div className="profile-section-header">
                        <h3>Configurações</h3>
                    </div>
                    <div className="ios-list-item">
                        <ThemeToggle />
                    </div>
                    <div className="ios-list-item" onClick={() => navigate('/categorias')}>
                        <div className="profile-info-item">
                            <span className="profile-icon">📑</span>
                            <div>
                                <div className="profile-info-label">Categorias</div>
                                <div className="profile-info-value">Gerenciar categorias</div>
                            </div>
                        </div>
                    </div>
                    <div className="ios-list-item" onClick={() => navigate('/metas')}>
                        <div className="profile-info-item">
                            <span className="profile-icon">🎯</span>
                            <div>
                                <div className="profile-info-label">Metas Financeiras</div>
                                <div className="profile-info-value">Definir e acompanhar metas</div>
                            </div>
                        </div>
                    </div>
                </Card>

                {isAdmin() && (
                    <Card
                        padding="medium"
                        className="admin-card"
                        onClick={() => navigate('/admin')}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="admin-card-header">
                            <span className="admin-icon">👑</span>
                            <h3>Painel de Administrador</h3>
                        </div>
                        <p className="text-secondary text-sm">
                            Como administrador, você tem acesso total ao sistema e pode visualizar dados de todos os usuários. Toque para abrir.
                        </p>
                    </Card>
                )}

                {isAdmin() && (
                    <Card padding="none">
                        <div className="profile-section-header">
                            <h3>Backup e Dados</h3>
                        </div>
                        <div className="ios-list-item" onClick={handleExportBackup}>
                            <div className="profile-info-item">
                                <span className="profile-icon">💾</span>
                                <div>
                                    <div className="profile-info-label">Exportar Dados</div>
                                    <div className="profile-info-value">Baixar backup completo (JSON)</div>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                <div className="profile-actions">
                    <Button
                        variant="destructive"
                        size="large"
                        fullWidth
                        onClick={handleLogout}
                        icon="🚪"
                    >
                        Sair da Conta
                    </Button>
                </div>
            </div>
        </div>
    );
}
