import nodemailer from 'nodemailer';
import { logError, logApp } from './loggerService.js';

const getTransporter = () => {
  const host = process.env.MAIL_HOST;
  const port = parseInt(process.env.MAIL_PORT || '587', 10);
  const secure = process.env.MAIL_SECURE === 'true';
  const user = process.env.MAIL_USERNAME;
  const pass = process.env.MAIL_PASSWORD;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
  });
};

export const sendMail = async ({ to, subject, html }) => {
  const transporter = getTransporter();
  const fromName = process.env.MAIL_FROM_NAME || 'CRDMS';
  const fromEmail = process.env.MAIL_FROM_EMAIL || 'no-reply@crdms.com';

  if (!transporter) {
    logApp(`[MailService] Mail configurations missing in environment. Email skipped: "${subject}" to <${to}>`);
    return { success: false, message: 'SMTP credentials not configured.' };
  }

  try {
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html
    });

    logApp(`[MailService] Email sent successfully: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logError(new Error(`Failed to send email to ${to}: ${error.message}`));
    return { success: false, error: error.message };
  }
};

// Reusable email template methods
export const sendWelcomeEmail = async (userEmail, username, role) => {
  const html = `
    <h1>Welcome to CRDMS</h1>
    <p>Hello @${username},</p>
    <p>Your production account has been created successfully with the role: <strong>${role}</strong>.</p>
    <p>Please log in using your registered credentials.</p>
    <br>
    <p>Best Regards,</p>
    <p>CRDMS Recruitment Team</p>
  `;
  return sendMail({ to: userEmail, subject: 'Welcome to CRDMS', html });
};

export const sendPasswordResetEmail = async (userEmail, username, resetLink) => {
  const html = `
    <h1>Password Reset Request</h1>
    <p>Hello @${username},</p>
    <p>We received a request to reset your password. Click the link below to set a new password:</p>
    <p><a href="${resetLink}" target="_blank">${resetLink}</a></p>
    <p>This link is valid for 1 hour.</p>
    <br>
    <p>Best Regards,</p>
    <p>CRDMS IT Support</p>
  `;
  return sendMail({ to: userEmail, subject: 'CRDMS Password Reset', html });
};

export const sendCandidateStatusUpdateEmail = async (userEmail, candidateName, newStatus) => {
  const html = `
    <h1>Candidate Status Update</h1>
    <p>Hello,</p>
    <p>The status of candidate <strong>${candidateName}</strong> has been updated to: <strong>${newStatus}</strong>.</p>
    <br>
    <p>Best Regards,</p>
    <p>CRDMS Automation</p>
  `;
  return sendMail({ to: userEmail, subject: `Status Update: ${candidateName} is now ${newStatus}`, html });
};

export const sendInterviewNotificationEmail = async (interviewerEmail, candidateName, interviewTime) => {
  const html = `
    <h1>Interview Scheduled Notification</h1>
    <p>Hello,</p>
    <p>You have been assigned to interview candidate <strong>${candidateName}</strong>.</p>
    <p><strong>Scheduled Time:</strong> ${interviewTime}</p>
    <br>
    <p>Best Regards,</p>
    <p>CRDMS Recruitment Team</p>
  `;
  return sendMail({ to: interviewerEmail, subject: `Interview Assigned: ${candidateName}`, html });
};

export const sendOfferLetterEmail = async (candidateEmail, candidateName, offerDetails) => {
  const html = `
    <h1>Offer Letter Dispatched</h1>
    <p>Hello <strong>${candidateName}</strong>,</p>
    <p>Congratulations! We are pleased to offer you a position. Please review the details below:</p>
    <p>${offerDetails}</p>
    <br>
    <p>Best Regards,</p>
    <p>CRDMS HR Team</p>
  `;
  return sendMail({ to: candidateEmail, subject: `Offer Letter: ${candidateName}`, html });
};

export const sendSystemAlertEmail = async (adminEmail, alertTitle, alertDetails) => {
  const html = `
    <h1 style="color: red;">CRDMS System Alert</h1>
    <p>An emergency system alert has been triggered:</p>
    <p><strong>Title:</strong> ${alertTitle}</p>
    <p><strong>Details:</strong> ${alertDetails}</p>
    <p>Please inspect logs immediately.</p>
    <br>
    <p>Best Regards,</p>
    <p>CRDMS Health Monitor</p>
  `;
  return sendMail({ to: adminEmail, subject: `[ALERT] ${alertTitle}`, html });
};

export default {
  sendMail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendCandidateStatusUpdateEmail,
  sendInterviewNotificationEmail,
  sendOfferLetterEmail,
  sendSystemAlertEmail
};
