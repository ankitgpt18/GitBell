import React, { useEffect, useState, useRef } from 'react';
import Storage from '../utils/storage';
import GitHubAPI from '../utils/github';
import Poller from '../utils/poller';

const QUICK_ACTIONS = [
    {
        label: 'Track Issues', icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" />
            </svg>
        )
    },
    {
        label: 'Email Alerts', icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
        )
    },
    {
        label: 'Open Source', icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" />
            </svg>
        )
    },
    {
        label: 'GSoC Ready', icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
                <path d="M20 3v4" /><path d="M22 5h-4" />
            </svg>
        )
    },
];

// Repo card in the grid — NextToken use-case card style
const RepoCard = ({ repo, onDelete }) => (
    <div className="group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 bg-card border border-border/60 hover:border-border hover:shadow-xl hover:shadow-black/10 hover:-translate-y-1">
        {/* Preview banner */}
        <div className="relative w-full aspect-[16/7] overflow-hidden bg-muted">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-indigo-600/10 to-purple-600/20 flex items-center justify-center">
                <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${repo.status === 'error' ? 'bg-red-500 animate-pulse-dot' : repo.status === 'checking' ? 'bg-yellow-400 animate-pulse-dot' : 'bg-green-400 animate-pulse-dot'}`} />
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            {repo.status === 'checking' ? 'Scanning...' : repo.status === 'error' ? 'Error' : 'Active'}
                        </span>
                    </div>
                    <p className="text-3xl font-bold text-foreground">#{repo.lastIssueNumber || 0}</p>
                    <p className="text-[10px] text-muted-foreground font-medium mt-1">Latest Issue</p>
                </div>
            </div>
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                <a
                    href={`https://github.com/${repo.fullName}/issues`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-background/95 backdrop-blur-md border border-border/80 rounded-lg px-5 py-2.5 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 shadow-lg font-medium text-sm transform translate-y-2 group-hover:translate-y-0"
                    onClick={(e) => e.stopPropagation()}
                >
                    View Issues
                </a>
            </div>
        </div>

        {/* Card body */}
        <div className="p-5 space-y-3.5 bg-card">
            <div className="flex items-center justify-between">
                <h3 className="font-medium text-base leading-snug text-foreground group-hover:text-primary transition-colors duration-200 truncate">
                    {repo.fullName}
                </h3>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(repo.fullName); }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 rounded-lg transition-all text-muted-foreground hover:text-red-400"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                </button>
            </div>
            <div className="flex flex-wrap gap-2">
                <span className="inline-block px-2.5 py-1 rounded-md text-xs font-medium border border-transparent bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 hover:scale-105 transition-transform duration-200">
                    {repo.status === 'active' ? 'Tracking' : repo.status}
                </span>
                {repo.lastChecked && (
                    <span className="inline-block px-2.5 py-1 rounded-md text-xs font-medium border border-transparent bg-muted text-muted-foreground">
                        {new Date(repo.lastChecked).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                )}
            </div>
        </div>
    </div>
);

// Stats bar
const StatsBar = ({ repos, stats }) => (
    <div className="flex items-center justify-center gap-6 text-center py-3">
        <div>
            <p className="text-2xl font-bold text-foreground">{repos.length}</p>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Repos</p>
        </div>
        <div className="w-px h-8 bg-border" />
        <div>
            <p className="text-2xl font-bold text-foreground">{stats.issues}</p>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Issues Found</p>
        </div>
        <div className="w-px h-8 bg-border" />
        <div>
            <p className="text-2xl font-bold text-foreground">{stats.checks}</p>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Scans</p>
        </div>
    </div>
);

export default function Dashboard({ addToast }) {
    const [repos, setRepos] = useState([]);
    const [stats, setStats] = useState({ checks: 0, issues: 0 });
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const inputRef = useRef(null);

    const loadData = async () => {
        const [r, s] = await Promise.all([
            Storage.getRepositories(),
            Storage.getStats()
        ]);
        setRepos(r);
        setStats({ checks: s.totalChecks, issues: s.totalIssuesFound });
    };

    useEffect(() => {
        loadData();
        const unsub = Storage.subscribe(loadData);
        return unsub;
    }, []);

    const handleAddRepo = async (e) => {
        e?.preventDefault();
        const val = inputValue.trim();
        if (!val) return;

        if (!val.includes('/')) {
            setError('Format: owner/repo');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const [owner, name] = val.split('/');
            const check = await GitHubAPI.checkRepository(owner, name);

            if (!check.exists) {
                throw new Error('Repository not found');
            }

            await Storage.addRepository(owner, name);
            setInputValue('');
            addToast({ type: 'success', title: 'Repository Added', message: `Now tracking ${owner}/${name}` });
            Poller.checkAll();
        } catch (err) {
            setError(err.message);
            addToast({ type: 'error', title: 'Error', message: err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (fullName) => {
        await Storage.removeRepository(fullName);
        addToast({ type: 'success', title: 'Removed', message: `Stopped tracking ${fullName}` });
    };

    const handleCheckNow = async () => {
        addToast({ type: 'success', title: 'Scanning...', message: 'Checking all repositories for new issues' });
        await Poller.checkAll();
    };

    return (
        <div className="flex flex-col flex-1 min-h-0">
            <div className="w-full px-3 md:px-0 pt-2">
                {/* Hero Section — NextToken central layout */}
                <div className="flex flex-col items-center justify-center w-full max-w-3xl mx-auto flex-grow pt-6 sm:pt-12 md:pt-16 lg:pt-20 pb-4 sm:pb-8 min-h-0">
                    <div className="flex flex-col items-center justify-center text-center px-2 sm:px-4 md:px-6 mb-4 sm:mb-6">
                        <div className="mb-4 sm:mb-6">
                            <h2
                                className="text-xl sm:text-2xl md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl font-semibold tracking-tight mb-1 sm:mb-2 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent"
                                style={{ lineHeight: '1.4' }}
                            >
                                Track GitHub Issues in Real-Time
                            </h2>
                            <div className="flex items-center justify-center mb-3 sm:mb-4">
                                <p className="text-sm sm:text-base md:text-base lg:text-lg font-normal text-muted-foreground tracking-wide">
                                    Never miss a new issue. Get instant email alerts for your favorite repos.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Central Search/Add Bar — NextToken input style */}
                    <div className="w-full">
                        <form onSubmit={handleAddRepo}>
                            <div className="rounded-3xl border overflow-hidden transition-all duration-200 bg-muted/30 focus-within:border-primary/50 focus-within:shadow-lg focus-within:shadow-primary/5">
                                <div className="relative flex items-center px-2 pt-1">
                                    <div className="grid w-full">
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            className="w-full px-3 py-2 pb-1.5 text-sm min-h-[65px] bg-transparent border-0 shadow-none focus:outline-none focus:ring-0 placeholder:text-muted-foreground resize-none"
                                            placeholder="Search and track a repository... (e.g., facebook/react)"
                                            value={inputValue}
                                            onChange={(e) => { setInputValue(e.target.value); setError(''); }}
                                            disabled={loading}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between px-2.5 pb-2 pt-0.5">
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1 ml-1">
                                            <button
                                                type="button"
                                                onClick={handleCheckNow}
                                                className="inline-flex items-center justify-center gap-2 text-sm font-medium h-8 px-3 rounded-full hover:bg-accent/80 text-muted-foreground hover:text-foreground transition-all duration-200"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M23 4v6h-6" /><path d="M1 20v-6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                                                </svg>
                                                Scan Now
                                            </button>
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading || !inputValue.trim()}
                                        className="inline-flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 rounded-full h-8 w-8 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-primary-foreground/20 border-t-primary-foreground" />
                                        ) : (
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="m5 12 7-7 7 7" /><path d="M12 19V5" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                        {error && (
                            <p className="text-xs text-red-400 font-medium mt-2 ml-4 animate-slide-up">{error}</p>
                        )}
                    </div>

                    {/* Quick-action pills — NextToken style */}
                    <div className="w-full mt-4 flex flex-wrap gap-2 justify-center">
                        {QUICK_ACTIONS.map((action) => (
                            <div
                                key={action.label}
                                className="h-9 text-xs flex items-center gap-1.5 px-3.5 rounded-full border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-all duration-200 hover:scale-105 hover:shadow-md hover:border-primary/50 group cursor-default"
                            >
                                <span className="h-3 w-3 text-primary/70 transition-colors duration-200 group-hover:text-primary [&>svg]:h-3 [&>svg]:w-3">
                                    {action.icon}
                                </span>
                                {action.label}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tracked Repos Section — NextToken "Example use cases" style */}
                <div className="w-full min-h-0 md:min-h-[400px] flex flex-col pt-6 md:pt-12">
                    <div className="w-full max-w-[1200px] mx-auto px-2 md:px-6 h-full flex flex-col">
                        <div className="flex-1 border border-border/50 rounded-2xl md:rounded-3xl bg-card/50 p-4 md:p-10 shadow-lg backdrop-blur-sm">
                            {/* Section header with stats */}
                            <div className="flex items-center justify-between mb-5 md:mb-10">
                                <h3 className="text-lg md:text-xl font-semibold text-foreground flex items-center gap-2">
                                    Tracked Repositories
                                </h3>
                                <StatsBar repos={repos} stats={stats} />
                            </div>

                            {repos.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                                    <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                                            <path d="M9 18c-4.51 2-5-2-7-2" />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-medium mb-1">No repositories tracked yet</p>
                                    <p className="text-xs text-muted-foreground">Use the search bar above to add your first repo</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 auto-rows-max">
                                    {repos.map(repo => (
                                        <RepoCard key={repo.fullName} repo={repo} onDelete={handleDelete} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center py-8">
                    <p className="text-xs text-muted-foreground">
                        GitBell v2.0 — Built for open-source contributors
                    </p>
                </div>
            </div>
        </div>
    );
}
