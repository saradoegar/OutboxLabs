export type EmailStatus = 'scheduled' | 'queued' | 'sent' | 'failed' | 'rescheduled';

export interface EmailRecord {
  id: string;
  user_id: string;
  tenant_id: string;
  sender: string;
  recipient: string;
  subject: string;
  body: string;
  status: EmailStatus;
  scheduled_at: Date | null;
  sent_at: Date | null;
  failure_reason: string | null;
  job_id: string | null;
  idempotency_key: string;
  delay_between_emails_sec: number;
  hourly_limit: number;
  retry_count: number;
  ethereal_preview_url: string | null;
  metadata: Record<string, any> | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateEmailDTO {
  from: string;
  recipients: string[];
  subject: string;
  body: string;
  scheduledAt?: string | Date;
  delayBetweenEmails?: number;
  hourlyLimit?: number;
  userId?: string;
  tenantId?: string;
  metadata?: Record<string, any>;
}

export interface EmailJobData {
  emailId: string;
  idempotencyKey: string;
  sender: string;
  recipient: string;
  subject: string;
  body: string;
  delayBetweenEmailsSec: number;
  hourlyLimit: number;
  scheduledAt?: string;
}
