// Polling service — replaces Chrome extension background service worker
import Storage from './storage';
import GitHubAPI from './github';
import EmailService from './emailService';

let pollingInterval = null;
let toastCallback = null;

const Poller = {
    setToastCallback(cb) {
        toastCallback = cb;
    },

    async start() {
        const settings = await Storage.getSettings();
        this.stop();
        // Immediate first check
        await this.checkAll();
        // Then recurring
        pollingInterval = setInterval(() => this.checkAll(), settings.checkInterval * 60 * 1000);
    },

    stop() {
        if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
        }
    },

    async restart() {
        await this.start();
    },

    async checkAll() {
        const repositories = await Storage.getRepositories();
        const settings = await Storage.getSettings();
        const stats = await Storage.getStats();

        if (repositories.length === 0) return;

        let totalNewIssues = 0;

        for (const repo of repositories) {
            try {
                await Storage.updateRepository(repo.fullName, { status: 'checking' });

                const result = await GitHubAPI.fetchIssues(
                    repo.owner, repo.repo, settings.githubToken || null
                );

                const allIssues = result.issues;
                const latestNumber = allIssues.length > 0
                    ? Math.max(...allIssues.map(i => i.number))
                    : repo.lastIssueNumber;

                // Find new issues
                const newIssues = repo.lastIssueNumber
                    ? allIssues.filter(i => i.number > repo.lastIssueNumber)
                    : [];

                if (newIssues.length > 0) {
                    totalNewIssues += newIssues.length;

                    for (const issue of newIssues) {
                        // In-app toast
                        if (settings.notificationsEnabled && toastCallback) {
                            toastCallback({
                                type: 'issue',
                                title: `New Issue in ${repo.fullName}`,
                                message: `#${issue.number}: ${issue.title}`,
                                url: issue.html_url,
                                labels: issue.labels?.map(l => l.name) || []
                            });
                        }

                        // Email notification
                        if (settings.emailEnabled && settings.emailAddress) {
                            await EmailService.sendNewIssueEmail(settings.emailAddress, repo, issue);
                        }

                        // Save to history
                        await Storage.addNotification({
                            repository: repo.fullName,
                            issueNumber: issue.number,
                            issueTitle: issue.title,
                            issueUrl: issue.html_url,
                            labels: issue.labels?.map(l => l.name) || []
                        });
                    }
                }

                await Storage.updateRepository(repo.fullName, {
                    lastIssueNumber: latestNumber || repo.lastIssueNumber,
                    lastChecked: Date.now(),
                    status: 'active'
                });
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
};

export default Poller;
