import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddJobSkillRequirements1786459000000 implements MigrationInterface {
  name = 'AddJobSkillRequirements1786459000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "job_skills" ADD COLUMN IF NOT EXISTS "requirement_type" varchar NOT NULL DEFAULT 'required'`,
    );
    await queryRunner.query(
      `ALTER TABLE "job_skills" ADD COLUMN IF NOT EXISTS "is_hard_requirement" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "job_skills" ADD CONSTRAINT "CHK_job_skills_requirement_type" CHECK ("requirement_type" IN ('required', 'nice_to_have'))`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "job_skills" DROP CONSTRAINT IF EXISTS "CHK_job_skills_requirement_type"`,
    );
    await queryRunner.query(
      `ALTER TABLE "job_skills" DROP COLUMN IF EXISTS "is_hard_requirement"`,
    );
    await queryRunner.query(
      `ALTER TABLE "job_skills" DROP COLUMN IF EXISTS "requirement_type"`,
    );
  }
}
