// Storage utility module for managing repositories, settings, and notification history

const Storage = {
  // Get theme preference
  async getTheme() {
    const settings = await this.getSettings();
    return settings.theme || 'dark';
  },

  // Set theme preference
  async setTheme(theme) {
    await this.updateSettings({ theme });
  },

  // Get all monitored repositories
  async getRepositories() {
    const result = await chrome.storage.sync.get(['repositories']);
    return result.repositories || [];
  },

  // Add a new repository to monitor
  async addRepository(owner, repo) {
    const repositories = await this.getRepositories();
    
    // Check if repository already exists
    const exists = repositories.some(r => r.owner === owner && r.repo === repo);
    if (exists) {
      throw new Error('Repository already being monitored');
    }

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
    await chrome.storage.sync.set({ repositories });
    return newRepo;
  },

  // Remove a repository from monitoring
  async removeRepository(fullName) {
    const repositories = await this.getRepositories();
    const filtered = repositories.filter(r => r.fullName !== fullName);
    await chrome.storage.sync.set({ repositories: filtered });
  },

  // Update repository metadata
  async updateRepository(fullName, updates) {
    const repositories = await this.getRepositories();
    const index = repositories.findIndex(r => r.fullName === fullName);
    
    if (index !== -1) {
      repositories[index] = { ...repositories[index], ...updates };
      await chrome.storage.sync.set({ repositories });
    }
  },

  // Get user settings
  async getSettings() {
    const result = await chrome.storage.sync.get(['settings']);
    return result.settings || {
      checkInterval: 10, // minutes
      githubToken: '',
      notificationsEnabled: true,
      soundEnabled: true,
      theme: 'dark'
    };
  },

  // Update settings
  async updateSettings(newSettings) {
    const currentSettings = await this.getSettings();
    const updated = { ...currentSettings, ...newSettings };
    await chrome.storage.sync.set({ settings: updated });
    return updated;
  },

  // Get notification history
  async getNotificationHistory(limit = 50) {
    const result = await chrome.storage.local.get(['notificationHistory']);
    const history = result.notificationHistory || [];
    return history.slice(0, limit);
  },

  // Add notification to history
  async addNotification(notification) {
    const history = await this.getNotificationHistory();
    history.unshift({
      ...notification,
      timestamp: Date.now()
    });
    
    // Keep only last 100 notifications
    const trimmed = history.slice(0, 100);
    await chrome.storage.local.set({ notificationHistory: trimmed });
  },

  // Clear notification history
  async clearNotificationHistory() {
    await chrome.storage.local.set({ notificationHistory: [] });
  },

  // Get statistics
  async getStats() {
    const result = await chrome.storage.local.get(['stats']);
    return result.stats || {
      totalIssuesFound: 0,
      totalChecks: 0,
      lastCheckTime: null
    };
  },

  // Update statistics
  async updateStats(updates) {
    const currentStats = await this.getStats();
    const updated = { ...currentStats, ...updates };
    await chrome.storage.local.set({ stats: updated });
    return updated;
  }
};

// Make available globally
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Storage;
}
