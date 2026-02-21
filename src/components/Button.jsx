import React from 'react';

const Button = ({ children, onClick, variant = 'primary', className = '', size = 'md', ...props }) => {
    const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bento-bg focus:ring-bento-accent disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95";

    const variants = {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 bg-gradient-to-r from-blue-600 to-indigo-600",
        secondary: "bg-white/5 hover:bg-white/10 text-white border border-white/10 backdrop-blur-sm",
        icon: "bg-transparent hover:bg-white/5 text-bento-subtext hover:text-white",
        danger: "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/10"
    };

    const sizes = {
        sm: "px-3 py-1.5 text-xs rounded-full",
        md: "px-5 py-2.5 text-sm rounded-full",
        lg: "px-8 py-3.5 text-base rounded-full",
        icon: "p-2 rounded-full"
    };

    const sizeClass = variant === 'icon' ? sizes.icon : sizes[size];

    return (
        <button
            onClick={onClick}
            className={`${baseStyles} ${variants[variant]} ${sizeClass} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
