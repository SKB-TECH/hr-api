import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateConversationDto {
  @IsUUID() candidateId: string;
  @IsOptional() @IsUUID() jobId?: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(5000) text?: string;
}
