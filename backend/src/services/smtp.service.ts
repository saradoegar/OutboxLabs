import nodemailer, { Transporter } from 'nodemailer';
import { config } from '../config/env.js';

let transporter: Transporter | null = null;

const getTransporter = async (): Promise<Transporter> => {
  if (transporter) return transporter;

  try {
    // If explicit Ethereal credentials are provided in environment
    if (config.ethereal.user && config.ethereal.password) {
      console.log(`[SMTP] Using configured Ethereal account: ${config.ethereal.user}`);
      const t = nodemailer.createTransport({
        host: config.ethereal.host,
        port: config.ethereal.port,
        secure: config.ethereal.port === 465,
        auth: {
          user: config.ethereal.user,
          pass: config.ethereal.password,
        },
      });
      await t.verify();
      transporter = t;
      return transporter;
    }

    // Otherwise, generate a real disposable Ethereal test account on the fly
    console.log('[SMTP] Creating fresh disposable Ethereal test account...');
    const testAccount = await nodemailer.createTestAccount();
    console.log(`[SMTP] Generated test account: ${testAccount.user}`);

    const t = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    await t.verify();
    transporter = t;
    return transporter;
  } catch (err: any) {
    transporter = null;
    console.error('[SMTP Error]: Failed to create/verify SMTP transporter:', err.message);
    throw err;
  }
};

export interface SendEmailOptions {
  from?: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content?: string | Buffer;
    path?: string;
  }>;
}

export interface SendEmailResult {
  messageId: string;
  etherealPreviewUrl: string | false;
  response: string;
}

export const smtpService = {
  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    const transporter = await getTransporter();

    const mailOptions = {
      from: options.from || config.email.from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html || options.text,
      attachments: options.attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);

    console.log(`[SMTP] Sent email "${options.subject}" to ${options.to}`);
    if (previewUrl) {
      console.log(`[SMTP Preview URL]: ${previewUrl}`);
    }

    return {
      messageId: info.messageId,
      etherealPreviewUrl: previewUrl,
      response: info.response,
    };
  },

  async verifyConnection(): Promise<boolean> {
    try {
      const t = await getTransporter();
      await t.verify();
      return true;
    } catch {
      return false;
    }
  },
};
