import { EmailContent } from './email-content.interface';
import {
  escapeHtml,
  renderButton,
  renderHeading,
  renderLayout,
  renderWelcome,
} from './layout';

export function companyInvitationTemplate(
  companyName: string,
  inviterName: string,
  acceptUrl: string,
  logoUrl?: string,
): EmailContent {
  const content = `
    ${renderHeading(`Join ${companyName} Team`)}
    ${renderWelcome()}
    <p style="margin:0 0 18px;">Hello,</p>
    <p style="margin:0 0 18px;">${escapeHtml(inviterName)} invited you to join <strong>${escapeHtml(companyName)}</strong>. Click below to accept your invitation and get started.</p>
    <p style="margin:0 0 18px;">This link will expire in 7 days. If it expires before you join, request a new invitation from your administrator. If you were not expecting this invitation, you can safely ignore this email.</p>
    <p style="margin:0 0 8px;font-weight:700;">Thank you for choosing Fast2Hire!</p>
    ${renderButton('✓  Join', acceptUrl)}
  `;
  return {
    subject: `Invitation to join ${companyName}`,
    html: renderLayout({
      title: `Join ${companyName} Team`,
      preheader: `${inviterName} invited you to join ${companyName}.`,
      content,
      logoUrl,
    }),
  };
}
