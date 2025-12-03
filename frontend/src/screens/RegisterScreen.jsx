import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Input from '../components/Input';
import './RegisterScreen.css';

export default function RegisterScreen() {
    const navigate = useNavigate();
    const { register } = useAuth();

    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        telefone: '',
        senha: '',
        confirmarSenha: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');

        // Validações
        if (formData.senha !== formData.confirmarSenha) {
            setError('As senhas não coincidem');
            return;
        }

        if (formData.senha.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        setLoading(true);

        const result = await register({
            nome: formData.nome,
            email: formData.email,
            telefone: formData.telefone,
            senha: formData.senha,
            tipo: 'normal'
        });

        if (result.success) {
            alert('Conta criada com sucesso! Faça login agora.');
            navigate('/login');
        } else {
            setError(result.error);
        }

        setLoading(false);
    };

    return (
        <div className="register-screen">
            <div className="register-container fade-in">
                <div className="register-header">
                    <div className="register-icon">💰</div>
                    <h1 className="register-title">Criar Conta</h1>
                    <p className="register-subtitle">Comece a controlar suas finanças</p>
                </div>

                <form className="register-form" onSubmit={handleRegister}>
                    {error && (
                        <div className="register-error">
                            {error}
                        </div>
                    )}

                    <Input
                        label="Nome"
                        type="text"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        placeholder="Seu nome completo"
                        icon="👤"
                        required
                    />

                    <Input
                        label="Email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="seu@email.com"
                        icon="✉️"
                        required
                    />

                    <Input
                        label="Telefone (opcional)"
                        type="tel"
                        value={formData.telefone}
                        onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                        placeholder="(11) 99999-9999"
                        icon="📱"
                    />

                    <Input
                        label="Senha"
                        type="password"
                        value={formData.senha}
                        onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                        placeholder="Mínimo 6 caracteres"
                        icon="🔒"
                        required
                    />

                    <Input
                        label="Confirmar Senha"
                        type="password"
                        value={formData.confirmarSenha}
                        onChange={(e) => setFormData({ ...formData, confirmarSenha: e.target.value })}
                        placeholder="Digite a senha novamente"
                        icon="🔒"
                        required
                    />

                    <Button
                        type="submit"
                        variant="primary"
                        size="large"
                        fullWidth
                        disabled={loading}
                    >
                        {loading ? 'Criando conta...' : 'Criar Conta'}
                    </Button>
                </form>

                <div className="register-footer">
                    <p className="text-secondary text-sm">
                        Já tem uma conta?{' '}
                        <a href="/login" className="register-link">Faça login</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
