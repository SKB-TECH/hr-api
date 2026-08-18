import { EmailContent } from './email-content.interface';
import {
  escapeHtml,
  renderHeading,
  renderLayout,
  renderWelcome,
} from './layout';

export function passwordChangedTemplate(
  fullName: string,
  logoUrl?: string,
): EmailContent {
  const content = `
    ${renderHeading('Your password was changed')}
    ${renderWelcome()}
    <p style="margin:0 0 8px;">Hello, ${escapeHtml(fullName)}</p>
    <p style="margin:0 0 8px;">This is a confirmation that the password for your account was just changed.</p>
    <p style="margin:0;color:#7c8493;font-size:13px;">If this wasn't you, please reset your password immediately and contact support.</p>
  `;

  return {
    subject: 'Your password was changed',
    html: renderLayout({
      title: 'Password changed',
      preheader: 'Your account password was just changed.',
      content,
      logoUrl,
    }),
  };
}
