import { otpTemplate } from './otp.template';
import { welcomeTemplate } from './welcome.template';
import { passwordResetTemplate } from './password-reset.template';
import { passwordChangedTemplate } from './password-changed.template';
import { companyInvitationTemplate } from './company-invitation.template';
import { applicationReviewingTemplate } from './application-reviewing.template';

describe('email templates', () => {
  it('otpTemplate embeds the code and a subject', () => {
    const { subject, html } = otpTemplate('123456');
    expect(subject).toBe('Your verification code');
    expect(html).toContain('123456');
    expect(html).toContain('<!DOCTYPE html>');
  });

  it('welcomeTemplate embeds the name', () => {
    const { subject, html } = welcomeTemplate('Jane Doe');
    expect(subject).toContain('Welcome');
    expect(html).toContain('Jane Doe');
  });

  it('passwordResetTemplate embeds the code', () => {
    const { subject, html } = passwordResetTemplate('654321');
    expect(subject).toBe('Reset your password');
    expect(html).toContain('654321');
  });

  it('passwordChangedTemplate embeds the name', () => {
    const { html } = passwordChangedTemplate('Jane Doe');
    expect(html).toContain('Jane Doe');
    expect(html).toContain('changed');
  });

  it('uses the Fast2Hire visual identity and public logo', () => {
    const { html } = otpTemplate('123456', 'https://app.test/logo/lgo.png');
    expect(html).toContain('Fast2Hire');
    expect(html).toContain('https://app.test/logo/lgo.png');
    expect(html).not.toContain('HR API');
  });

  it('companyInvitationTemplate renders a safe invitation button', () => {
    const { html } = companyInvitationTemplate(
      'RMT-Labs',
      '<Admin>',
      'https://app.test/invite?token=abc&source=email',
    );
    expect(html).toContain('Join RMT-Labs Team');
    expect(html).toContain('&lt;Admin&gt;');
    expect(html).toContain('token=abc&amp;source=email');
  });

  it('applicationReviewingTemplate matches the application notification', () => {
    const { subject, html } = applicationReviewingTemplate('Jane Doe');
    expect(subject).toContain('reviewed');
    expect(html).toContain('Our team is reviewing your application');
    expect(html).toContain('Jane Doe');
  });
});
