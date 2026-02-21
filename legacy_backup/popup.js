// Popup UI logic

let repositories = [];
let stats = {};
let notifications = [];

// Apply theme immediately to prevent flash
(async () => {
    const theme = await Storage.getTheme();
    document.documentElement.setAttribute('data-theme', theme);
})();

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
    await loadTheme();
    await loadData();
    setupEventListeners();
    startAutoRefresh();
});

// Load and apply theme
async function loadTheme() {
    const theme = await Storage.getTheme();
    document.documentElement.setAttribute('data-theme', theme);
}

// Load all data
async function loadData() {
    repositories = await Storage.getRepositories();
    stats = await Storage.getStats();
    notifications = await Storage.getNotificationHistory(10);

    updateUI();
}

// Update all UI elements
function updateUI() {
    updateStats();
    updateRepositoryList();
    updateNotifications();
}

// Update statistics bar
function updateStats() {
    document.getElementById('repoCount').textContent = repositories.length;
    document.getElementById('issueCount').textContent = stats.totalIssuesFound || 0;

    const lastCheck = stats.lastCheckTime;
    if (lastCheck) {
        document.getElementById('lastCheck').textContent = formatTimeAgo(lastCheck);
    } else {
        document.getElementById('lastCheck').textContent = 'Never';
    }
}

// Update repository list
function updateRepositoryList() {
    const repoList = document.getElementById('repoList');
    const emptyState = document.getElementById('emptyState');
    const repoListCount = document.getElementById('repoListCount');

    repoListCount.textContent = repositories.length;

    if (repositories.length === 0) {
        repoList.style.display = 'none';
        emptyState.style.display = 'flex';
        return;
    }

    repoList.style.display = 'flex';
    emptyState.style.display = 'none';

    repoList.innerHTML = repositories.map(repo => createRepoItem(repo)).join('');

    // Add event listeners to repository items
    repositories.forEach(repo => {
        const deleteBtn = document.querySelector(`[data-repo="${repo.fullName}"] .delete-btn`);
        const openBtn = document.querySelector(`[data-repo="${repo.fullName}"] .open-btn`);

        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => removeRepository(repo.fullName));
        }

        if (openBtn) {
            openBtn.addEventListener('click', () => {
                chrome.tabs.create({ url: `https://github.com/${repo.fullName}/issues` });
            });
        }
    });
}

// Create repository item HTML
function createRepoItem(repo) {
    const statusClass = repo.status || 'active';
    const lastChecked = repo.lastChecked ? formatTimeAgo(repo.lastChecked) : 'Not checked';
    const issueCount = repo.lastIssueNumber || 0;

    return `
    <div class="repo-item" data-repo="${repo.fullName}">
      <div class="repo-header">
        <div class="repo-name">
          <span class="repo-status ${statusClass}"></span>
          ${repo.fullName}
        </div>
        <div class="repo-actions">
          <button class="icon-btn open-btn" title="View on GitHub">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button class="icon-btn delete delete-btn" title="Remove repository">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="repo-meta">
        <div class="repo-meta-item">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          ${lastChecked}
        </div>
        <div class="repo-meta-item">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          ${issueCount} issues
        </div>
      </div>
    </div>
  `;
}

// Update notifications section
function updateNotifications() {
    const notificationsSection = document.getElementById('notificationsSection');
    const notificationsList = document.getElementById('notificationsList');

    if (notifications.length === 0) {
        notificationsSection.style.display = 'none';
        return;
    }

    notificationsSection.style.display = 'block';

    notificationsList.innerHTML = notifications.map(notif => `
    <div class="notification-item" data-url="${notif.issueUrl}">
      <div class="notification-title">#${notif.issueNumber}: ${notif.issueTitle}</div>
      <div class="notification-meta">
        ${notif.repository} • ${formatTimeAgo(notif.timestamp)}
      </div>
    </div>
  `).join('');

    // Add click listeners to notifications
    document.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', () => {
            const url = item.getAttribute('data-url');
            if (url) {
                chrome.tabs.create({ url });
            }
        });
    });
}

// Setup event listeners
function setupEventListeners() {
    // Add repository button
    document.getElementById('addRepoBtn').addEventListener('click', addRepository);

    // Enter key in input
    document.getElementById('repoInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addRepository();
        }
    });

    // Check now button
    document.getElementById('checkNowBtn').addEventListener('click', checkNow);

    // Settings button
    document.getElementById('settingsBtn').addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });

    // Clear notifications
    const clearBtn = document.getElementById('clearNotifications');
    if (clearBtn) {
        clearBtn.addEventListener('click', async () => {
            await Storage.clearNotificationHistory();
            notifications = [];
            updateNotifications();
            showToast('Notifications cleared', 'success');
        });
    }
}

// Add repository
async function addRepository() {
    const input = document.getElementById('repoInput');
    const value = input.value.trim();

    if (!value) {
        showToast('Please enter a repository', 'error');
        return;
    }

    // Parse owner/repo format
    const parts = value.split('/');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
        showToast('Invalid format. Use: owner/repository', 'error');
        return;
    }

    const [owner, repo] = parts;

    try {
        // Show loading state
        const addBtn = document.getElementById('addRepoBtn');
        addBtn.classList.add('loading');
        addBtn.disabled = true;

        // Verify repository exists
        const settings = await Storage.getSettings();
        const repoCheck = await GitHubAPI.checkRepository(owner, repo, settings.githubToken || null);

        if (!repoCheck.exists) {
            showToast('Repository not found', 'error');
            addBtn.classList.remove('loading');
            addBtn.disabled = false;
            return;
        }

        // Add to storage
        await Storage.addRepository(owner, repo);

        // Clear input
        input.value = '';

        // Reload data
        await loadData();

        showToast(`Added ${owner}/${repo}`, 'success');

        addBtn.classList.remove('loading');
        addBtn.disabled = false;
    } catch (error) {
        showToast(error.message, 'error');
        const addBtn = document.getElementById('addRepoBtn');
        addBtn.classList.remove('loading');
        addBtn.disabled = false;
    }
}

// Remove repository
async function removeRepository(fullName) {
    if (!confirm(`Remove ${fullName} from monitoring?`)) {
        return;
    }

    try {
        await Storage.removeRepository(fullName);
        await loadData();
        showToast('Repository removed', 'success');
    } catch (error) {
        showToast('Failed to remove repository', 'error');
    }
}

// Check now
async function checkNow() {
    const btn = document.getElementById('checkNowBtn');
    const icon = btn.querySelector('svg');

    btn.disabled = true;
    icon.classList.add('spinner');

    try {
        const response = await chrome.runtime.sendMessage({ action: 'checkNow' });

        if (response.success) {
            showToast('Check complete!', 'success');
            setTimeout(async () => {
                await loadData();
            }, 1000);
        } else {
            showToast('Check failed', 'error');
        }
    } catch (error) {
        showToast('Error checking repositories', 'error');
    } finally {
        btn.disabled = false;
        icon.classList.remove('spinner');
    }
}

// Auto-refresh UI every 10 seconds
function startAutoRefresh() {
    setInterval(async () => {
        await loadData();
    }, 10000);
}

// Format time ago
function formatTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}
