// GitHub API module
const GitHubAPI = {
    baseUrl: 'https://api.github.com',

    async fetchIssues(owner, repo, token = null, since = null) {
        const url = new URL(`${this.baseUrl}/repos/${owner}/${repo}/issues`);
        url.searchParams.append('state', 'open');
        url.searchParams.append('sort', 'created');
        url.searchParams.append('direction', 'desc');
        url.searchParams.append('per_page', '30');

        if (since) {
            url.searchParams.append('since', new Date(since).toISOString());
        }

        const headers = { 'Accept': 'application/vnd.github.v3+json' };
        if (token) headers['Authorization'] = `token ${token}`;

        try {
            const response = await fetch(url.toString(), { headers });
            const remaining = response.headers.get('X-RateLimit-Remaining');
            const resetTime = response.headers.get('X-RateLimit-Reset');

            if (!response.ok) {
                if (response.status === 404) throw new Error('Repository not found');
                if (response.status === 403) throw new Error('Rate limit exceeded. Please add a GitHub token in settings.');
                throw new Error(`GitHub API error: ${response.status}`);
            }

            const issues = await response.json();
            const actualIssues = issues.filter(issue => !issue.pull_request);

            return {
                issues: actualIssues,
                rateLimit: {
                    remaining: parseInt(remaining),
                    reset: resetTime ? new Date(parseInt(resetTime) * 1000) : null
                }
            };
        } catch (error) {
            console.error('Error fetching GitHub issues:', error);
            throw error;
        }
    },

    async validateToken(token) {
        try {
            const response = await fetch(`${this.baseUrl}/user`, {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (response.ok) {
                const user = await response.json();
                return { valid: true, username: user.login, name: user.name };
            }
            return { valid: false };
        } catch (error) {
            console.error('Error validating token:', error);
            return { valid: false };
        }
    },

    async checkRepository(owner, repo, token = null) {
        const headers = { 'Accept': 'application/vnd.github.v3+json' };
        if (token) headers['Authorization'] = `token ${token}`;

        try {
            const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}`, { headers });
            if (response.ok) {
                const repoData = await response.json();
                return {
                    exists: true,
                    data: {
                        fullName: repoData.full_name,
                        description: repoData.description,
                        stars: repoData.stargazers_count,
                        language: repoData.language,
                        isPrivate: repoData.private
                    }
                };
            }
            return { exists: false };
        } catch (error) {
            console.error('Error checking repository:', error);
            return { exists: false };
        }
    },

    async getNewIssues(owner, repo, lastIssueNumber, token = null) {
        const result = await this.fetchIssues(owner, repo, token);
        if (!lastIssueNumber) return [];
        return result.issues.filter(issue => issue.number > lastIssueNumber);
    }
};

export default GitHubAPI;
