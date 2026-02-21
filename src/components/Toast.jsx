import React from 'react';

export default function Toast({ toasts = [], onRemove }) {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className="animate-slide-in-right bg-card border border-border/60 rounded-2xl p-4 shadow-xl shadow-black/20 backdrop-blur-md"
                >
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                            {toast.type === 'issue' ? (
                                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M12 8v4" />
                                        <path d="M12 16h.01" />
                                    </svg>
                                </div>
                            ) : toast.type === 'success' ? (
                                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                </div>
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground">{toast.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{toast.message}</p>
                            {toast.labels?.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {toast.labels.map((label, i) => (
                                        <span key={i} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-blue-900/50 text-blue-300">
                                            {label}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => onRemove(toast.id)}
                            className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                    {toast.url && (
                        <a
                            href={toast.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                            View Issue →
                        </a>
                    )}
                </div>
            ))}
        </div>
    );
}
