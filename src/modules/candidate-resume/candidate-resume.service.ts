import { Injectable ,BadRequestException,ForbiddenException,InternalServerErrorException} from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { CloudinaryService } from '@/infrastructure/cloudinary/cloudinary.service';
import { NotFoundException } from '@nestjs/common';
import { CandidateProfilesService } from '../candidate-profile/candidate-profile.service';
import { CandidateProfilesRepository } from './candidate-resume.repository';
import { validate as isUuid } from 'uuid';





// resume service
@Injectable()
export class CandidateResumeService {
  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
    // private candidateProfileService: CandidateProfilesService,
    private candidateProfileRepository: CandidateProfilesRepository,
  ) {}

// private logDebug(label: string, data: any) {
//   console.log(`[DEBUG - ${label}]:`, JSON.stringify(data, null, 2));
// }

// service method to upload a resume file, store it in cloudinary
async uploadResume(file: any, userId: string, title: string) {
  // 1. Fetch the correct CandidateProfile ID using the repository
  const candidateId = await this.candidateProfileRepository.getCandidateProfileId(userId);

  if (!candidateId) {
    throw new BadRequestException('Candidate profile not found for this user');
  }

  //  Upload file to Cloudinary
  let uploadResult;
  try {
    uploadResult = await this.cloudinary.uploadFile(file, 'resumes');
  } catch (error) {
    throw new InternalServerErrorException('File upload service failed');
  }

  /*
   transactional logic:
   - Check if there's an existing default resume for the candidate
   - Create new resume record in DB with isDefault = true if no existing default, otherwise false
   - If any step fails, rollback the transaction and delete the uploaded file from Cloudinary to prevent orphaned files
  */
  try {
    return await this.prisma.$transaction(async (tx) => {
      // Determine if this is the first resume (default)
      const existingDefault = await tx.resume.findFirst({
        where: { candidateId, isDefault: true },
      });

      const dataToCreate = {
        candidateId,
        title,
        fileUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        isDefault: !existingDefault, // Auto-set true if no other resume exists
      };

      const newResume = await tx.resume.create({ data: dataToCreate });

    
      return {
        id: newResume.id,
        candidateId: newResume.candidateId,
        title: newResume.title,
        fileUrl: newResume.fileUrl,
        isDefault: newResume.isDefault,
        createdAt: newResume.createdAt,
      };
    });
  } catch (error) {
    // Rollback logic: Clean up Cloudinary if DB fails
    if (uploadResult?.public_id) {
      await this.cloudinary.deleteFile(uploadResult.public_id, true);
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new InternalServerErrorException(`Failed to process resume: ${errorMessage}`);
  }
}

  async getAll(userId: string) {
    if(!isUuid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }
    const candidateId = await this.candidateProfileRepository.getCandidateProfileId(userId);
    return this.prisma.resume.findMany({
      where: { candidateId },
    });
  }

// service method to set a resume as default for a candidate, ensuring only one default resume per candidate
async setDefault(resumeId: string, userId: string) {
  if(!isUuid(userId)) {
    throw new BadRequestException('Invalid user ID format');
  }
  const candidateId = await this.candidateProfileRepository.getCandidateProfileId(userId);
  const currentDefault = await this.prisma.resume.findFirst({
    where: { candidateId, isDefault: true },
  });
   // If the current default resume is the same as the one being set, do nothing
  if (currentDefault && currentDefault.id === resumeId) {
    return currentDefault;
  }
  //
  return this.prisma.$transaction(async (tx) => {
    if (currentDefault && currentDefault.id !== resumeId) {
      await tx.resume.update({
        where: { id: currentDefault.id },
        data: { isDefault: false },
      });
    }

    return tx.resume.update({
      where: { id: resumeId },
      data: { isDefault: true },
    });
  });
}

// service method to get the default resume for a candidate
async getDefault(userId: string) {
  if(!isUuid(userId)) {
    throw new BadRequestException('Invalid user ID format');
  }
  const candidateId = await this.candidateProfileRepository .getCandidateProfileId(userId);
  return this.prisma.resume.findFirst({
    where: { candidateId, isDefault: true },
  });
}

async getPublicDefault(candidateId: string) {
  if (!isUuid(candidateId)) {
    throw new BadRequestException('Invalid candidate ID');
  }

  const candidateExists = await this.prisma.candidateProfile.count({
    where: { id: candidateId },
  });

  if (!candidateExists) {
    throw new NotFoundException('Candidate does not exist');
  }

  const resume = await this.prisma.resume.findFirst({
    where: {
      candidateId,
      isDefault: true,
    },
  });

  if (!resume) {
    throw new NotFoundException('Default resume not found');
  }

  return resume;
}


  // service method to delete a resume, including the file from cloudinary
async deleteResume(id: string, userId: string) {
  if (!isUuid(id)) {
    throw new BadRequestException('Invalid resume ID format');
  }
  if(!isUuid(userId)) {
    throw new BadRequestException('Invalid user ID format');
  }
  const resume = await this.prisma.resume.findUnique({
    where: { id },
  });

  if (!resume) {
    throw new NotFoundException('Resume not found');
  }
  const candidateId = await this.candidateProfileRepository.getCandidateProfileId(userId);
  if (resume.candidateId !== candidateId) {
    throw new ForbiddenException('You do not own this resume');
}

  return this.prisma.$transaction(async (tx) => {

    // deleting default resume → assign new default
    if (resume.isDefault) {
      const nextResume = await tx.resume.findFirst({
        where: {
          candidateId: resume.candidateId,
          NOT: { id },
        },
      });

      if (nextResume) {
        await tx.resume.update({
          where: { id: nextResume.id },
          data: { isDefault: true },
        });
      }
    }

    // 2. Delete from Cloudinary
    await this.cloudinary.deleteFile(resume.publicId, true);

    // 3. Delete from DB
    return tx.resume.delete({
      where: { id },
    });
  });
}

}