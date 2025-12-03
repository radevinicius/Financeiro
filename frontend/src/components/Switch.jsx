import { useState, useEffect } from 'react';
import './Switch.css';

export default function Switch({
    checked = false,
    onChange,
    disabled = false,
    label
}) {
    const [isChecked, setIsChecked] = useState(checked);

    useEffect(() => {
        setIsChecked(checked);
    }, [checked]);

    const handleToggle = () => {
        if (disabled) return;
        const newValue = !isChecked;
        setIsChecked(newValue);
        if (onChange) onChange(newValue);
    };

    return (
        <div className="ios-switch-container">
            {label && <span className="ios-switch-label">{label}</span>}

            <button
                type="button"
                role="switch"
                aria-checked={isChecked}
                className={`ios-switch ${isChecked ? 'checked' : ''} ${disabled ? 'disabled' : ''}`}
                onClick={handleToggle}
                disabled={disabled}
            >
                <span className="ios-switch-thumb"></span>
            </button>
        </div>
    );
}
