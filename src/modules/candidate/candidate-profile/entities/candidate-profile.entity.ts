import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, UserStatus, AuthProvider, Availability, WorkType, ProfileVisibility } from '@prisma/client';

class CandidateProfileDto {
  @ApiProperty({ 
    example: '3a122f42-ed14-4252-9e2a-e0f4a2577320',
    description: 'Unique identifier for the candidate profile',})
  id: string;

  @ApiPropertyOptional({ example: 'Male', description: 'Gender of the candidate' })
  gender: string | null;

  @ApiPropertyOptional({ example: '1998-04-23T00:00:00.000Z', description: 'Birth date of the candidate' })
  birthDate: Date | null;

  @ApiPropertyOptional({ example: 'Senior Full Stack Engineer', description: 'Professional headline for the candidate' })
  headline: string | null;

  @ApiPropertyOptional({ example: 'Passionate developer building scalable systems...', description: 'Brief bio or summary of the candidate' })
  bio: string | null;

  @ApiPropertyOptional({ example: 'Rwanda', description: 'Country where the candidate is located' })
  countryName: string | null;

  @ApiPropertyOptional({ example: 'Kigali', description: 'City where the candidate is located' })
  cityName: string | null;

  @ApiPropertyOptional({ example: 'KK 342 St', description: 'Address of the candidate' })
  address: string | null;

  @ApiPropertyOptional({ example: '2500.00', type: String, description: 'Current salary of the candidate' })
  currentSalary: any | null;

  @ApiPropertyOptional({ example: '4500.00', type: String, description: 'Expected salary of the candidate' })
  expectedSalary: any | null;

  @ApiPropertyOptional({ example: 'USD', description: 'Currency for the salary values' })
  salaryCurrency: string | null;

  @ApiPropertyOptional({ example: 5, description: 'Number of years of experience' })
  yearsExperience: number | null;

  @ApiPropertyOptional({ example: 'https://linkedin.com/in/username', description: 'LinkedIn profile URL' })
  linkedinUrl: string | null;

  @ApiPropertyOptional({ example: 'https://github.com/username', description: 'GitHub profile URL' })
  githubUrl: string | null;

  @ApiPropertyOptional({ example: 'https://portfolio.dev', description: 'Portfolio website URL' })
  portfolioUrl: string | null;

  @ApiPropertyOptional({ enum: Availability, example: Availability.immediate, description: 'Availability status of the candidate' })
  availability: Availability | null;

  @ApiPropertyOptional({ enum: WorkType, example: WorkType.hybrid, description: 'Preferred work type of the candidate' })
  workType: WorkType | null;

  @ApiProperty({ enum: ProfileVisibility, example: ProfileVisibility.public, description: 'Visibility level of the candidate profile' })
  profileVisibility: ProfileVisibility;

  @ApiProperty({ example: true , description: 'Indicates if the candidate is open to work opportunities' })
  openToWork: boolean;
}

export class UserCandidateDto {
  @ApiProperty({ example: '37abb433-eec5-423c-80b3-18fe9f29ffce' , description: 'Unique identifier for the user' })
  id: string;

  @ApiProperty({ example: 'manzp@gmail.com', description: 'Email address of the user' })
  email: string;

  @ApiProperty({ example: 'manzi', description: 'First name of the user' })
  fullName: string;


  @ApiPropertyOptional({ example: '+250788123456', description: 'Phone number of the user' })
  phoneNumber: string | null;

  @ApiProperty({ enum: UserRole, example: UserRole.CANDIDATE, description: 'Role of the user' })
  role: UserRole;

  @ApiProperty({ enum: UserStatus, example: UserStatus.active, description: 'Status of the user' })
  status: UserStatus;

  @ApiProperty({ enum: AuthProvider, example: AuthProvider.local, description: 'Authentication provider for the user' })
  provider: AuthProvider;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg', description: 'URL of the user\'s avatar' })
  avatar: string | null;

  @ApiProperty({ example: false, description: 'Indicates if the user\'s email is verified' })
  emailVerified: boolean;

  @ApiProperty({ example: '2026-05-30T10:43:04.686Z', description: 'Timestamp of when the user was created' })
  createdAt: Date;

  @ApiProperty({ example: '2026-05-30T10:43:04.686Z', description: 'Timestamp of when the user was last updated' })
  updatedAt: Date;

  @ApiProperty({ type: () => CandidateProfileDto, description: 'Candidate profile information' })
  candidateProfile: CandidateProfileDto | null;

  constructor(partial: Partial<UserCandidateDto>) {
    Object.assign(this, partial);
  }
}