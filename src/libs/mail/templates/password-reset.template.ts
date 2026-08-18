import { EmailContent } from './email-content.interface';
import {
  renderCode,
  renderHeading,
  renderLayout,
  renderWelcome,
} from './layout';

export function passwordResetTemplate(
  otp: string,
  logoUrl?: string,
): EmailContent {
  const content = `
    ${renderHeading('Reset your password')}
    ${renderWelcome()}
    <p style="margin:0 0 8px;">We received a request to reset your password. Use the code below to continue. This code expires in <strong>10 minutes</strong>.</p>
    ${renderCode(otp)}
    <p style="margin:0;color:#7c8493;font-size:13px;">If you did not request a password reset, you can safely ignore this email and your password will stay the same.</p>
  `;

  return {
    subject: 'Reset your password',
    html: renderLayout({
      title: 'Reset your password',
      preheader: `Your password reset code is ${otp}`,
      content,
      logoUrl,
    }),
  };
}
