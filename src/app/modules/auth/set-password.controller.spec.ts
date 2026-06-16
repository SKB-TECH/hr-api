import { Test, TestingModule } from '@nestjs/testing';
import { SetPasswordController } from './set-password.controller';
import { AuthService } from './auth.service';

const mockAuthService = {
  setPasswordVerify: jest.fn(),
  setPasswordConfirmOtp: jest.fn(),
  setNewPassword: jest.fn(),
};

describe('SetPasswordController', () => {
  let controller: SetPasswordController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SetPasswordController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<SetPasswordController>(SetPasswordController);
    jest.clearAllMocks();
  });

  it('should verify the current password and send an OTP', async () => {
    mockAuthService.setPasswordVerify.mockResolvedValue({ requestId: 'req-1' });

    const result: any = await controller.verify(
      { id: 'uuid-user-1' },
      { currentPassword: 'current123' },
    );

    expect(result.statusCode).toBe(200);
    expect(mockAuthService.setPasswordVerify).toHaveBeenCalledWith(
      'uuid-user-1',
      'current123',
    );
  });

  it('should confirm the OTP and return a reset token', async () => {
    mockAuthService.setPasswordConfirmOtp.mockResolvedValue({
      resetToken: 'token',
    });

    const result: any = await controller.confirmOtp(
      { id: 'uuid-user-1' },
      { requestId: 'req-1', otp: '123456' },
    );

    expect(result.data.resetToken).toBe('token');
    expect(mockAuthService.setPasswordConfirmOtp).toHaveBeenCalledWith(
      'uuid-user-1',
      'req-1',
      '123456',
    );
  });

  it('should set the new password', async () => {
    mockAuthService.setNewPassword.mockResolvedValue({ message: 'ok' });

    const result: any = await controller.setPassword(
      { id: 'uuid-user-1' },
      'reset-token',
      { newPassword: 'NewPass123', confirmPassword: 'NewPass123' },
    );

    expect(result.statusCode).toBe(200);
    expect(mockAuthService.setNewPassword).toHaveBeenCalledWith(
      'uuid-user-1',
      'reset-token',
      'NewPass123',
      'NewPass123',
    );
  });
});
