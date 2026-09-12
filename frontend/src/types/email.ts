export type EmailStatus = 'scheduled' | 'sent' | 'failed' | 'queued';

export interface EmailAttachment {
  id: string;
  name: string;
  size: string;
  url: string;
  type: 'image' | 'file';
}

export interface EmailItem {
  id: string;
  from: string;
  to: string[]; // List of recipient emails
  recipientName?: string;
  subject: string;
  body: string;
  status: EmailStatus;
  scheduledAt?: string; // ISO string or human-formatted time
  sentAt?: string;
  delayBetweenEmails?: number; // In seconds
  hourlyLimit?: number;
  isStarred?: boolean;
  attachments?: EmailAttachment[];
  referenceId?: string;
  etherealPreviewUrl?: string;
  error?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
}

export interface ScheduleEmailPayload {
  from: string;
  recipients: string[];
  subject: string;
  body: string;
  scheduledAt?: string;
  delayBetweenEmails: number;
  hourlyLimit: number;
  attachments?: EmailAttachment[];
}
