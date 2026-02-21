import React from 'react';

const Layout = ({ children, className = '' }) => {
    return (
        <div className={`min-h-[100%] w-full flex flex-col p-4 bg-bento-bg text-bento-text ${className}`}>
            {children}
        </div>
    );
};

export default Layout;
