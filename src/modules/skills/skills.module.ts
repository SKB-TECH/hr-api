import { Module } from '@nestjs/common';
import { SkillsService } from './skills.service';
import { SkillsController } from './skills.controller';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule], // <-- Gives us access to the database!
  controllers: [SkillsController],
  providers: [SkillsService],
  exports: [SkillsService], // Exported so the Jobs and Candidates modules can use it later
})
export class SkillsModule {}
