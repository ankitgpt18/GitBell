import Storage from '../utils/storage';
import GitHubAPI from '../utils/github';

// Initialize extension
chrome.runtime.onInstalled.addListener(async (details) => {
    console.log('GitBell installed');
    const settings = await Storage.getSettings();
    await setupAlarm(settings.checkInterval);

    if (details.reason === 'install') {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: 'GitBell Ready!',
            message: 'Click the extension icon to add repositories and start monitoring.',
            priority: 2
        });
    }
});

async function setupAlarm(intervalMinutes) {
    await chrome.alarms.clear('checkRepositories');
    await chrome.alarms.create('checkRepositories', { periodInMinutes: parseInt(intervalMinutes) });
    console.log(`Alarm set to check every ${intervalMinutes} minutes`);
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'checkRepositories') {
        console.log('Checking repositories for new issues...');
        await checkAllRepositories();
    }
});

async function checkAllRepositories() {
    const repositories = await Storage.getRepositories();
    const settings = await Storage.getSettings();
    const stats = await Storage.getStats();

    if (repositories.length === 0) return;

    let totalNewIssues = 0;

    for (const repo of repositories) {
        try {
            await Storage.updateRepository(repo.fullName, { status: 'checking' });
            const newIssues = await GitHubAPI.getNewIssues(
                repo.owner,
                repo.repo,
                repo.lastIssueNumber,
                settings.githubToken || null
            );

            if (newIssues.length > 0) {
                totalNewIssues += newIssues.length;
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
                const latestIssueNumber = Math.max(...newIssues.map(i => i.number));
                await Storage.updateRepository(repo.fullName, {
                    lastIssueNumber: Math.max(latestIssueNumber, repo.lastIssueNumber || 0),
                    lastChecked: Date.now(),
                    status: 'active'
                });
            } else {
                // Update lastChecked even if no new issues
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

    await Storage.updateStats({
        totalIssuesFound: stats.totalIssuesFound + totalNewIssues,
        totalChecks: stats.totalChecks + 1,
        lastCheckTime: Date.now()
    });
}

const notificationUrlMap = new Map();

async function sendNotification(repo, issue) {
    const settings = await Storage.getSettings();
    if (!settings.notificationsEnabled) return;

    const labels = issue.labels.map(l => l.name).join(', ');
    const labelText = labels ? `\n🏷️ ${labels}` : '';
    const beginnerLabels = ['good first issue', 'beginner-friendly', 'easy', 'help wanted'];
    const isBeginnerFriendly = issue.labels.some(l => beginnerLabels.some(bl => l.name.toLowerCase().includes(bl)));
    const priority = isBeginnerFriendly ? 2 : 1;

    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: `🆕 New Issue in ${repo.fullName}`,
        message: `#${issue.number}: ${issue.title}${labelText}${isBeginnerFriendly ? '\n⭐ Good First Issue!' : ''}`,
        priority: priority,
        requireInteraction: isBeginnerFriendly,
        buttons: [{ title: 'View Issue' }]
    }, (notificationId) => {
        notificationUrlMap.set(notificationId, issue.html_url);
    });
}

chrome.notifications.onClicked.addListener((notificationId) => {
    const url = notificationUrlMap.get(notificationId);
    if (url) {
        chrome.tabs.create({ url });
        chrome.notifications.clear(notificationId);
        notificationUrlMap.delete(notificationId);
    }
});

chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
    if (buttonIndex === 0) {
        const url = notificationUrlMap.get(notificationId);
        if (url) {
            chrome.tabs.create({ url });
            chrome.notifications.clear(notificationId);
            notificationUrlMap.delete(notificationId);
        }
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'checkNow') {
        checkAllRepositories().then(() => sendResponse({ success: true }))
            .catch((error) => sendResponse({ success: false, error: error.message }));
        return true;
    } else if (request.action === 'updateInterval') {
        setupAlarm(request.interval).then(() => sendResponse({ success: true }));
        return true;
    }
});

chrome.runtime.onStartup.addListener(() => {
    console.log('Extension started, checking repositories...');
    checkAllRepositories();
});
