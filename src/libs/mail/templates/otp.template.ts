import { EmailContent } from './email-content.interface';
import {
  renderCode,
  renderHeading,
  renderLayout,
  renderWelcome,
} from './layout';

export function otpTemplate(otp: string, logoUrl?: string): EmailContent {
  const content = `
    ${renderHeading('Verify your email')}
    ${renderWelcome()}
    <p style="margin:0 0 8px;">Use the verification code below to continue creating your account. This code expires in <strong>10 minutes</strong>.</p>
    ${renderCode(otp)}
    <p style="margin:0;color:#777777;font-size:13px;">Never share this code with anyone. Fast2Hire staff will never ask you for it.</p>
  `;

  return {
    subject: 'Your verification code',
    html: renderLayout({
      title: 'Verify your email',
      preheader: `Your verification code is ${otp}`,
      content,
      logoUrl,
    }),
  };
}
