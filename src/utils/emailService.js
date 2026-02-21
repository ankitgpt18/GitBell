// Email notification service using EmailJS
import emailjs from '@emailjs/browser';

// Configure these with your EmailJS credentials
const EMAILJS_SERVICE_ID = 'service_gitbell';
const EMAILJS_TEMPLATE_ID = 'template_new_issue';
const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY';

let initialized = false;

const EmailService = {
    init() {
        if (!initialized) {
            emailjs.init(EMAILJS_PUBLIC_KEY);
            initialized = true;
        }
    },

    async sendNewIssueEmail(toEmail, repo, issue) {
        if (!toEmail) return { success: false, error: 'No email address configured' };

        this.init();

        const labels = issue.labels?.map(l => l.name).join(', ') || '';
        const beginnerLabels = ['good first issue', 'beginner-friendly', 'easy', 'help wanted'];
        const isBeginnerFriendly = issue.labels?.some(l =>
            beginnerLabels.some(bl => l.name.toLowerCase().includes(bl))
        ) || false;

        const templateParams = {
            to_email: toEmail,
            repo_name: repo.fullName,
            issue_number: issue.number,
            issue_title: issue.title,
            issue_url: issue.html_url,
            issue_body: (issue.body || '').substring(0, 300) + (issue.body?.length > 300 ? '...' : ''),
            labels: labels || 'None',
            is_beginner: isBeginnerFriendly ? '⭐ Good First Issue!' : '',
            created_at: new Date(issue.created_at).toLocaleString()
        };

        try {
            await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
            return { success: true };
        } catch (error) {
            console.error('Email send failed:', error);
            return { success: false, error: error.text || error.message };
        }
    },

    async sendTestEmail(toEmail) {
        if (!toEmail) return { success: false, error: 'No email address provided' };

        this.init();

        try {
            await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
                to_email: toEmail,
                repo_name: 'test/repository',
                issue_number: 42,
                issue_title: '🔔 GitBell Test Notification',
                issue_url: 'https://github.com',
                issue_body: 'This is a test email from GitBell. If you received this, your email notifications are working!',
                labels: 'test',
                is_beginner: '⭐ Good First Issue!',
                created_at: new Date().toLocaleString()
            });
            return { success: true };
        } catch (error) {
            console.error('Test email failed:', error);
            return { success: false, error: error.text || error.message };
        }
    }
};

export default EmailService;
