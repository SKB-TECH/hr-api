import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCandidateJobPreferences1788969600000 implements MigrationInterface {
  name = 'AddCandidateJobPreferences1788969600000';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "candidate_profiles" ADD COLUMN IF NOT EXISTS "language_proficiencies" jsonb NOT NULL DEFAULT '[]'::jsonb`);
    await queryRunner.query(`ALTER TABLE "candidate_profiles" ADD COLUMN IF NOT EXISTS "preferred_profession_ids" uuid[] NOT NULL DEFAULT '{}'`);
    await queryRunner.query(`ALTER TABLE "candidate_profiles" ADD COLUMN IF NOT EXISTS "preferred_countries" text[] NOT NULL DEFAULT '{}'`);
    await queryRunner.query(`ALTER TABLE "candidate_profiles" ADD COLUMN IF NOT EXISTS "preferred_employment_types" text[] NOT NULL DEFAULT '{}'`);
    await queryRunner.query(`ALTER TABLE "candidate_profiles" ADD COLUMN IF NOT EXISTS "accepts_remote" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "candidate_profiles" ADD COLUMN IF NOT EXISTS "expected_salary_min" numeric(12,2)`);
    await queryRunner.query(`ALTER TABLE "candidate_profiles" ADD COLUMN IF NOT EXISTS "expected_salary_max" numeric(12,2)`);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "candidate_profiles" DROP COLUMN IF EXISTS "expected_salary_max", DROP COLUMN IF EXISTS "expected_salary_min", DROP COLUMN IF EXISTS "accepts_remote", DROP COLUMN IF EXISTS "preferred_employment_types", DROP COLUMN IF EXISTS "preferred_countries", DROP COLUMN IF EXISTS "preferred_profession_ids", DROP COLUMN IF EXISTS "language_proficiencies"`);
  }
}
