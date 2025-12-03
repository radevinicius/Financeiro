import './Button.css';

export default function Button({
    children,
    variant = 'primary',
    size = 'medium',
    fullWidth = false,
    icon,
    onClick,
    disabled = false,
    type = 'button'
}) {
    const classNames = [
        'ios-button',
        `ios-button-${variant}`,
        `ios-button-${size}`,
        fullWidth ? 'ios-button-full' : '',
        disabled ? 'ios-button-disabled' : ''
    ].filter(Boolean).join(' ');

    return (
        <button
            type={type}
            className={classNames}
            onClick={onClick}
            disabled={disabled}
        >
            {icon && <span className="ios-button-icon">{icon}</span>}
            <span className="ios-button-text">{children}</span>
        </button>
    );
}
