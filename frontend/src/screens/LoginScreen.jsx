import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Input from '../components/Input';
import './LoginScreen.css';

export default function LoginScreen() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(email, senha);

        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.error);
        }

        setLoading(false);
    };

    return (
        <div className="login-screen">
            <div className="login-container fade-in">
                <div className="login-header">
                    <div className="login-icon">💰</div>
                    <h1 className="login-title">Financeiro</h1>
                    <p className="login-subtitle">Controle suas finanças com elegância</p>
                </div>

                <form className="login-form" onSubmit={handleLogin}>
                    {error && (
                        <div className="login-error">
                            {error}
                        </div>
                    )}

                    <Input
                        label="Email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        icon="✉️"
                        required
                    />

                    <Input
                        label="Senha"
                        type="password"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        placeholder="••••••••"
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
                        {loading ? 'Entrando...' : 'Entrar'}
                    </Button>
                </form>

                <div className="login-footer">
                    <p className="text-secondary text-sm">
                        Não tem uma conta?{' '}
                        <a href="/register" className="login-link">Crie uma agora</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
