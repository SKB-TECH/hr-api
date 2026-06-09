import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service'; // Adjust path if needed
import { UpdatePipelineStagesDto } from './dto/update-pipeline-stages.dto';

@Injectable()
export class PipelineStagesService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Fetch the stages in the exact order for the Kanban board
  async getCompanyStages(companyId: string) {
    const stages = await this.prisma.pipelineStage.findMany({
      where: { companyId },
      orderBy: { order: 'asc' }, // Crucial: Ensures left-to-right frontend rendering
    });

    return { success: true, data: stages };
  }

  // 2. The Smart Transaction to update the board safely
  async updateCompanyStages(companyId: string, dto: UpdatePipelineStagesDto) {
    const { stages } = dto;

    // Extract the IDs of the stages the frontend wants to KEEP or UPDATE
    const incomingIds = stages.map((stage) => stage.id).filter((id) => id != null);

    // Run everything inside an isolated transaction
    const finalStages = await this.prisma.$transaction(async (tx) => {
      
      // A. Delete stages that belong to this company but are NO LONGER in the incoming list
      await tx.pipelineStage.deleteMany({
        where: {
          companyId,
          id: { notIn: incomingIds },
        },
      });

      // B. Process the incoming stages (Create new ones, Update existing ones)
      const results = [];
      for (const stage of stages) {
        if (stage.id) {
          // It has an ID, so update its name and order
          const updated = await tx.pipelineStage.update({
            where: { id: stage.id },
            data: { name: stage.name, order: stage.order },
          });
          results.push(updated);
        } else {
          // No ID means it's a brand new stage column!
          const created = await tx.pipelineStage.create({
            data: {
              name: stage.name,
              order: stage.order,
              companyId,
            },
          });
          results.push(created);
        }
      }

      return results;
    });

    return { 
      success: true, 
      message: 'Pipeline stages updated successfully',
      data: finalStages 
    };
  }
}
