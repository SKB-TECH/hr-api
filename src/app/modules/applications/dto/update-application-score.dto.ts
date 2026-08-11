import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Max, Min } from 'class-validator';

export class UpdateApplicationScoreDto {
  @ApiProperty({
    minimum: 0,
    maximum: 5,
    example: 4.5,
    description:
      'Human recruiter rating. This is separate from the deterministic AI match score (0-100).',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(5)
  score: number;
}
