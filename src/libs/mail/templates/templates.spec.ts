import { otpTemplate } from './otp.template';
import { welcomeTemplate } from './welcome.template';
import { passwordResetTemplate } from './password-reset.template';
import { passwordChangedTemplate } from './password-changed.template';

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
});
