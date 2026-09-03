import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Not, Repository } from 'typeorm';
import { UpdatePipelineStagesDto } from './dto/update-pipeline-stages.dto';
import { PipelineStage } from './entities/pipeline-stage.entity';
import { CompanyMember } from '../companies/entities/company-member.entity';
import { Application } from '../applications/entities/application.entity';

const DEFAULT_PIPELINE_STAGES = [
  'À examiner',
  'Présélection',
  'Entretien',
  'Embauché',
  'Rejeté',
];

@Injectable()
export class PipelineStagesService {
  constructor(
    @InjectRepository(PipelineStage)
    private readonly pipelineStageRepo: Repository<PipelineStage>,
    @InjectRepository(CompanyMember)
    private readonly companyMemberRepo: Repository<CompanyMember>,
    private readonly dataSource: DataSource,
  ) {}

  async getCompanyStages(companyId: string, userId: string) {
    await this.assertCompanyAccess(companyId, userId);
    let stages = await this.pipelineStageRepo.find({
      where: { companyId },
      order: { order: 'ASC' }, // Crucial: Ensures left-to-right frontend rendering
    });

    if (stages.length === 0) {
      stages = await this.dataSource.transaction(async (manager) => {
        const repo = manager.getRepository(PipelineStage);
        const existing = await repo.find({
          where: { companyId },
          order: { order: 'ASC' },
        });
        if (existing.length > 0) return existing;

        const created = await repo.save(
          DEFAULT_PIPELINE_STAGES.map((name, order) =>
            repo.create({ companyId, name, order }),
          ),
        );

        await manager
          .createQueryBuilder()
          .update(Application)
          .set({ stageId: created[0].id })
          .where('stage_id IS NULL')
          .andWhere(
            'job_id IN (SELECT id FROM jobs WHERE company_id = :companyId)',
            { companyId },
          )
          .execute();

        return created;
      });
    }

    return stages;
  }

  async updateCompanyStages(
    companyId: string,
    dto: UpdatePipelineStagesDto,
    userId: string,
  ) {
    await this.assertCompanyAccess(companyId, userId);
    const { stages } = dto;

    const incomingIds = stages
      .map((stage) => stage.id)
      .filter((id): id is string => id != null);

    const finalStages = await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(PipelineStage);

      await repo.delete({
        companyId,
        ...(incomingIds.length ? { id: Not(In(incomingIds)) } : {}),
      });

      const results: PipelineStage[] = [];
      for (const stage of stages) {
        if (stage.id) {
          await repo.update(stage.id, {
            name: stage.name,
            order: stage.order,
          });
          const updated = await repo.findOne({ where: { id: stage.id } });
          if (updated) results.push(updated);
        } else {
          const created = await repo.save(
            repo.create({
              name: stage.name,
              order: stage.order,
              companyId,
            }),
          );
          results.push(created);
        }
      }

      return results;
    });

    return finalStages;
  }

  private async assertCompanyAccess(companyId: string, userId: string) {
    const member = await this.companyMemberRepo.findOne({
      where: { companyId, userId },
      select: { id: true },
    });
    if (!member)
      throw new ForbiddenException(
        'You cannot access pipeline stages outside your company',
      );
  }
}
