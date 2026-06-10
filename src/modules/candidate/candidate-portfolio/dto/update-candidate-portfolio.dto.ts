import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreatePortfolioDto } from './create-candidate-portfolio.dto';

export class UpdatePortfolioDto extends PartialType(CreatePortfolioDto) {
  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Provide an updated presentation image file if you want to replace the current thumbnail asset on Cloudinary',
  })
  thumbnail?: any;
}