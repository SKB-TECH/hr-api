import { EmailContent } from './email-content.interface';
import {
  escapeHtml,
  renderHeading,
  renderLayout,
  renderWelcome,
} from './layout';

export function welcomeTemplate(
  fullName: string,
  logoUrl?: string,
): EmailContent {
  const content = `
    ${renderHeading(`Welcome, ${fullName}!`)}
    ${renderWelcome()}
    <p style="margin:0 0 8px;">Hello, ${escapeHtml(fullName)}</p>
    <p style="margin:0 0 8px;">Your account is ready and your email has been verified.</p>
    <p style="margin:0;">You can now sign in and start exploring opportunities, managing your profile, and applying to jobs.</p>
  `;

  return {
    subject: 'Welcome to Fast2Hire',
    html: renderLayout({
      title: 'Welcome',
      preheader: 'Your account is ready.',
      content,
      logoUrl,
    }),
  };
}
