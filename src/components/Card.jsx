import React from 'react';

const Card = ({ children, className = '', hover = false }) => {
    return (
        <div
            className={`
        bg-bento-card border border-bento-border rounded-3xl p-5 shadow-lg relative overflow-hidden
        ${hover ? 'hover:bg-bento-cardHover transition-all duration-300 cursor-pointer group hover:border-white/20' : ''}
        ${className}
      `}
        >
            {children}
        </div>
    );
};

export default Card;
