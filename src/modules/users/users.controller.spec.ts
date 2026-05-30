import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

const mockUsersService = {
  updateEmail: jest.fn(),
  updatePassword: jest.fn(),
  closeAccount: jest.fn(),
};

const mockUser = { id: 'uuid-user-1', email: 'jake@example.com', role: 'CANDIDATE' };

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    jest.clearAllMocks();
  });

  describe('updateEmail', () => {
    it('should call usersService.updateEmail and return updated user', async () => {
      mockUsersService.updateEmail.mockResolvedValue({ ...mockUser, email: 'new@example.com' });

      const result = await controller.updateEmail(mockUser, { email: 'new@example.com' });

      expect(result.email).toBe('new@example.com');
      expect(mockUsersService.updateEmail).toHaveBeenCalledWith('uuid-user-1', { email: 'new@example.com' });
    });
  });

  describe('updatePassword', () => {
    it('should call usersService.updatePassword and return success', async () => {
      mockUsersService.updatePassword.mockResolvedValue({ success: true });

      const result = await controller.updatePassword(mockUser, {
        oldPassword: 'oldpassword123',
        newPassword: 'newpassword123',
      });

      expect(result).toEqual({ success: true });
      expect(mockUsersService.updatePassword).toHaveBeenCalledWith('uuid-user-1', {
        oldPassword: 'oldpassword123',
        newPassword: 'newpassword123',
      });
    });
  });

  describe('closeAccount', () => {
    it('should call usersService.closeAccount and return success', async () => {
      mockUsersService.closeAccount.mockResolvedValue({ success: true });

      const result = await controller.closeAccount(mockUser);

      expect(result).toEqual({ success: true });
      expect(mockUsersService.closeAccount).toHaveBeenCalledWith('uuid-user-1');
    });
  });
});
