import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, UserStatus, AuthProvider, Availability, WorkType, ProfileVisibility } from '@prisma/client';

// This represents the structure of the Candidate Profile child object
class CandidateProfileEntity {
  @ApiProperty({ example: '3a122f42-ed14-4252-9e2a-e0f4a2577320' })
  id: string;

  @ApiPropertyOptional({ example: 'Male' })
  gender: string | null;

  @ApiPropertyOptional({ example: '1998-04-23T00:00:00.000Z' })
  birthDate: Date | null;

  @ApiPropertyOptional({ example: 'Senior Full Stack Engineer' })
  headline: string | null;

  @ApiPropertyOptional({ example: 'Passionate developer building scalable systems...' })
  bio: string | null;

  @ApiPropertyOptional({ example: 'Rwanda' })
  countryName: string | null;

  @ApiPropertyOptional({ example: 'Kigali' })
  cityName: string | null;

  @ApiPropertyOptional({ example: 'KK 342 St' })
  address: string | null;

  @ApiPropertyOptional({ example: '2500.00', type: String })
  currentSalary: any | null; // Prisma Decimal returns as a string or object

  @ApiPropertyOptional({ example: '4500.00', type: String })
  expectedSalary: any | null;

  @ApiPropertyOptional({ example: 'USD' })
  salaryCurrency: string | null;

  @ApiPropertyOptional({ example: 5 })
  yearsExperience: number | null;

  @ApiPropertyOptional({ example: 'https://linkedin.com/in/username' })
  linkedinUrl: string | null;

  @ApiPropertyOptional({ example: 'https://github.com/username' })
  githubUrl: string | null;

  @ApiPropertyOptional({ example: 'https://portfolio.dev' })
  portfolioUrl: string | null;

  @ApiPropertyOptional({ enum: Availability, example: Availability.immediate })
  availability: Availability | null;

  @ApiPropertyOptional({ enum: WorkType, example: WorkType.hybrid })
  workType: WorkType | null;

  @ApiProperty({ enum: ProfileVisibility, example: ProfileVisibility.public })
  profileVisibility: ProfileVisibility;

  @ApiProperty({ example: true })
  openToWork: boolean;
}

export class UserCandidateEntity {
  @ApiProperty({ example: '37abb433-eec5-423c-80b3-18fe9f29ffce' })
  id: string;

  @ApiProperty({ example: 'manzp@gmail.com' })
  email: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ enum: UserRole, example: UserRole.CANDIDATE })
  role: UserRole;

  @ApiProperty({ enum: UserStatus, example: UserStatus.active })
  status: UserStatus;

  @ApiProperty({ enum: AuthProvider, example: AuthProvider.local })
  provider: AuthProvider;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  avatar: string | null;

  @ApiProperty({ example: false })
  emailVerified: boolean;

  @ApiProperty({ example: '2026-05-30T10:43:04.686Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-05-30T10:43:04.686Z' })
  updatedAt: Date;

  @ApiProperty({ type: () => CandidateProfileEntity })
  candidateProfile: CandidateProfileEntity | null;

  constructor(partial: Partial<UserCandidateEntity>) {
    Object.assign(this, partial);
  }
}