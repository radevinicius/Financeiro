import { useState } from 'react';
import './SegmentControl.css';

export default function SegmentControl({
    options,
    selected,
    onChange
}) {
    return (
        <div className="ios-segment-control">
            {options.map((option) => (
                <button
                    key={option.value}
                    className={`ios-segment-control-item ${selected === option.value ? 'active' : ''}`}
                    onClick={() => onChange(option.value)}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}
