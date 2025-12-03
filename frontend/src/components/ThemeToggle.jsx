import { useTheme } from '../context/ThemeContext';
import { FiMoon, FiSun } from 'react-icons/fi';
import './ThemeToggle.css';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Alternar tema"
        >
            {theme === 'dark' ? (
                <>
                    <FiSun className="theme-icon" />
                    <span>Modo Claro</span>
                </>
            ) : (
                <>
                    <FiMoon className="theme-icon" />
                    <span>Modo Escuro</span>
                </>
            )}
        </button>
    );
}
