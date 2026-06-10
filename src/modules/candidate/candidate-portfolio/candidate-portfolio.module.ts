import { Module } from '@nestjs/common';
import { PortfolioService } from './candidate-portfolio.service';
import { PortfolioController } from './candidate-portfolio.controller';
import { CloudinaryService } from '@/infrastructure/cloudinary/cloudinary.service';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PortfolioController],
  providers: [PortfolioService, CloudinaryService],
  exports: [PortfolioService],
})
export class CandidatePortfolioModule {}