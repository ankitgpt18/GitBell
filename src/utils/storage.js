// Storage utility module — Web version (uses localStorage instead of chrome.storage)
const Storage = {
    _get(key) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : null;
        } catch { return null; }
    },

    _set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    },

    // Listeners for reactive updates
    _listeners: new Set(),
    subscribe(fn) {
        this._listeners.add(fn);
        return () => this._listeners.delete(fn);
    },
    _notify() {
        this._listeners.forEach(fn => fn());
    },

    async getRepositories() {
        return this._get('repositories') || [];
    },

    async addRepository(owner, repo) {
        const repositories = await this.getRepositories();
        const exists = repositories.some(r => r.owner === owner && r.repo === repo);
        if (exists) throw new Error('Repository already being monitored');

        const newRepo = {
            owner,
            repo,
            fullName: `${owner}/${repo}`,
            addedAt: Date.now(),
            lastChecked: null,
            lastIssueNumber: null,
            status: 'active'
        };

        repositories.push(newRepo);
        this._set('repositories', repositories);
        this._notify();
        return newRepo;
    },

    async removeRepository(fullName) {
        const repositories = await this.getRepositories();
        const filtered = repositories.filter(r => r.fullName !== fullName);
        this._set('repositories', filtered);
        this._notify();
    },

    async updateRepository(fullName, updates) {
        const repositories = await this.getRepositories();
        const index = repositories.findIndex(r => r.fullName === fullName);
        if (index !== -1) {
            repositories[index] = { ...repositories[index], ...updates };
            this._set('repositories', repositories);
            this._notify();
        }
    },

    async getSettings() {
        return this._get('settings') || {
            checkInterval: 10,
            githubToken: '',
            notificationsEnabled: true,
            soundEnabled: true,
            emailEnabled: false,
            emailAddress: '',
            theme: 'dark'
        };
    },

    async updateSettings(newSettings) {
        const currentSettings = await this.getSettings();
        const updated = { ...currentSettings, ...newSettings };
        this._set('settings', updated);
        this._notify();
        return updated;
    },

    async getNotificationHistory(limit = 50) {
        const history = this._get('notificationHistory') || [];
        return history.slice(0, limit);
    },

    async addNotification(notification) {
        const history = await this.getNotificationHistory(100);
        history.unshift({ ...notification, timestamp: Date.now() });
        const trimmed = history.slice(0, 100);
        this._set('notificationHistory', trimmed);
        this._notify();
    },

    async clearNotificationHistory() {
        this._set('notificationHistory', []);
        this._notify();
    },

    async getStats() {
        return this._get('stats') || { totalIssuesFound: 0, totalChecks: 0, lastCheckTime: null };
    },

    async updateStats(updates) {
        const currentStats = await this.getStats();
        const updated = { ...currentStats, ...updates };
        this._set('stats', updated);
        this._notify();
        return updated;
    }
};

export default Storage;
