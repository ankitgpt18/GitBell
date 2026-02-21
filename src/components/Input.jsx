import React from 'react';

const Input = ({ label, ...props }) => {
    return (
        <div className="flex flex-col gap-1.5 w-full">
            {label && <label className="text-xs font-medium text-bento-subtext ml-1">{label}</label>}
            <input
                className="
          w-full bg-zinc-900 border border-white/10 rounded-full px-5 py-3 text-sm text-white 
          placeholder-white/20 focus:outline-none focus:border-bento-accent focus:ring-1 focus:ring-bento-accent
          transition-all duration-300
        "
                {...props}
            />
        </div>
    );
};

export default Input;
