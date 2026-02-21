import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Storage from '../utils/storage';
import GitHubAPI from '../utils/github';

const StatsCard = ({ label, value, icon }) => (
    <div className="flex flex-col items-center justify-center p-4 bg-zinc-900 border border-white/5 rounded-3xl transition-all duration-300 hover:border-white/10 hover:bg-zinc-800/50">
        <div className="text-bento-accent mb-2 opacity-80">{icon}</div>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        <div className="text-[10px] uppercase tracking-[0.15em] text-bento-subtext font-bold mt-1">{label}</div>
    </div>
);

const RepoItem = ({ repo, onDelete }) => (
    <Card className="flex items-center justify-between group mb-3 py-3.5 px-5" hover>
        <div className="flex items-center gap-4 overflow-hidden">
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 shadow-sm ${repo.status === 'error' ? 'bg-red-500 shadow-red-500/20' : 'bg-bento-accent shadow-blue-500/20'}`} />
            <div className="flex flex-col overflow-hidden">
                <span className="font-semibold truncate text-sm tracking-tight" title={repo.fullName}>{repo.fullName}</span>
                <span className="text-[11px] text-bento-subtext truncate font-medium">
                    #{repo.lastIssueNumber || 0} • {repo.status === 'checking' ? 'Checking...' : 'Active'}
                </span>
            </div>
        </div>
        <button
            onClick={() => onDelete(repo.fullName)}
            className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white/5 rounded-full transition-all text-bento-subtext hover:text-red-400"
        >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
        </button>
    </Card>
);

export default function Popup() {
    const [repos, setRepos] = useState([]);
    const [stats, setStats] = useState({ checks: 0, issues: 0 });
    const [newRepo, setNewRepo] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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
        chrome.storage.onChanged.addListener((changes, area) => {
            if (area === 'sync' && changes.repositories) {
                setRepos(changes.repositories.newValue);
            }
            if (area === 'local' && changes.stats) {
                const s = changes.stats.newValue;
                setStats({
                    checks: s?.totalChecks || 0,
                    issues: s?.totalIssuesFound || 0
                });
            }
        });
    }, []);

    const handleAddRepo = async (e) => {
        e.preventDefault();
        if (!newRepo.includes('/')) {
            setError('Format: owner/repo');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const [owner, name] = newRepo.split('/');
            const check = await GitHubAPI.checkRepository(owner, name);

            if (!check.exists) {
                throw new Error('Repository not found');
            }

            await Storage.addRepository(owner, name);
            setNewRepo('');
            chrome.runtime.sendMessage({ action: 'checkNow' });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (fullName) => {
        await Storage.removeRepository(fullName);
    };

    const handleCheckNow = () => {
        chrome.runtime.sendMessage({ action: 'checkNow' });
    };

    const openSettings = () => {
        if (chrome.runtime.openOptionsPage) {
            chrome.runtime.openOptionsPage();
        } else {
            window.open(chrome.runtime.getURL('options.html'));
        }
    };

    return (
        <Layout className="h-full overflow-hidden p-6">
            <header className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold shadow-xl shadow-blue-500/20 transform rotate-3">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2z" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="M4.93 4.93l1.41 1.41" /><path d="M17.66 17.66l1.41 1.41" /><path d="M22 12h-2" /><path d="M2 12h2" /><path d="M4.93 19.07l1.41-1.41" /><path d="M17.66 6.34l1.41-1.41" /></svg>
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tighter text-white">GitBell</h1>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-none">V2.0 PRO</p>
                    </div>
                </div>
                <Button variant="icon" onClick={openSettings} className="p-2.5 bg-zinc-900 border border-white/5 rounded-2xl hover:border-white/20">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
                </Button>
            </header>

            <div className="grid grid-cols-3 gap-3 mb-8">
                <StatsCard
                    label="Tracking"
                    value={repos.length}
                    icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>}
                />
                <StatsCard
                    label="Issues"
                    value={stats.issues}
                    icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>}
                />
                <StatsCard
                    label="Checks"
                    value={stats.checks}
                    icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>}
                />
            </div>

            <form onSubmit={handleAddRepo} className="mb-8 relative">
                <div className="flex gap-2">
                    <Input
                        placeholder="owner/repo"
                        value={newRepo}
                        onChange={(e) => setNewRepo(e.target.value)}
                        disabled={loading}
                    />
                    <Button type="submit" disabled={loading || !newRepo} className="aspect-square p-0 w-[50px]">
                        {loading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                        ) : (
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                        )}
                    </Button>
                </div>
                {error && <p className="absolute -bottom-6 left-5 text-[10px] font-bold text-red-400 uppercase tracking-tighter transition-all animate-slide-up">{error}</p>}
            </form>

            <div className="flex-1 overflow-y-auto space-y-3 -mx-2 px-2 pb-6 scrollbar-hide">
                <div className="px-1 mb-2">
                    <h2 className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1">Repositories</h2>
                </div>
                {repos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-bento-subtext opacity-30">
                        <svg className="mb-4" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                        <p className="text-xs font-bold tracking-widest uppercase">Start Tracking</p>
                    </div>
                ) : (
                    repos.map(repo => (
                        <RepoItem key={repo.fullName} repo={repo} onDelete={handleDelete} />
                    ))
                )}
            </div>

            <div className="pt-6 border-t border-white/5 flex justify-center">
                <button
                    onClick={handleCheckNow}
                    className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-bento-accent flex items-center gap-2 transition-all duration-300 active:scale-95"
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6" /><path d="M1 20v-6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
                    Check Assets
                </button>
            </div>
        </Layout>
    );
}
