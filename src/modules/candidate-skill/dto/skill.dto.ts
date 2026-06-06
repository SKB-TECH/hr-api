import { ApiProperty } from '@nestjs/swagger';
import { SkillCategoryDto } from './skill-category.dto';

export class SkillDto {
  @ApiProperty({ example: '8f3b29c1-472d-4bfb-b462-871d87f7b244', format: 'uuid', description: 'Unique skill identifier' })
  id: string;

  @ApiProperty({ example: 'NestJS', description: 'Skill human-readable name' })
  name: string;

  @ApiProperty({ example: 'nestjs', description: 'URL-friendly slug for the skill' })
  slug: string;

  @ApiProperty({ type: () => SkillCategoryDto, description: 'Category grouping for the skill' })
  category: SkillCategoryDto | null;
}
