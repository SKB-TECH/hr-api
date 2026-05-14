import { Injectable, NotFoundException } from '@nestjs/common';
import { JobsRepository } from '../repositories/jobs.repository';
import { CreateJobDto } from '../dto/create-job.dto';
import { UpdateJobDto } from '../dto/update-job.dto';
import { QueryJobDto } from '../dto/query-job.dto';
import { CloudinaryService } from '../../../infrastructure/cloudinary/cloudinary.service';
import slugify from 'slugify';
import { Prisma } from '@prisma/client';
import { createPaginatedResult } from '../../../common/utils/pagination.util';

@Injectable()
export class JobsService {
  constructor(
    private jobsRepository: JobsRepository,
    private cloudinaryService: CloudinaryService,
  ) {}

  private generateSlug(title: string): string {
    return slugify(title, { lower: true, strict: true }) + '-' + Math.random().toString(36).substring(2, 8);
  }

  async create(createJobDto: CreateJobDto, file?: Express.Multer.File) {
    let heroBackgroundImage = null;

    if (file) {
      const uploadResult = await this.cloudinaryService.uploadImage(file);
      heroBackgroundImage = uploadResult.secure_url;
    }

    const { file: _, ...jobData } = createJobDto;
    
    const data: Prisma.JobCreateInput = {
      ...jobData,
      slug: this.generateSlug(createJobDto.title),
      heroBackgroundImage,
      salaryMin: createJobDto.salaryMin ? Number(createJobDto.salaryMin) : null,
      salaryMax: createJobDto.salaryMax ? Number(createJobDto.salaryMax) : null,
      isPublished: createJobDto.isPublished !== undefined ? Boolean(createJobDto.isPublished) : true,
    };

    return this.jobsRepository.create(data);
  }

  async findAll(query: QueryJobDto) {
    const { page = 1, limit = 10, search, location, employmentType, experienceLevel, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.JobWhereInput = {
      isPublished: true,
      ...(location && { location: { contains: location, mode: 'insensitive' } }),
      ...(employmentType && { employmentType }),
      ...(experienceLevel && { experienceLevel }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const orderBy = { [sortBy]: sortOrder };

    const [jobs, totalItems] = await this.jobsRepository.findAll({ skip, take: limit, where, orderBy });

    return createPaginatedResult(jobs, totalItems, page, limit);
  }

  async findOne(id: string) {
    const job = await this.jobsRepository.findOne({ id });
    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }
    return job;
  }

  async findBySlug(slug: string) {
    const job = await this.jobsRepository.findOne({ slug });
    if (!job) {
      throw new NotFoundException(`Job with slug ${slug} not found`);
    }
    return job;
  }

  async update(id: string, updateJobDto: UpdateJobDto, file?: Express.Multer.File) {
    const existingJob = await this.findOne(id);
    let heroBackgroundImage = existingJob.heroBackgroundImage;

    if (file) {
      const uploadResult = await this.cloudinaryService.uploadImage(file);
      heroBackgroundImage = uploadResult.secure_url;
    }

    const { file: _, ...jobData } = updateJobDto;

    const data: Prisma.JobUpdateInput = {
      ...jobData,
      heroBackgroundImage,
    };

    if (updateJobDto.title && updateJobDto.title !== existingJob.title) {
      data.slug = this.generateSlug(updateJobDto.title);
    }
    if (updateJobDto.salaryMin !== undefined) data.salaryMin = Number(updateJobDto.salaryMin);
    if (updateJobDto.salaryMax !== undefined) data.salaryMax = Number(updateJobDto.salaryMax);
    if (updateJobDto.isPublished !== undefined) data.isPublished = Boolean(updateJobDto.isPublished);

    return this.jobsRepository.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.jobsRepository.remove({ id });
  }
}
