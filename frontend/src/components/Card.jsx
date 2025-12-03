import './Card.css';

export default function Card({
    children,
    glass = false,
    padding = 'medium',
    onClick,
    className = ''
}) {
    const classNames = [
        glass ? 'glass-card' : 'ios-card',
        `card-padding-${padding}`,
        onClick ? 'card-clickable' : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <div className={classNames} onClick={onClick}>
            {children}
        </div>
    );
}
