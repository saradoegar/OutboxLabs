import type { EmailItem, ScheduleEmailPayload, UserProfile } from '../types/email';

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/api';

// Initial Figma mock data
const INITIAL_SCHEDULED: EmailItem[] = [
  {
    id: 'sched-1',
    from: 'oliver.brown@domain.io',
    to: ['john.smith@example.com'],
    recipientName: 'John Smith',
    subject: 'Meeting follow-up - Scheduled',
    body: 'Hi John, just wanted to follow up on our meeting yesterday regarding the product roadmap.',
    status: 'scheduled',
    scheduledAt: 'Tue 9:15:12 AM',
    delayBetweenEmails: 5,
    hourlyLimit: 100,
    isStarred: false,
    referenceId: 'MJWYT44 BM#52W01',
  },
  {
    id: 'sched-2',
    from: 'oliver.brown@domain.io',
    to: ['olive@company.com'],
    recipientName: 'Olive',
    subject: "Ramit, great to meet you - you'll love it",
    body: 'Hi Olive, just wanted to follow up on our meeting and introduce you to our team.',
    status: 'scheduled',
    scheduledAt: 'Thu 8:15:12 PM',
    delayBetweenEmails: 5,
    hourlyLimit: 100,
    isStarred: false,
    referenceId: 'MJWYT44 BM#52W02',
  },
];

const INITIAL_SENT: EmailItem[] = [
  {
    id: 'sent-1',
    from: 'oliver.brown@domain.io',
    to: ['sarah.wilson@example.com'],
    recipientName: 'Sarah Wilson',
    subject: 'Re: Project Update',
    body: 'Thanks for the update, Sarah. Looks good! We are ready to proceed with the next phase.',
    status: 'sent',
    sentAt: 'Nov 3, 10:23 AM',
    isStarred: false,
    referenceId: 'MJWYT44 BM#52W03',
  },
  {
    id: 'sent-2',
    from: 'oliver.brown@domain.io',
    to: ['support@domain.io'],
    recipientName: 'Support',
    subject: 'Issue with login',
    body: 'I am having trouble logging in to the dashboard with my second account. Could you please investigate?',
    status: 'sent',
    sentAt: 'Nov 2, 4:15 PM',
    isStarred: false,
    referenceId: 'MJWYT44 BM#52W04',
  },
];

// Helper to store in localStorage for offline/frontend development preview
function getStoredEmails(): { scheduled: EmailItem[]; sent: EmailItem[] } {
  try {
    const data = localStorage.getItem('reachinbox_emails');
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to read from localStorage', e);
  }
  return { scheduled: INITIAL_SCHEDULED, sent: INITIAL_SENT };
}

function saveStoredEmails(scheduled: EmailItem[], sent: EmailItem[]) {
  try {
    localStorage.setItem('reachinbox_emails', JSON.stringify({ scheduled, sent }));
  } catch (e) {
    console.error('Failed to save to localStorage', e);
  }
}

export const api = {
  async getScheduledEmails(): Promise<EmailItem[]> {
    try {
      const res = await fetch(`${API_BASE}/emails/scheduled`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Backend not running yet or unreachable, use local store
    }
    const { scheduled } = getStoredEmails();
    return scheduled;
  },

  async getSentEmails(): Promise<EmailItem[]> {
    try {
      const res = await fetch(`${API_BASE}/emails/sent`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Backend not running yet or unreachable
    }
    const { sent } = getStoredEmails();
    return sent;
  },

  async scheduleEmail(payload: ScheduleEmailPayload): Promise<EmailItem> {
    try {
      const res = await fetch(`${API_BASE}/emails/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Backend fallback
    }

    const { scheduled, sent } = getStoredEmails();
    const isScheduled = Boolean(payload.scheduledAt);
    const newEmail: EmailItem = {
      id: `mail-${Date.now()}`,
      from: payload.from,
      to: payload.recipients,
      recipientName: payload.recipients[0]?.split('@')[0] || 'Recipient',
      subject: payload.subject,
      body: payload.body,
      status: isScheduled ? 'scheduled' : 'sent',
      scheduledAt: payload.scheduledAt || undefined,
      sentAt: isScheduled ? undefined : 'Just now',
      delayBetweenEmails: payload.delayBetweenEmails,
      hourlyLimit: payload.hourlyLimit,
      attachments: payload.attachments,
      referenceId: `MJWYT44 BM#${Math.floor(1000 + Math.random() * 9000)}`,
      isStarred: false,
    };

    if (isScheduled) {
      scheduled.unshift(newEmail);
    } else {
      sent.unshift(newEmail);
    }

    saveStoredEmails(scheduled, sent);
    return newEmail;
  },

  async getEmailById(id: string): Promise<EmailItem | null> {
    try {
      const res = await fetch(`${API_BASE}/emails/${id}`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // fallback
    }
    const { scheduled, sent } = getStoredEmails();
    return [...scheduled, ...sent].find((e) => e.id === id) || null;
  },

  async getCurrentUser(): Promise<UserProfile | null> {
    try {
      const res = await fetch(`${API_BASE}/auth/me`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // fallback
    }
    const user = localStorage.getItem('reachinbox_user');
    return user ? JSON.parse(user) : null;
  },

  async saveCurrentUser(user: UserProfile) {
    localStorage.setItem('reachinbox_user', JSON.stringify(user));
  },

  async clearCurrentUser() {
    localStorage.removeItem('reachinbox_user');
  },
};
