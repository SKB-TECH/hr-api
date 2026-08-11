import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Application } from './entities/application.entity';
import { ApplicationStageHistory } from './entities/application-stage-history.entity';
import { Job } from '../jobs/entities/job.entity';
import { PipelineStage } from '../pipeline-stages/entities/pipeline-stage.entity';
import { CreateApplicationDto } from './dto/create-application.dto';
import { QueryApplicationDto } from './dto/query-application.dto';
import { UpdateApplicationStageDto } from './dto/update-application-stage.dto';
import { UpdateApplicationScoreDto } from './dto/update-application-score.dto';
import { CompanyMember } from '../companies/entities/company-member.entity';
import {
  PaginationDto,
  createPaginatedResult,
  paginate,
} from '../../../helpers/pagination';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
    @InjectRepository(ApplicationStageHistory)
    private readonly stageHistoryRepo: Repository<ApplicationStageHistory>,
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
    @InjectRepository(PipelineStage)
    private readonly pipelineStageRepo: Repository<PipelineStage>,
    @InjectRepository(CompanyMember)
    private readonly companyMemberRepo: Repository<CompanyMember>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateApplicationDto, candidateId: string) {
    const job = await this.jobRepo.findOne({
      where: { id: dto.jobId },
      relations: { company: { pipelineStages: true } },
    });

    if (!job) throw new NotFoundException('Job not found');

    const existing = await this.applicationRepo.findOne({
      where: { jobId: dto.jobId, candidateId },
    });

    if (existing)
      throw new ConflictException('You have already applied to this job');

    const stages = (job.company?.pipelineStages || [])
      .slice()
      .sort((a, b) => a.order - b.order);
    const initialStageId = stages[0]?.id || null;

    const application = this.applicationRepo.create({
      ...dto,
      candidateId,
      stageId: initialStageId,
    });
    const saved = await this.applicationRepo.save(application);

    await this.jobRepo.increment({ id: dto.jobId }, 'applicationsCount', 1);

    return saved;
  }

  async findMyApplications(candidateId: string, query: QueryApplicationDto) {
    const { stageId, page = 1, limit = 10 } = query as any;
    const skip = (page - 1) * limit;

    const where: any = {
      candidateId,
      ...(stageId && { stageId }),
    };

    const [data, total] = await this.applicationRepo.findAndCount({
      where,
      skip,
      take: limit,
      order: { appliedAt: 'DESC' },
      relations: { stage: true, job: { company: true } },
    });

    return createPaginatedResult(data, total, page, limit);
  }

  async getMyStats(candidateId: string) {
    const total = await this.applicationRepo.count({ where: { candidateId } });

    const interviewed = await this.applicationRepo
      .createQueryBuilder('a')
      .leftJoin('a.stage', 's')
      .where('a.candidateId = :candidateId', { candidateId })
      .andWhere('s.name ILIKE :name', { name: '%Interview%' })
      .getCount();

    const recent = await this.applicationRepo.find({
      where: { candidateId },
      order: { appliedAt: 'DESC' },
      take: 3,
      relations: { stage: true, job: { company: true } },
    });

    const stageCounts = await this.applicationRepo
      .createQueryBuilder('a')
      .select('a.stageId', 'stageId')
      .addSelect('COUNT(*)', 'count')
      .where('a.candidateId = :candidateId', { candidateId })
      .groupBy('a.stageId')
      .getRawMany<{ stageId: string | null; count: string }>();

    const stageIds = stageCounts
      .map((s) => s.stageId)
      .filter((id) => id !== null) as string[];
    const stages = stageIds.length
      ? await this.pipelineStageRepo.find({ where: { id: In(stageIds) } })
      : [];

    return {
      totalApplied: total,
      interviewed,
      statusBreakdown: stageCounts.map((s) => {
        const foundStage = stages.find((st) => st.id === s.stageId);
        return {
          stageId: s.stageId,
          stageName: foundStage?.name || 'Unassigned',
          count: Number(s.count),
        };
      }),
      recentApplications: recent,
    };
  }

  async findByJob(
    jobId: string,
    query: QueryApplicationDto,
    recruiterId: string,
  ) {
    await this.assertJobAccess(jobId, recruiterId);
    const { stageId, search, page = 1, limit = 10 } = query as any;

    const qb = this.applicationRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.stage', 'stage')
      .leftJoinAndSelect('a.job', 'job')
      .leftJoinAndSelect('a.candidate', 'candidate')
      .leftJoinAndSelect('candidate.candidateProfile', 'candidateProfile')
      .where('a.jobId = :jobId', { jobId });

    if (stageId) qb.andWhere('a.stageId = :stageId', { stageId });
    if (search)
      qb.andWhere('a.fullName ILIKE :search', { search: `%${search}%` });

    qb.orderBy('a.appliedAt', 'DESC');

    return paginate(qb, { page, limit } as PaginationDto);
  }

  async findByCompany(
    companyId: string,
    query: QueryApplicationDto,
    recruiterId: string,
  ) {
    await this.assertCompanyAccess(companyId, recruiterId);
    const { stageId, search, page = 1, limit = 10 } = query as any;

    const qb = this.applicationRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.stage', 'stage')
      .leftJoinAndSelect('a.job', 'job')
      .where('job.companyId = :companyId', { companyId });

    if (stageId) qb.andWhere('a.stageId = :stageId', { stageId });
    if (search)
      qb.andWhere('a.fullName ILIKE :search', { search: `%${search}%` });

    qb.orderBy('a.appliedAt', 'DESC');

    return paginate(qb, { page, limit } as PaginationDto);
  }

  async findOne(id: string, recruiterId?: string) {
    const application = await this.applicationRepo.findOne({
      where: { id },
      relations: {
        stage: true,
        job: { company: true },
        interviews: true,
      },
    });

    if (!application) throw new NotFoundException('Application not found');
    if (recruiterId)
      await this.assertCompanyAccess(application.job.companyId, recruiterId);
    return application;
  }

  async updateStage(
    id: string,
    dto: UpdateApplicationStageDto,
    changedById: string,
  ) {
    const application = await this.findOne(id, changedById);

    const newStage = await this.pipelineStageRepo.findOne({
      where: { id: dto.stageId },
    });
    if (!newStage) throw new NotFoundException('Pipeline stage not found');

    return this.dataSource.transaction(async (manager) => {
      await manager.update(Application, { id }, { stageId: dto.stageId });
      const updated = await manager.findOne(Application, { where: { id } });

      const history = manager.create(ApplicationStageHistory, {
        applicationId: id,
        oldStageName: application.stage?.name || 'Applied',
        newStageName: newStage.name,
        changedById,
        note: dto.note,
      });
      const savedHistory = await manager.save(history);

      return [updated, savedHistory];
    });
  }

  async updateScore(
    id: string,
    dto: UpdateApplicationScoreDto,
    recruiterId: string,
  ) {
    await this.findOne(id, recruiterId);
    await this.applicationRepo.update(id, { score: dto.score });
    return this.applicationRepo.findOne({ where: { id } });
  }

  async getStageHistory(id: string, recruiterId: string) {
    await this.findOne(id, recruiterId);
    return this.stageHistoryRepo.find({
      where: { applicationId: id },
      order: { createdAt: 'DESC' },
      relations: { changedBy: true }, // Added the HR manager's name for a better UI!
    });
  }

  private async assertJobAccess(jobId: string, userId: string) {
    const job = await this.jobRepo.findOne({
      where: { id: jobId },
      select: { id: true, companyId: true },
    });
    if (!job) throw new NotFoundException('Job not found');
    await this.assertCompanyAccess(job.companyId, userId);
  }

  private async assertCompanyAccess(companyId: string, userId: string) {
    const membership = await this.companyMemberRepo.findOne({
      where: { companyId, userId },
      select: { id: true },
    });
    if (!membership)
      throw new ForbiddenException(
        'You cannot access applications outside your company',
      );
  }
}
