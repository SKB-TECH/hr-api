import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PortfolioService } from './candidate-portfolio.service';
import { PortfolioController } from './candidate-portfolio.controller';
import { CandidatePortfolio } from './entities/candidate-portfolio.entity';
import { CandidateProfile } from '../candidate-profile/entities/candidate-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CandidatePortfolio, CandidateProfile])],
  controllers: [PortfolioController],
  providers: [PortfolioService],
  exports: [PortfolioService],
})
export class CandidatePortfolioModule {}
