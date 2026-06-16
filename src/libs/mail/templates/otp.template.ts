import { EmailContent } from './email-content.interface';
import { renderCode, renderLayout } from './layout';

export function otpTemplate(otp: string): EmailContent {
  const content = `
    <h1 style="margin:0 0 12px;font-size:20px;font-weight:700;">Verify your email</h1>
    <p style="margin:0 0 8px;">Use the verification code below to continue creating your account. This code expires in <strong>10 minutes</strong>.</p>
    ${renderCode(otp)}
    <p style="margin:0;color:#7c8493;font-size:13px;">Never share this code with anyone. HR API staff will never ask you for it.</p>
  `;

  return {
    subject: 'Your verification code',
    html: renderLayout({
      title: 'Verify your email',
      preheader: `Your verification code is ${otp}`,
      content,
    }),
  };
}
