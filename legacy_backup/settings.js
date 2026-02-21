// Settings page logic

let currentSettings = {};

// Initialize settings page
document.addEventListener('DOMContentLoaded', async () => {
    await loadSettings();
    setupEventListeners();
});

// Load current settings
async function loadSettings() {
    currentSettings = await Storage.getSettings();

    // Populate form fields
    document.getElementById('githubToken').value = currentSettings.githubToken || '';

    // Set interval radio
    const intervalRadios = document.querySelectorAll('input[name="interval"]');
    intervalRadios.forEach(radio => {
        if (parseInt(radio.value) === currentSettings.checkInterval) {
            radio.checked = true;
        }
    });

    // Set notification toggles
    document.getElementById('notificationsEnabled').checked = currentSettings.notificationsEnabled !== false;
    document.getElementById('soundEnabled').checked = currentSettings.soundEnabled !== false;

    // Set theme toggle
    const theme = currentSettings.theme || 'dark';
    document.getElementById('themeToggle').checked = theme === 'light';
    applyTheme(theme);
}

// Apply theme to document
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
}

// Setup event listeners
function setupEventListeners() {
    // Validate token button
    document.getElementById('validateToken').addEventListener('click', validateToken);

    // Save settings button
    document.getElementById('saveSettings').addEventListener('click', saveSettings);

    // Export data
    document.getElementById('exportData').addEventListener('click', exportData);

    // Clear data
    document.getElementById('clearData').addEventListener('click', clearData);

    // Theme toggle
    document.getElementById('themeToggle').addEventListener('change', async (e) => {
        const theme = e.target.checked ? 'light' : 'dark';
        applyTheme(theme);
        await Storage.setTheme(theme);
        showToast(`Switched to ${theme} theme`, 'success');
    });

    // Auto-save on interval change
    document.querySelectorAll('input[name="interval"]').forEach(radio => {
        radio.addEventListener('change', () => {
            const saveStatus = document.getElementById('saveStatus');
            saveStatus.textContent = 'Interval updated';
            saveStatus.className = 'save-status success';
            setTimeout(() => {
                saveStatus.textContent = '';
            }, 2000);
        });
    });
}

// Validate GitHub token
async function validateToken() {
    const tokenInput = document.getElementById('githubToken');
    const token = tokenInput.value.trim();
    const statusDiv = document.getElementById('tokenStatus');
    const validateBtn = document.getElementById('validateToken');

    if (!token) {
        statusDiv.className = 'token-status error';
        statusDiv.textContent = 'Please enter a token';
        return;
    }

    // Show loading state
    validateBtn.textContent = 'Validating...';
    validateBtn.disabled = true;
    statusDiv.style.display = 'none';

    try {
        const result = await GitHubAPI.validateToken(token);

        if (result.valid) {
            statusDiv.className = 'token-status success';
            statusDiv.textContent = `✓ Valid token for ${result.username}`;
        } else {
            statusDiv.className = 'token-status error';
            statusDiv.textContent = '✗ Invalid token';
        }
    } catch (error) {
        statusDiv.className = 'token-status error';
        statusDiv.textContent = '✗ Validation failed';
    } finally {
        validateBtn.textContent = 'Validate';
        validateBtn.disabled = false;
    }
}

// Save settings
async function saveSettings() {
    const saveBtn = document.getElementById('saveSettings');
    const saveStatus = document.getElementById('saveStatus');

    // Show loading state
    saveBtn.disabled = true;
    saveStatus.textContent = 'Saving...';
    saveStatus.className = 'save-status';

    try {
        // Gather settings
        const newSettings = {
            githubToken: document.getElementById('githubToken').value.trim(),
            checkInterval: parseInt(document.querySelector('input[name="interval"]:checked').value),
            notificationsEnabled: document.getElementById('notificationsEnabled').checked,
            soundEnabled: document.getElementById('soundEnabled').checked,
            theme: document.getElementById('themeToggle').checked ? 'light' : 'dark'
        };

        // Save to storage
        await Storage.updateSettings(newSettings);

        // Update check interval in background
        await chrome.runtime.sendMessage({
            action: 'updateInterval',
            interval: newSettings.checkInterval
        });

        // Show success
        saveStatus.textContent = '✓ Settings saved';
        saveStatus.className = 'save-status success';

        // Update current settings
        currentSettings = newSettings;

        setTimeout(() => {
            saveStatus.textContent = '';
        }, 3000);
    } catch (error) {
        console.error('Error saving settings:', error);
        saveStatus.textContent = '✗ Failed to save';
        saveStatus.className = 'save-status error';
    } finally {
        saveBtn.disabled = false;
    }
}

// Export repository data
async function exportData() {
    try {
        const repositories = await Storage.getRepositories();
        const settings = await Storage.getSettings();
        const stats = await Storage.getStats();

        const exportData = {
            repositories,
            settings: {
                checkInterval: settings.checkInterval,
                notificationsEnabled: settings.notificationsEnabled,
                soundEnabled: settings.soundEnabled
                // Don't export token for security
            },
            stats,
            exportedAt: new Date().toISOString()
        };

        // Create download
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `github-issue-notifier-export-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('Data exported successfully', 'success');
    } catch (error) {
        console.error('Error exporting data:', error);
        showToast('Failed to export data', 'error');
    }
}

// Clear all data
async function clearData() {
    const confirmed = confirm(
        'Are you sure you want to clear all data? This will remove:\n\n' +
        '• All monitored repositories\n' +
        '• Notification history\n' +
        '• Statistics\n\n' +
        'Settings will be preserved. This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
        // Clear repositories
        await chrome.storage.sync.set({ repositories: [] });

        // Clear notification history
        await Storage.clearNotificationHistory();

        // Reset statistics
        await chrome.storage.local.set({
            stats: {
                totalIssuesFound: 0,
                totalChecks: 0,
                lastCheckTime: null
            }
        });

        showToast('All data cleared', 'success');

        // Reload page after a delay
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    } catch (error) {
        console.error('Error clearing data:', error);
        showToast('Failed to clear data', 'error');
    }
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toast.style.cssText = `
    position: fixed;
    bottom: 100px;
    right: 24px;
    background: var(--bg-tertiary);
    border: 1px solid ${type === 'success' ? 'var(--success)' : 'var(--error)'};
    border-radius: var(--radius-md);
    padding: 12px 16px;
    box-shadow: var(--shadow-lg);
    z-index: 1000;
    animation: slideUp 250ms cubic-bezier(0.4, 0, 0.2, 1);
  `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}
