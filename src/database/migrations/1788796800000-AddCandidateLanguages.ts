import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCandidateLanguages1788796800000 implements MigrationInterface {
  name = 'AddCandidateLanguages1788796800000';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "candidate_profiles" ADD COLUMN IF NOT EXISTS "language_codes" text[] NOT NULL DEFAULT '{}'`);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "candidate_profiles" DROP COLUMN IF EXISTS "language_codes"`);
  }
}
