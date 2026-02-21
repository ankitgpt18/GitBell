import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Toggle from '../components/Toggle';
import Storage from '../utils/storage';
import GitHubAPI from '../utils/github';

export default function Options() {
    const [settings, setSettings] = useState({
        githubToken: '',
        checkInterval: 10,
        notificationsEnabled: true,
        soundEnabled: true
    });
    const [status, setStatus] = useState('');
    const [tokenStatus, setTokenStatus] = useState(null);

    useEffect(() => {
        Storage.getSettings().then(setSettings);
    }, []);

    const handleChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const saveSettings = async () => {
        setStatus('saving');
        await Storage.updateSettings(settings);

        // Notify background to update alarm
        chrome.runtime.sendMessage({
            action: 'updateInterval',
            interval: settings.checkInterval
        });

        setTimeout(() => setStatus('saved'), 500);
        setTimeout(() => setStatus(''), 2000);
    };

    const validateToken = async () => {
        setTokenStatus('validating');
        const result = await GitHubAPI.validateToken(settings.githubToken);
        setTokenStatus(result.valid ? 'valid' : 'invalid');
    };

    return (
        <Layout className="max-w-4xl mx-auto py-16 px-6">
            <header className="mb-16 text-center">
                <div className="inline-flex items-center justify-center p-4 mb-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl shadow-2xl shadow-blue-500/20 transform -rotate-2">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2z" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="M4.93 4.93l1.41 1.41" /><path d="M17.66 17.66l1.41 1.41" /><path d="M22 12h-2" /><path d="M2 12h2" /><path d="M4.93 19.07l1.41-1.41" /><path d="M17.66 6.34l1.41-1.41" /></svg>
                </div>
                <h1 className="text-4xl font-extrabold mb-4 tracking-tightest text-white">Advanced Settings</h1>
                <p className="text-zinc-500 font-medium max-w-lg mx-auto leading-relaxed">Customize your GitBell environment for peak performance and timely alerts.</p>
            </header>

            <div className="grid gap-8">
                {/* API Token Section */}
                <Card className="px-8 py-8">
                    <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-8">
                        <div>
                            <h2 className="text-xl font-bold flex items-center gap-3 text-white">
                                <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                </div>
                                GitHub Access
                            </h2>
                            <p className="text-sm text-zinc-500 mt-2 font-medium">Link your GitHub account via a Personal Access Token to bypass rate limits.</p>
                        </div>
                        <a href="https://github.com/settings/tokens/new?scopes=public_repo&description=GitBell" target="_blank" className="bg-zinc-900 border border-white/5 hover:border-white/10 px-5 py-2.5 rounded-full text-xs font-bold text-white transition-all hover:scale-105 active:scale-95">Generate Key →</a>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <Input
                                label="Access Token"
                                placeholder="Paste your token here"
                                type="password"
                                value={settings.githubToken}
                                onChange={(e) => handleChange('githubToken', e.target.value)}
                            />
                        </div>
                        <Button onClick={validateToken} className="md:h-[52px] h-[48px] px-8" variant="secondary">
                            {tokenStatus === 'validating' ? 'Checking...' : 'Verify Token'}
                        </Button>
                    </div>
                    {tokenStatus === 'valid' && <p className="mt-4 text-xs text-green-400 font-bold uppercase tracking-widest flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg> Authentication Successful</p>}
                    {tokenStatus === 'invalid' && <p className="mt-4 text-xs text-red-400 font-bold uppercase tracking-widest flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg> Invalid Credentials</p>}
                </Card>

                {/* Preferences Section */}
                <div className="grid lg:grid-cols-2 gap-8">
                    <Card className="px-8 py-8">
                        <div className="mb-8">
                            <h2 className="text-xl font-bold flex items-center gap-3 text-white">
                                <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                </div>
                                Scan Frequency
                            </h2>
                            <p className="text-sm text-zinc-500 mt-2 font-medium">Define the interval for background repository checks.</p>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            {[5, 10, 15, 30, 60].map(mins => (
                                <label key={mins} className={`flex items-center justify-between cursor-pointer py-3.5 px-5 rounded-2xl transition-all duration-300 border ${Number(settings.checkInterval) === mins ? 'bg-indigo-500/10 border-indigo-500/30 text-white' : 'bg-zinc-900/50 border-white/5 text-zinc-400 hover:border-white/10'}`}>
                                    <span className="text-sm font-bold tracking-tight">Every {mins} Minutes</span>
                                    <input
                                        type="radio"
                                        name="interval"
                                        value={mins}
                                        checked={Number(settings.checkInterval) === mins}
                                        onChange={(e) => handleChange('checkInterval', Number(e.target.value))}
                                        className="sr-only"
                                    />
                                    {Number(settings.checkInterval) === mins && (
                                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/50" />
                                    )}
                                </label>
                            ))}
                        </div>
                    </Card>

                    <Card className="px-8 py-8">
                        <div className="mb-8">
                            <h2 className="text-xl font-bold flex items-center gap-3 text-white">
                                <div className="p-2 bg-purple-500/10 rounded-xl text-purple-500">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                                </div>
                                Alerts
                            </h2>
                            <p className="text-sm text-zinc-500 mt-2 font-medium">Manage how you receive notifications and sound cues.</p>
                        </div>
                        <div className="space-y-10 pt-4">
                            <Toggle
                                label="Desktop Notifications"
                                description="Push alerts when new issues are detected"
                                checked={settings.notificationsEnabled}
                                onChange={(e) => handleChange('notificationsEnabled', e.target.checked)}
                            />
                            <Toggle
                                label="Auditory Alerts"
                                description="Play a subtle ping sound on detection"
                                checked={settings.soundEnabled}
                                onChange={(e) => handleChange('soundEnabled', e.target.checked)}
                            />
                        </div>
                    </Card>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-8 border-t border-white/5">
                    <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest">GitBell v2.0</p>
                    <div className="flex items-center gap-6">
                        {status === 'saved' && <span className="text-green-400 text-[10px] font-bold uppercase tracking-widest animate-fade-in flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Configuration Synchronized</span>}
                        <Button onClick={saveSettings} disabled={status === 'saving'} size="lg" className="shadow-2xl font-bold tracking-tight">
                            {status === 'saving' ? 'Applying...' : 'Save Configuration'}
                        </Button>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
