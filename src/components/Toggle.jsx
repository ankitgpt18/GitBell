import React from 'react';

const Toggle = ({ checked, onChange, label, description }) => {
    return (
        <label className="flex items-center justify-between cursor-pointer group">
            <div className="flex flex-col">
                <span className="text-sm font-medium text-bento-text group-hover:text-white transition-colors">{label}</span>
                {description && <span className="text-xs text-bento-subtext">{description}</span>}
            </div>
            <div className="relative">
                <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
                <div className={`w-11 h-6 rounded-full transition-colors duration-300 ease-in-out ${checked ? 'bg-bento-accent' : 'bg-white/5 border border-white/10'}`}></div>
                <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ease-in-out shadow-sm ${checked ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </div>
        </label>
    );
};

export default Toggle;
