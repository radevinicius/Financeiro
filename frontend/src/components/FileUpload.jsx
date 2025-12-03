import { useState, useRef } from 'react';
import Button from './Button';
import './FileUpload.css';

export default function FileUpload({ onFileSelect, label = "Anexar Comprovante" }) {
    const [fileName, setFileName] = useState('');
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFileName(file.name);
            onFileSelect(file);
        }
    };

    return (
        <div className="file-upload-container">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,application/pdf"
                style={{ display: 'none' }}
            />
            <Button
                variant="secondary"
                onClick={() => fileInputRef.current.click()}
                icon="📎"
                fullWidth
            >
                {fileName || label}
            </Button>
            {fileName && (
                <button
                    className="remove-file"
                    onClick={() => {
                        setFileName('');
                        onFileSelect(null);
                        fileInputRef.current.value = '';
                    }}
                >
                    ✕
                </button>
            )}
        </div>
    );
}
