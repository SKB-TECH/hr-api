import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from '../jobs/entities/job.entity';
import { Application } from '../applications/entities/application.entity';
import { CandidateProfile } from '../candidate/candidate-profile/entities/candidate-profile.entity';
import { ProfileVisibility, ResumeParsingStatus } from '@/utils/enums';
import { SearchAiCandidatesDto } from './dto/search-ai-candidates.dto';
import { AuditLogService } from '../audit-logs/audit-log.service';
import { Resume } from '../candidate/candidate-resume/entities/resume.entity';
import { StorageService } from '@/libs/storage/storage.service';
import { CompanyMember } from '../companies/entities/company-member.entity';

@Injectable()
export class AiIntegrationService {
  constructor(
    @InjectRepository(Job) private readonly jobs: Repository<Job>,
    @InjectRepository(Application)
    private readonly applications: Repository<Application>,
    @InjectRepository(CandidateProfile)
    private readonly candidates: Repository<CandidateProfile>,
    private readonly auditLogs: AuditLogService,
    @InjectRepository(Resume)
    private readonly resumes: Repository<Resume>,
    private readonly storage: StorageService,
    @InjectRepository(CompanyMember)
    private readonly companyMembers: Repository<CompanyMember>,
  ) {}

  async jobContext(jobId: string, companyId: string) {
    const job = await this.jobs.findOne({
      where: { id: jobId },
      relations: {
        skills: { skill: { category: true } },
        requirements: true,
        company: true,
      },
    });
    if (!job) throw new NotFoundException('Job not found');
    if (job.companyId !== companyId)
      throw new ForbiddenException(
        'Job does not belong to the supplied company context',
      );
    return {
      id: job.id,
      companyId: job.companyId,
      title: job.title,
      employmentType: job.employmentType,
      jobLevel: job.jobLevel,
      category: job.category,
      location: job.location,
      description: job.description,
      responsibilities: job.responsibilities,
      whoYouAre: job.whoYouAre,
      niceToHaves: job.niceToHaves,
      skills: job.skills.map((item) => ({
        id: item.skill.id,
        name: item.skill.name,
        category: item.skill.category?.name ?? null,
        requirementType: item.requirementType,
        isHardRequirement: item.isHardRequirement,
      })),
      requirements: (job.requirements ?? []).map((item) => ({
        type: item.type,
        value: item.value,
        isRequired: item.isRequired,
        isHardRequirement: item.isHardRequirement,
      })),
    };
  }

  async companyForRecruiter(jobId: string, userId: string): Promise<string> {
    const job = await this.jobs.findOne({
      where: { id: jobId },
      select: { id: true, companyId: true },
    });
    if (!job) throw new NotFoundException('Job not found');
    const membership = await this.companyMembers.findOne({
      where: { companyId: job.companyId, userId },
      select: { id: true },
    });
    if (!membership)
      throw new ForbiddenException('Job does not belong to your company');
    return job.companyId;
  }

  async candidatePool(jobId: string, companyId: string) {
    await this.jobContext(jobId, companyId);
    const applications = await this.applications
      .createQueryBuilder('application')
      .innerJoinAndSelect('application.candidate', 'user')
      .leftJoinAndSelect('user.candidateProfile', 'profile')
      .leftJoinAndSelect('profile.candidateSkills', 'candidateSkill')
      .leftJoinAndSelect('candidateSkill.skill', 'skill')
      .leftJoinAndSelect('profile.candidateExperiences', 'experience')
      .leftJoinAndSelect('profile.candidate_educations', 'education')
      .leftJoinAndSelect('profile.candidateCertifications', 'certification')
      .where('application.job_id = :jobId', { jobId })
      .getMany();
    const result = applications.map((application) => ({
      applicationId: application.id,
      ...(application.candidate.candidateProfile
        ? this.profileSnapshot(application.candidate.candidateProfile)
        : {
            candidateUserId: application.candidateId,
            candidateProfileId: null,
            name: application.fullName,
            headline: application.currentJobTitle,
            availability: null,
            skills: [],
            experiences: [],
            education: [],
            certifications: [],
          }),
    }));
    await this.audit('AI_CANDIDATE_POOL_READ', companyId, jobId, result.length);
    return result;
  }

  async searchCandidates(
    jobId: string,
    companyId: string,
    criteria: SearchAiCandidatesDto,
  ) {
    await this.jobContext(jobId, companyId);
    const requiredSkills = [
      ...new Set(
        (criteria.requiredSkills ?? [])
          .map((skill) => skill.trim().toLowerCase())
          .filter(Boolean),
      ),
    ];
    const qb = this.candidates
      .createQueryBuilder('profile')
      .select('profile.id', 'id')
      .innerJoin('profile.user', 'user')
      .leftJoin('profile.candidateSkills', 'candidateSkill')
      .leftJoin('candidateSkill.skill', 'skill')
      .where('profile.profile_visibility IN (:...visibility)', {
        visibility: [
          ProfileVisibility.public,
          ProfileVisibility.recruiters_only,
        ],
      })
      .andWhere('profile.open_to_work = true')
      .andWhere('user.deleted_at IS NULL');

    if (requiredSkills.length) {
      qb.andWhere('LOWER(skill.name) IN (:...requiredSkills)', {
        requiredSkills,
      })
        .groupBy('profile.id')
        .having('COUNT(DISTINCT LOWER(skill.name)) = :requiredSkillCount', {
          requiredSkillCount: requiredSkills.length,
        });
    } else {
      qb.groupBy('profile.id');
    }
    if (criteria.seniority)
      qb.andWhere('profile.headline ILIKE :seniority', {
        seniority: `%${criteria.seniority}%`,
      });
    if (criteria.location)
      qb.andWhere(
        '(profile.city_name ILIKE :location OR profile.country_name ILIKE :location)',
        { location: `%${criteria.location}%` },
      );
    (criteria.domainExperience ?? []).forEach((domain, index) => {
      qb.andWhere(
        `EXISTS (SELECT 1 FROM candidate_experiences ce${index} WHERE ce${index}.candidate_id = profile.id AND ce${index}.description ILIKE :domain${index})`,
        { [`domain${index}`]: `%${domain}%` },
      );
    });

    const ids = (await qb.limit(criteria.limit ?? 25).getRawMany()).map(
      (row) => row.id,
    );
    if (!ids.length) {
      await this.audit('AI_CANDIDATE_SEARCH', companyId, jobId, 0);
      return [];
    }
    const profiles = await this.candidates.find({
      where: ids.map((id) => ({ id })),
      relations: {
        user: true,
        candidateSkills: { skill: true },
        candidateExperiences: true,
        candidate_educations: true,
        candidateCertifications: true,
      },
    });
    const result = profiles.map((profile) => this.profileSnapshot(profile));
    await this.audit('AI_CANDIDATE_SEARCH', companyId, jobId, result.length);
    return result;
  }

  async resumeContent(resumeId: string) {
    const resume = await this.resumes.findOne({ where: { id: resumeId } });
    if (!resume) throw new NotFoundException('Resume not found');
    const file = await this.storage.downloadFile(resume.publicId);
    await this.auditLogs.log({
      action: 'AI_RESUME_CONTENT_READ',
      module: 'ai-integration',
      newValues: { resumeId, candidateProfileId: resume.candidateId },
    });
    return file;
  }

  async resumeContentForCandidate(resumeId: string, userId: string) {
    const resume = await this.resumes.findOne({
      where: { id: resumeId },
      relations: { candidate: true },
    });
    if (!resume) throw new NotFoundException('Resume not found');
    if (resume.candidate.userId !== userId)
      throw new ForbiddenException('You do not own this resume');
    const file = await this.storage.downloadFile(resume.publicId);
    await this.auditLogs.log({
      userId,
      action: 'AI_RESUME_EXTRACTION_REQUESTED',
      module: 'ai-integration',
      newValues: { resumeId, candidateProfileId: resume.candidateId },
    });
    return file;
  }

  async updateResumeParsingStatus(
    resumeId: string,
    status: ResumeParsingStatus,
    error?: string,
  ) {
    const resume = await this.resumes.findOne({ where: { id: resumeId } });
    if (!resume) throw new NotFoundException('Resume not found');
    const completed = status === ResumeParsingStatus.COMPLETED;
    await this.resumes.update(resumeId, {
      parsingStatus: status,
      parsed: completed,
      parsedAt: completed ? new Date() : resume.parsedAt,
      parsingError:
        status === ResumeParsingStatus.FAILED
          ? (error ?? 'AI processing failed').slice(0, 500)
          : null,
    });
    await this.auditLogs.log({
      action: 'AI_RESUME_STATUS_UPDATED',
      module: 'ai-integration',
      newValues: { resumeId, status },
    });
    return { resumeId, status };
  }

  private profileSnapshot(profile: CandidateProfile) {
    return {
      candidateUserId: profile.userId,
      candidateProfileId: profile.id,
      name: profile.user.fullName,
      headline: profile.headline,
      location: [profile.cityName, profile.countryName]
        .filter(Boolean)
        .join(', '),
      availability: profile.availability,
      skills: (profile.candidateSkills ?? []).map((item) => ({
        name: item.skill.name,
        level: item.level,
        yearsExperience: item.yearsExperience,
      })),
      experiences: (profile.candidateExperiences ?? []).map((item) => ({
        company: item.companyName,
        role: item.position,
        employmentType: item.employmentType,
        description: item.description,
        startDate: item.startDate,
        endDate: item.endDate,
        current: item.isCurrent,
      })),
      education: (profile.candidate_educations ?? []).map((item) => ({
        institution: item.schoolName,
        degree: item.degree,
        fieldOfStudy: item.fieldOfStudy,
        startDate: item.startDate,
        endDate: item.endDate,
      })),
      certifications: (profile.candidateCertifications ?? []).map((item) => ({
        name: item.title,
        issuer: item.organization,
        issueDate: item.issueDate,
        expirationDate: item.expirationDate,
      })),
    };
  }

  private audit(
    action: string,
    companyId: string,
    jobId: string,
    resultCount: number,
  ) {
    return this.auditLogs.log({
      action,
      module: 'ai-integration',
      newValues: { companyId, jobId, resultCount },
    });
  }
}
