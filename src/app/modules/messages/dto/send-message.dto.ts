import { IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class SendMessageDto {
  @IsString() @MinLength(1) @MaxLength(5000) text: string;
  @IsOptional() @IsIn(['TEXT', 'JOB_PROPOSAL']) type?: 'TEXT' | 'JOB_PROPOSAL';
  @IsOptional() @IsUUID() jobId?: string;
}
