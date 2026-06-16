import { EmailContent } from './email-content.interface';
import { renderLayout } from './layout';

export function passwordChangedTemplate(fullName: string): EmailContent {
  const content = `
    <h1 style="margin:0 0 12px;font-size:20px;font-weight:700;">Your password was changed</h1>
    <p style="margin:0 0 8px;">Hi ${fullName}, this is a confirmation that the password for your account was just changed.</p>
    <p style="margin:0;color:#7c8493;font-size:13px;">If this wasn't you, please reset your password immediately and contact support.</p>
  `;

  return {
    subject: 'Your password was changed',
    html: renderLayout({
      title: 'Password changed',
      preheader: 'Your account password was just changed.',
      content,
    }),
  };
}
