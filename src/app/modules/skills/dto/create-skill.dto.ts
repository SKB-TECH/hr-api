import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSkillCategoryDto {
  @ApiProperty({ example: 'Software Development' })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class CreateSkillDto {
  @ApiProperty({
    example: 'Node.js',
    description: 'The official name of the skill',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'a6e35da1-9493-4903-bf68-80b18361bdf6',
    description: 'Existing skill category UUID',
  })
  @IsUUID()
  categoryId: string;
}
