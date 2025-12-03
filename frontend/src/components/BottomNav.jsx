import { Link, useLocation } from 'react-router-dom';
import './BottomNav.css';

export default function BottomNav() {
    const location = useLocation();

    const navItems = [
        { path: '/dashboard', icon: '📊', label: 'Início' },
        { path: '/despesas', icon: '💸', label: 'Despesas' },
        { path: '/receitas', icon: '💰', label: 'Receitas' },
        { path: '/despesas-fixas', icon: '💳', label: 'Fixas' },
        { path: '/perfil', icon: '👤', label: 'Perfil' }
    ];

    return (
        <nav className="ios-bottom-nav safe-area-bottom">
            {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`ios-bottom-nav-item ${isActive ? 'active' : ''}`}
                    >
                        <span className="ios-bottom-nav-icon">{item.icon}</span>
                        <span className="ios-bottom-nav-label">{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
