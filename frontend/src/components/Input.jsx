import { useState } from 'react';
import './Input.css';

export default function Input({
    label,
    type = 'text',
    value,
    onChange,
    placeholder,
    error,
    icon,
    disabled = false,
    required = false,
    ...props
}) {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <div className="ios-input-container">
            {label && (
                <label className="ios-input-label">
                    {label}
                    {required && <span className="ios-input-required">*</span>}
                </label>
            )}

            <div className={`ios-input-wrapper ${isFocused ? 'focused' : ''} ${error ? 'error' : ''}`}>
                {icon && <span className="ios-input-icon">{icon}</span>}

                <input
                    type={type}
                    className="ios-input"
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    {...props}
                />
            </div>

            {error && <span className="ios-input-error-text">{error}</span>}
        </div>
    );
}
