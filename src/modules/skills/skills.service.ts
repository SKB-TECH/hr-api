import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateSkillDto } from './dto/create-skill.dto';

@Injectable()
export class SkillsService {
  constructor(private readonly prisma: PrismaService) {}

  // ==================================================
  // Create a new Skill for the Master Dictionary
  // ==================================================
  async createSkill(createSkillDto: CreateSkillDto) {
    // Cast prisma to any to avoid missing model typings on the injected PrismaService
    const prismaClient: any = this.prisma as any;

    // 1. Check if the skill already exists (case-insensitive)
    const existingSkill = await prismaClient.skill.findFirst({
      where: {
        name: {
          equals: createSkillDto.name,
          mode: 'insensitive', // Treats "Node.js" and "node.js" as the same
        },
      },
    });

    if (existingSkill) {
      throw new ConflictException(`The skill '${createSkillDto.name}' already exists.`);
    }

    // 2. Create and return the new skill
    return prismaClient.skill.create({
      data: {
        name: createSkillDto.name,
        category: createSkillDto.category,
      },
    });
  }

  // ==================================================
  // Fetch all Skills (Used for Frontend Dropdowns)
  // ==================================================
  async findAllSkills() {
    const prismaClient: any = this.prisma as any;

    return prismaClient.skill.findMany({
      orderBy: { name: 'asc' }, // Alphabetical order is best for UI dropdowns
      select: {
        id: true,
        name: true,
        category: true,
      },
    });
  }
}
