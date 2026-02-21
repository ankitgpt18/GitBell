import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Storage from '../utils/storage';
import GitHubAPI from '../utils/github';
import EmailService from '../utils/emailService';
import Poller from '../utils/poller';

export default function Settings({ addToast }) {
    const [settings, setSettings] = useState({
        githubToken: '',
        checkInterval: 10,
        notificationsEnabled: true,
        soundEnabled: true,
        emailEnabled: false,
        emailAddress: ''
    });
    const [tokenStatus, setTokenStatus] = useState(null);
    const [saving, setSaving] = useState(false);
    const [testingEmail, setTestingEmail] = useState(false);

    useEffect(() => {
        Storage.getSettings().then(setSettings);
    }, []);

    const handleChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const saveSettings = async () => {
        setSaving(true);
        await Storage.updateSettings(settings);
        await Poller.restart();
        addToast({ type: 'success', title: 'Settings Saved', message: 'Your configuration has been updated' });
        setSaving(false);
    };

    const validateToken = async () => {
        setTokenStatus('validating');
        const result = await GitHubAPI.validateToken(settings.githubToken);
        setTokenStatus(result.valid ? 'valid' : 'invalid');
        addToast({
            type: result.valid ? 'success' : 'error',
            title: result.valid ? 'Token Valid' : 'Invalid Token',
            message: result.valid ? `Authenticated as ${result.username}` : 'Please check your token'
        });
    };

    const sendTestEmail = async () => {
        if (!settings.emailAddress) {
            addToast({ type: 'error', title: 'Error', message: 'Enter an email address first' });
            return;
        }
        setTestingEmail(true);
        const result = await EmailService.sendTestEmail(settings.emailAddress);
        addToast({
            type: result.success ? 'success' : 'error',
            title: result.success ? 'Test Sent' : 'Email Failed',
            message: result.success ? `Check your inbox at ${settings.emailAddress}` : result.error
        });
        setTestingEmail(false);
    };

    const intervals = [
        { value: 5, label: '5 min' },
        { value: 10, label: '10 min' },
        { value: 30, label: '30 min' },
        { value: 60, label: '1 hour' },
    ];

    return (
        <div className="flex flex-col flex-1 min-h-0 w-full">
            <div className="w-full max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-16">
                {/* Header */}
                <header className="mb-12 md:mb-16">
                    <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
                        </svg>
                        Back to Dashboard
                    </Link>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-2">Settings</h1>
                    <p className="text-muted-foreground font-medium max-w-lg leading-relaxed">
                        Configure GitBell for real-time monitoring and email notifications.
                    </p>
                </header>

                <div className="grid gap-8">
                    {/* GitHub Token Section */}
                    <div className="rounded-2xl md:rounded-3xl border border-border/50 bg-card/50 p-6 md:p-8 shadow-lg backdrop-blur-sm">
                        <div className="flex flex-col md:flex-row items-start justify-between gap-4 mb-6">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-3 text-foreground">
                                    <div className="p-2 bg-blue-500/10 rounded-xl text-primary">
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                        </svg>
                                    </div>
                                    GitHub Access
                                </h2>
                                <p className="text-sm text-muted-foreground mt-2 font-medium">
                                    Add a Personal Access Token to bypass API rate limits.
                                </p>
                            </div>
                            <a
                                href="https://github.com/settings/tokens/new?scopes=public_repo&description=GitBell"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-muted border border-border hover:border-primary/50 px-5 py-2.5 rounded-full text-xs font-bold text-foreground transition-all hover:scale-105 active:scale-95"
                            >
                                Generate Key →
                            </a>
                        </div>

                        <div className="flex flex-col md:flex-row gap-4 items-end">
                            <div className="flex-1 w-full">
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Access Token</label>
                                <input
                                    type="password"
                                    placeholder="ghp_xxxx..."
                                    value={settings.githubToken}
                                    onChange={(e) => handleChange('githubToken', e.target.value)}
                                    className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-muted-foreground"
                                />
                            </div>
                            <button
                                onClick={validateToken}
                                className="h-[48px] px-6 bg-muted border border-border hover:border-primary/50 rounded-xl text-sm font-medium transition-all hover:scale-105 active:scale-95"
                            >
                                {tokenStatus === 'validating' ? 'Checking...' : 'Verify'}
                            </button>
                        </div>
                        {tokenStatus === 'valid' && <p className="mt-4 text-xs text-green-400 font-bold uppercase tracking-widest flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>Authenticated</p>}
                        {tokenStatus === 'invalid' && <p className="mt-4 text-xs text-red-400 font-bold uppercase tracking-widest flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>Invalid Token</p>}
                    </div>

                    {/* Email Notification Section */}
                    <div className="rounded-2xl md:rounded-3xl border border-border/50 bg-card/50 p-6 md:p-8 shadow-lg backdrop-blur-sm">
                        <div className="flex flex-col md:flex-row items-start justify-between gap-4 mb-6">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-3 text-foreground">
                                    <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                        </svg>
                                    </div>
                                    Email Notifications
                                </h2>
                                <p className="text-sm text-muted-foreground mt-2 font-medium">
                                    Receive an email whenever a new issue is opened in your tracked repos.
                                </p>
                            </div>
                            <button
                                onClick={sendTestEmail}
                                disabled={testingEmail || !settings.emailAddress}
                                className="bg-muted border border-border hover:border-primary/50 px-5 py-2.5 rounded-full text-xs font-bold text-foreground transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {testingEmail ? 'Sending...' : 'Send Test Email'}
                            </button>
                        </div>

                        {/* Toggle */}
                        <div className="flex items-center justify-between mb-6 p-4 rounded-xl bg-muted/30 border border-border/30">
                            <div>
                                <p className="text-sm font-semibold text-foreground">Enable Email Alerts</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Get notified via email for every new issue</p>
                            </div>
                            <button
                                onClick={() => handleChange('emailEnabled', !settings.emailEnabled)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${settings.emailEnabled ? 'bg-primary' : 'bg-muted'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200 ${settings.emailEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Email Address</label>
                            <input
                                type="email"
                                placeholder="you@example.com"
                                value={settings.emailAddress}
                                onChange={(e) => handleChange('emailAddress', e.target.value)}
                                className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-muted-foreground"
                            />
                        </div>
                    </div>

                    {/* Scan Frequency & Preferences */}
                    <div className="grid lg:grid-cols-2 gap-8">
                        {/* Scan Frequency */}
                        <div className="rounded-2xl md:rounded-3xl border border-border/50 bg-card/50 p-6 md:p-8 shadow-lg backdrop-blur-sm">
                            <h2 className="text-xl font-bold flex items-center gap-3 text-foreground mb-6">
                                <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                                    </svg>
                                </div>
                                Scan Frequency
                            </h2>
                            <div className="grid grid-cols-2 gap-3">
                                {intervals.map(({ value, label }) => (
                                    <button
                                        key={value}
                                        onClick={() => handleChange('checkInterval', value)}
                                        className={`p-4 rounded-xl border text-sm font-medium transition-all duration-200 hover:scale-105 ${settings.checkInterval === value
                                                ? 'border-primary bg-primary/10 text-primary shadow-md shadow-primary/10'
                                                : 'border-border bg-muted/30 text-muted-foreground hover:border-primary/30'
                                            }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Preferences */}
                        <div className="rounded-2xl md:rounded-3xl border border-border/50 bg-card/50 p-6 md:p-8 shadow-lg backdrop-blur-sm">
                            <h2 className="text-xl font-bold flex items-center gap-3 text-foreground mb-6">
                                <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                    </svg>
                                </div>
                                Alerts
                            </h2>
                            <div className="space-y-4">
                                {/* In-app notifications */}
                                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/30">
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">In-App Toasts</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">Show pop-up alerts in the browser</p>
                                    </div>
                                    <button
                                        onClick={() => handleChange('notificationsEnabled', !settings.notificationsEnabled)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${settings.notificationsEnabled ? 'bg-primary' : 'bg-muted'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200 ${settings.notificationsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>

                                {/* Sound */}
                                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/30">
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">Sound Effects</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">Play a sound on new issues</p>
                                    </div>
                                    <button
                                        onClick={() => handleChange('soundEnabled', !settings.soundEnabled)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${settings.soundEnabled ? 'bg-primary' : 'bg-muted'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200 ${settings.soundEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end pt-4 pb-8">
                        <button
                            onClick={saveSettings}
                            disabled={saving}
                            className="inline-flex items-center justify-center h-12 px-8 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-sm font-bold transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-primary/20 active:scale-95 disabled:opacity-50"
                        >
                            {saving ? (
                                <div className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground/20 border-t-primary-foreground" />
                                    Saving...
                                </div>
                            ) : 'Save Configuration'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
