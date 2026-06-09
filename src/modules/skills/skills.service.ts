import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateSkillDto } from './dto/create-skill.dto';

@Injectable()
export class SkillsService {
  constructor(private readonly prisma: PrismaService) {}

  async createSkill(createSkillDto: CreateSkillDto) {
    const prismaClient: any = this.prisma as any;

    const existingSkill = await prismaClient.skill.findFirst({
      where: {
        name: {
          equals: createSkillDto.name,
          mode: 'insensitive',
        },
      },
    });

    if (existingSkill) {
      throw new ConflictException(`The skill '${createSkillDto.name}' already exists.`);
    }

    return prismaClient.skill.create({
      data: {
        name: createSkillDto.name,
        category: createSkillDto.category,
      },
    });
  }

  async findAllSkills() {
    const prismaClient: any = this.prisma as any;

    return prismaClient.skill.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        category: true,
      },
    });
  }
}
