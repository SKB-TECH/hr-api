import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AboutService } from './about.service';
import { AboutRepository } from './repositories/about.repository';

const mockHero = {
  id: 'uuid-hero',
  title: 'We are here to support your career.',
  subtitle: 'We help thousands of candidates.',
  imageUrl: 'http://localhost:3000/files/hero.jpg',
  updatedAt: new Date(),
};

const mockCeo = {
  id: 'uuid-ceo',
  name: 'Lara Binney',
  jobTitle: 'Chief Executive Officer',
  imageUrl: 'http://localhost:3000/files/ceo.jpg',
  message: 'Lorem ipsum',
  updatedAt: new Date(),
};

const mockMember = {
  id: 'uuid-member-1',
  name: 'Emil Yancy',
  role: 'Team Leader',
  imageUrl: 'http://localhost:3000/files/emil.jpg',
  order: 1,
  createdAt: new Date(),
};

const mockContact = {
  id: 'uuid-contact-1',
  fullName: 'Jane Doe',
  email: 'jane@example.com',
  contactNumber: '+250788123456',
  isRead: false,
  createdAt: new Date(),
};

const mockAboutRepository = {
  findHero: jest.fn(),
  upsertHero: jest.fn(),
  findCeo: jest.fn(),
  upsertCeo: jest.fn(),
  findAllTeam: jest.fn(),
  findTeamMemberById: jest.fn(),
  createTeamMember: jest.fn(),
  updateTeamMember: jest.fn(),
  deleteTeamMember: jest.fn(),
  saveContact: jest.fn(),
};

describe('AboutService', () => {
  let service: AboutService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AboutService,
        { provide: AboutRepository, useValue: mockAboutRepository },
      ],
    }).compile();

    service = module.get<AboutService>(AboutService);
    jest.clearAllMocks();
  });

  // ── HERO ────────────────────────────────────────────────────────────────

  describe('getHero', () => {
    it('should return hero when it exists', async () => {
      mockAboutRepository.findHero.mockResolvedValue(mockHero);
      const result = await service.getHero();
      expect(result).toEqual(mockHero);
      expect(mockAboutRepository.findHero).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when hero does not exist', async () => {
      mockAboutRepository.findHero.mockResolvedValue(null);
      await expect(service.getHero()).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateHero', () => {
    it('should call upsertHero with dto and return result', async () => {
      const dto = { title: 'New title' };
      mockAboutRepository.upsertHero.mockResolvedValue({ ...mockHero, ...dto });
      const result = await service.updateHero(dto);
      expect(result.title).toBe('New title');
      expect(mockAboutRepository.upsertHero).toHaveBeenCalledWith(dto);
    });
  });

  // ── CEO ─────────────────────────────────────────────────────────────────

  describe('getCeo', () => {
    it('should return ceo when it exists', async () => {
      mockAboutRepository.findCeo.mockResolvedValue(mockCeo);
      const result = await service.getCeo();
      expect(result).toEqual(mockCeo);
    });

    it('should throw NotFoundException when ceo does not exist', async () => {
      mockAboutRepository.findCeo.mockResolvedValue(null);
      await expect(service.getCeo()).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateCeo', () => {
    it('should call upsertCeo with dto and return result', async () => {
      const dto = { name: 'New Name' };
      mockAboutRepository.upsertCeo.mockResolvedValue({ ...mockCeo, ...dto });
      const result = await service.updateCeo(dto);
      expect(result.name).toBe('New Name');
      expect(mockAboutRepository.upsertCeo).toHaveBeenCalledWith(dto);
    });
  });

  // ── TEAM ────────────────────────────────────────────────────────────────

  describe('getTeam', () => {
    it('should return array of team members', async () => {
      mockAboutRepository.findAllTeam.mockResolvedValue([mockMember]);
      const result = await service.getTeam();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Emil Yancy');
    });

    it('should return empty array when no members exist', async () => {
      mockAboutRepository.findAllTeam.mockResolvedValue([]);
      const result = await service.getTeam();
      expect(result).toEqual([]);
    });
  });

  describe('createTeamMember', () => {
    it('should create and return a team member', async () => {
      const dto = { name: 'Emil Yancy', role: 'Team Leader', order: 1 };
      mockAboutRepository.createTeamMember.mockResolvedValue(mockMember);
      const result = await service.createTeamMember(dto);
      expect(result).toEqual(mockMember);
      expect(mockAboutRepository.createTeamMember).toHaveBeenCalledWith(dto);
    });
  });

  describe('updateTeamMember', () => {
    it('should update and return the team member', async () => {
      const dto = { role: 'Senior Recruiter' };
      mockAboutRepository.updateTeamMember.mockResolvedValue({ ...mockMember, ...dto });
      const result = await service.updateTeamMember('uuid-member-1', dto);
      expect(result.role).toBe('Senior Recruiter');
      expect(mockAboutRepository.updateTeamMember).toHaveBeenCalledWith('uuid-member-1', dto);
    });
  });

  describe('deleteTeamMember', () => {
    it('should call deleteTeamMember with correct id', async () => {
      mockAboutRepository.deleteTeamMember.mockResolvedValue(undefined);
      await service.deleteTeamMember('uuid-member-1');
      expect(mockAboutRepository.deleteTeamMember).toHaveBeenCalledWith('uuid-member-1');
    });
  });

  // ── CONTACT ─────────────────────────────────────────────────────────────

  describe('submitContact', () => {
    it('should save and return contact submission', async () => {
      const dto = {
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        contactNumber: '+250788123456',
      };
      mockAboutRepository.saveContact.mockResolvedValue(mockContact);
      const result = await service.submitContact(dto);
      expect(result).toEqual(mockContact);
      expect(mockAboutRepository.saveContact).toHaveBeenCalledWith(dto);
    });
  });
});
