// Background service worker for monitoring GitHub repositories

importScripts('storage.js', 'github-api.js');

// Initialize extension
chrome.runtime.onInstalled.addListener(async (details) => {
    console.log('GitHub Issue Notifier installed');

    // Set up periodic alarm
    const settings = await Storage.getSettings();
    await setupAlarm(settings.checkInterval);

    // Show welcome notification
    if (details.reason === 'install') {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: 'GitBell Ready!',
            message: 'Click the extension icon to add repositories and start monitoring for new issues.',
            priority: 2
        });
    }
});

// Set up alarm for periodic checks
async function setupAlarm(intervalMinutes) {
    await chrome.alarms.clear('checkRepositories');
    await chrome.alarms.create('checkRepositories', {
        periodInMinutes: intervalMinutes
    });
    console.log(`Alarm set to check every ${intervalMinutes} minutes`);
}

// Listen for alarm
chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'checkRepositories') {
        console.log('Checking repositories for new issues...');
        await checkAllRepositories();
    }
});

// Main function to check all repositories
async function checkAllRepositories() {
    const repositories = await Storage.getRepositories();
    const settings = await Storage.getSettings();
    const stats = await Storage.getStats();

    if (repositories.length === 0) {
        console.log('No repositories to check');
        return;
    }

    let totalNewIssues = 0;

    for (const repo of repositories) {
        try {
            // Update status to checking
            await Storage.updateRepository(repo.fullName, { status: 'checking' });

            // Fetch new issues
            const newIssues = await GitHubAPI.getNewIssues(
                repo.owner,
                repo.repo,
                repo.lastIssueNumber,
                settings.githubToken || null
            );

            if (newIssues.length > 0) {
                console.log(`Found ${newIssues.length} new issue(s) in ${repo.fullName}`);
                totalNewIssues += newIssues.length;

                // Send notifications for each new issue
                for (const issue of newIssues) {
                    await sendNotification(repo, issue);
                    await Storage.addNotification({
                        repository: repo.fullName,
                        issueNumber: issue.number,
                        issueTitle: issue.title,
                        issueUrl: issue.html_url,
                        labels: issue.labels.map(l => l.name)
                    });
                }

                // Update last issue number
                const latestIssueNumber = Math.max(...newIssues.map(i => i.number));
                await Storage.updateRepository(repo.fullName, {
                    lastIssueNumber: Math.max(latestIssueNumber, repo.lastIssueNumber || 0),
                    lastChecked: Date.now(),
                    status: 'active'
                });
            } else {
                // No new issues, just update last checked time
                const allIssues = await GitHubAPI.fetchIssues(repo.owner, repo.repo, settings.githubToken || null);
                const latestIssueNumber = allIssues.issues.length > 0
                    ? Math.max(...allIssues.issues.map(i => i.number))
                    : repo.lastIssueNumber;

                await Storage.updateRepository(repo.fullName, {
                    lastIssueNumber: latestIssueNumber || repo.lastIssueNumber,
                    lastChecked: Date.now(),
                    status: 'active'
                });
            }
        } catch (error) {
            console.error(`Error checking ${repo.fullName}:`, error);
            await Storage.updateRepository(repo.fullName, {
                status: 'error',
                lastError: error.message,
                lastChecked: Date.now()
            });
        }
    }

    // Update statistics
    await Storage.updateStats({
        totalIssuesFound: stats.totalIssuesFound + totalNewIssues,
        totalChecks: stats.totalChecks + 1,
        lastCheckTime: Date.now()
    });

    console.log(`Check complete. Found ${totalNewIssues} new issue(s) across ${repositories.length} repositories.`);
}

// Send notification for a new issue
async function sendNotification(repo, issue) {
    const settings = await Storage.getSettings();

    if (!settings.notificationsEnabled) {
        return;
    }

    // Extract labels
    const labels = issue.labels.map(l => l.name).join(', ');
    const labelText = labels ? `\n🏷️ ${labels}` : '';

    // Check for beginner-friendly labels
    const beginnerLabels = ['good first issue', 'beginner-friendly', 'easy', 'help wanted'];
    const isBeginnerFriendly = issue.labels.some(l =>
        beginnerLabels.some(bl => l.name.toLowerCase().includes(bl))
    );

    const priority = isBeginnerFriendly ? 2 : 1;

    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: `🆕 New Issue in ${repo.fullName}`,
        message: `#${issue.number}: ${issue.title}${labelText}${isBeginnerFriendly ? '\n⭐ Good First Issue!' : ''}`,
        priority: priority,
        requireInteraction: isBeginnerFriendly,
        buttons: [
            { title: 'View Issue' }
        ]
    }, (notificationId) => {
        // Store notification ID with issue URL for click handling
        notificationUrlMap.set(notificationId, issue.html_url);
    });
}

// Map to store notification URLs
const notificationUrlMap = new Map();

// Handle notification clicks
chrome.notifications.onClicked.addListener((notificationId) => {
    const url = notificationUrlMap.get(notificationId);
    if (url) {
        chrome.tabs.create({ url });
        chrome.notifications.clear(notificationId);
        notificationUrlMap.delete(notificationId);
    }
});

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
    if (buttonIndex === 0) { // View Issue button
        const url = notificationUrlMap.get(notificationId);
        if (url) {
            chrome.tabs.create({ url });
            chrome.notifications.clear(notificationId);
            notificationUrlMap.delete(notificationId);
        }
    }
});

// Listen for messages from popup/settings
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'checkNow') {
        checkAllRepositories().then(() => {
            sendResponse({ success: true });
        }).catch((error) => {
            sendResponse({ success: false, error: error.message });
        });
        return true; // Keep channel open for async response
    } else if (request.action === 'updateInterval') {
        setupAlarm(request.interval).then(() => {
            sendResponse({ success: true });
        });
        return true;
    }
});

// Check immediately on startup
chrome.runtime.onStartup.addListener(() => {
    console.log('Extension started, checking repositories...');
    checkAllRepositories();
});
