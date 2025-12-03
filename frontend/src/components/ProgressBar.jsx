import './ProgressBar.css';

export default function ProgressBar({ progress, color, label, showValue = true }) {
    const percentage = Math.min(Math.max(progress, 0), 100);

    const getColor = () => {
        if (color) return color;
        if (percentage > 100) return 'var(--ios-red)';
        if (percentage > 80) return 'var(--ios-orange)';
        if (percentage > 50) return 'var(--ios-blue)';
        return 'var(--ios-green)';
    };

    return (
        <div className="progress-bar-container">
            {label && (
                <div className="progress-label">
                    <span>{label}</span>
                    {showValue && <span className="progress-value">{percentage.toFixed(0)}%</span>}
                </div>
            )}
            <div className="progress-track">
                <div
                    className="progress-fill"
                    style={{
                        width: `${percentage}%`,
                        backgroundColor: getColor()
                    }}
                />
            </div>
        </div>
    );
}
