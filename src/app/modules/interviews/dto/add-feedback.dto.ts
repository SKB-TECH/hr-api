import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddFeedbackDto {
  @IsString()
  @ApiProperty({
    example: 'Strong communication skills, recommended for next round.',
  })
  feedback: string;
}
