import { EmailContent } from './email-content.interface';
import { renderLayout } from './layout';

export function welcomeTemplate(fullName: string): EmailContent {
  const content = `
    <h1 style="margin:0 0 12px;font-size:20px;font-weight:700;">Welcome, ${fullName}!</h1>
    <p style="margin:0 0 8px;">Your account is ready and your email has been verified.</p>
    <p style="margin:0;">You can now sign in and start exploring opportunities, managing your profile, and applying to jobs.</p>
  `;

  return {
    subject: 'Welcome to HR API',
    html: renderLayout({
      title: 'Welcome',
      preheader: 'Your account is ready.',
      content,
    }),
  };
}
