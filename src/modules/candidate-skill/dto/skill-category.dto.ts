import { ApiProperty } from '@nestjs/swagger';

export class SkillCategoryDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', format: 'uuid', description: 'Unique category identifier' })
  id: string;

  @ApiProperty({ example: 'Backend Development', description: 'Human friendly category name' })
  name: string;
}
