import { Module } from '@nestjs/common';
import { CandidateProfileModule } from './candidate-profile/candidate-profile.module';
import { CandidateResumeModule } from './candidate-resume/candidate-resume.module';
import { CandidateEducationModule } from './candidate-education/candidate-education.module';

import { CandidateExperienceModule } from './candidate-experience/candidate-experience.module';
import { CandidateCertificationModule } from './candidate-certificate/candidate-certificate.module';
import { CandidateSkillModule } from './candidate-skill/candidate-skill.module';
import { CandidatePortfolioModule } from './candidate-portfolio/candidate-portfolio.module';

@Module({
 imports: [CandidateProfileModule,
            CandidateEducationModule,
            CandidateCertificationModule,
            CandidateExperienceModule,
            CandidateResumeModule,
            CandidateSkillModule,
            CandidatePortfolioModule
            
        ],
  controllers: [],
  providers: [],
})
export class CandidateModule {

}
