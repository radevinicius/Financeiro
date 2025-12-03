import { useEffect } from 'react';
import './Modal.css';

export default function Modal({
    isOpen,
    onClose,
    title,
    children,
    size = 'medium'
}) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="ios-modal-overlay" onClick={onClose}>
            <div
                className={`ios-modal ios-modal-${size} slide-up`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="ios-modal-header">
                    <div className="ios-modal-drag-indicator"></div>
                    {title && <h3 className="ios-modal-title">{title}</h3>}
                    <button className="ios-modal-close" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <div className="ios-modal-content">
                    {children}
                </div>
            </div>
        </div>
    );
}
