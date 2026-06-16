import { Test, TestingModule } from '@nestjs/testing';
import { RegistrationController } from './registration.controller';
import { AuthService } from './auth.service';

const mockAuthService = {
  register: jest.fn(),
  verifyOtp: jest.fn(),
  resendOtp: jest.fn(),
  setupPassword: jest.fn(),
};

const mobileReq = { headers: { 'x-client-type': 'mobile' } } as any;
const res = { cookie: jest.fn(), clearCookie: jest.fn() } as any;

describe('RegistrationController', () => {
  let controller: RegistrationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RegistrationController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<RegistrationController>(RegistrationController);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should send the OTP and return a requestId', async () => {
      mockAuthService.register.mockResolvedValue({ requestId: 'req-1' });

      const dto = {
        fullName: 'John Doe',
        email: 'john@example.com',
        acceptTerms: true,
      };
      const result: any = await controller.register(dto);

      expect(result.statusCode).toBe(201);
      expect(result.data.requestId).toBe('req-1');
      expect(mockAuthService.register).toHaveBeenCalledWith(dto);
    });
  });

  describe('verifyOtp', () => {
    it('should verify the OTP and return tokens (mobile)', async () => {
      mockAuthService.verifyOtp.mockResolvedValue({
        user: { email: 'john@example.com' },
        accessToken: 'access',
        refreshToken: 'refresh',
      });

      const dto = { requestId: 'req-1', otp: '123456' };
      const result: any = await controller.verifyOtp(mobileReq, res, dto);

      expect(result.statusCode).toBe(200);
      expect(result.data.accessToken).toBe('access');
      expect(mockAuthService.verifyOtp).toHaveBeenCalledWith(dto, 'mobile');
    });
  });

  describe('setupPassword', () => {
    it('should activate the account', async () => {
      mockAuthService.setupPassword.mockResolvedValue({
        user: { email: 'john@example.com' },
      });

      const result: any = await controller.setupPassword(
        { id: 'uuid-user-1' },
        { password: 'Password123', confirmPassword: 'Password123' },
      );

      expect(result.statusCode).toBe(200);
      expect(mockAuthService.setupPassword).toHaveBeenCalledWith(
        'uuid-user-1',
        expect.any(Object),
      );
    });
  });
});
