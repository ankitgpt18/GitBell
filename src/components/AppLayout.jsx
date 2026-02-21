import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function AppLayout({ children }) {
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex flex-col h-screen bg-background">
            {/* Header — NextToken style */}
            <header className="py-2.5 md:py-3 px-3 md:px-4 flex justify-between items-center flex-shrink-0">
                <div className="flex items-center gap-2 md:gap-3">
                    {/* Mobile sidebar toggle */}
                    <button
                        className="md:hidden inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent transition-colors"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="4" y1="12" x2="20" y2="12" />
                            <line x1="4" y1="6" x2="20" y2="6" />
                            <line x1="4" y1="18" x2="20" y2="18" />
                        </svg>
                    </button>

                    <Link to="/" className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                        </div>
                        <h1 className="text-lg md:text-xl font-semibold cursor-pointer hover:text-primary transition-colors">GitBell</h1>
                    </Link>
                </div>

                <div className="flex items-center gap-2 md:gap-3">
                    {/* Nav links */}
                    <Link
                        to="/"
                        className={`hidden md:inline-flex items-center justify-center rounded-md h-8 px-3 text-sm font-medium transition-all duration-200 hover:bg-muted/50 hover:scale-105 ${location.pathname === '/' ? 'text-foreground' : 'text-muted-foreground'
                            }`}
                    >
                        Dashboard
                    </Link>
                    <Link
                        to="/settings"
                        className={`hidden md:inline-flex items-center justify-center rounded-md h-8 px-3 text-sm font-medium transition-all duration-200 hover:bg-muted/50 hover:scale-105 ${location.pathname === '/settings' ? 'text-foreground' : 'text-muted-foreground'
                            }`}
                    >
                        Settings
                    </Link>

                    {/* GitHub Link */}
                    <a
                        href="https://github.com/ankitgpt18/GitBell"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-md h-8 px-3 text-sm font-medium transition-all duration-200 hover:bg-muted/50 hover:scale-105 text-muted-foreground"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="mr-1.5">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                        <span className="hidden md:inline">GitHub</span>
                    </a>

                    {/* Sign Up style button */}
                    <a
                        href="https://github.com/ankitgpt18/GitBell"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-md h-8 px-3 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 transition-all duration-200 hover:scale-105 hover:shadow-md text-sm font-medium"
                    >
                        ⭐ Star
                    </a>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 p-0 md:p-4 overflow-y-auto" style={{ scrollbarGutter: 'stable' }}>
                <div className="flex rounded-none md:rounded-xl bg-background md:bg-card border-0 md:border md:border-border/50 min-h-full">
                    {/* Mobile sidebar overlay */}
                    {sidebarOpen && (
                        <div
                            className="fixed inset-0 z-40 bg-black/50 md:hidden"
                            onClick={() => setSidebarOpen(false)}
                        />
                    )}

                    {/* Content */}
                    <div className="flex flex-1 bg-background overflow-y-auto">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
