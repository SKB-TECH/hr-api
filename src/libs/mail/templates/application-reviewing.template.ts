import { EmailContent } from './email-content.interface';
import {
  escapeHtml,
  renderHeading,
  renderLayout,
  renderWelcome,
} from './layout';

export function applicationReviewingTemplate(
  fullName: string,
  logoUrl?: string,
): EmailContent {
  const content = `
    ${renderHeading('Our team is reviewing your application')}
    ${renderWelcome()}
    <p style="margin:0 0 20px;">Hello, ${escapeHtml(fullName)}</p>
    <p style="margin:0 0 22px;">Our team is reviewing your application and will get back to you shortly. In the meantime, feel free to explore our platform for more job openings and resources that can help you in your career journey.</p>
    <p style="margin:0;font-weight:700;">Thank you for choosing Fast2Hire!</p>
  `;
  return {
    subject: 'Your application is being reviewed',
    html: renderLayout({
      title: 'Your application is being reviewed',
      preheader: 'Our team is reviewing your application.',
      content,
      logoUrl,
    }),
  };
}
