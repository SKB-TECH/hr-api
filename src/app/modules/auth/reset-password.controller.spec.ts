import { Test, TestingModule } from '@nestjs/testing';
import { ResetPasswordController } from './reset-password.controller';
import { AuthService } from './auth.service';

const mockAuthService = {
  forgotPassword: jest.fn(),
  forgotPasswordResendOtp: jest.fn(),
  forgotPasswordConfirmOtp: jest.fn(),
  resetPassword: jest.fn(),
};

const mobileReq = { headers: { 'x-client-type': 'mobile' } } as any;
const res = { cookie: jest.fn(), clearCookie: jest.fn() } as any;

describe('ResetPasswordController', () => {
  let controller: ResetPasswordController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResetPasswordController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<ResetPasswordController>(ResetPasswordController);
    jest.clearAllMocks();
  });

  it('should request a reset OTP', async () => {
    mockAuthService.forgotPassword.mockResolvedValue({ requestId: 'req-1' });

    const result: any = await controller.forgotPassword({
      email: 'john@example.com',
    });

    expect(result.statusCode).toBe(200);
    expect(mockAuthService.forgotPassword).toHaveBeenCalledWith(
      'john@example.com',
    );
  });

  it('should confirm the OTP and return a reset token', async () => {
    mockAuthService.forgotPasswordConfirmOtp.mockResolvedValue({
      resetToken: 'token',
    });

    const result: any = await controller.confirmOtp({
      requestId: 'req-1',
      otp: '123456',
    });

    expect(result.data.resetToken).toBe('token');
    expect(mockAuthService.forgotPasswordConfirmOtp).toHaveBeenCalledWith(
      'req-1',
      '123456',
    );
  });

  it('should reset the password and return tokens (mobile)', async () => {
    mockAuthService.resetPassword.mockResolvedValue({
      user: { email: 'john@example.com' },
      accessToken: 'access',
      refreshToken: 'refresh',
    });

    const result: any = await controller.resetPassword(
      mobileReq,
      res,
      'token',
      {
        newPassword: 'NewPass123',
        confirmPassword: 'NewPass123',
      },
    );

    expect(result.statusCode).toBe(200);
    expect(result.data.accessToken).toBe('access');
    expect(mockAuthService.resetPassword).toHaveBeenCalledWith(
      'token',
      'NewPass123',
      'NewPass123',
      'mobile',
    );
  });
});
