import { Module } from '@nestjs/common';
import { HeroService } from './services/hero.service';
import { HeroController } from './controllers/hero.controller';
import { HeroRepository } from './repositories/hero.repository';

@Module({
  controllers: [HeroController],
  providers: [HeroService, HeroRepository],
})
export class HeroModule {}
