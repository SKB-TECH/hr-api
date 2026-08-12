import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddResumeParsingStatus1786459200000 implements MigrationInterface {
  name = 'AddResumeParsingStatus1786459200000';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "resumes" ADD COLUMN "parsing_status" varchar NOT NULL DEFAULT 'pending'`,
    );
    await queryRunner.query(
      `ALTER TABLE "resumes" ADD COLUMN "parsing_error" varchar`,
    );
    await queryRunner.query(
      `ALTER TABLE "resumes" ADD COLUMN "parsed_at" timestamptz`,
    );
    await queryRunner.query(
      `ALTER TABLE "resumes" ADD CONSTRAINT "CHK_resumes_parsing_status" CHECK ("parsing_status" IN ('pending','queued','processing','completed','failed'))`,
    );
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "resumes" DROP CONSTRAINT IF EXISTS "CHK_resumes_parsing_status"`,
    );
    await queryRunner.query(`ALTER TABLE "resumes" DROP COLUMN "parsed_at"`);
    await queryRunner.query(
      `ALTER TABLE "resumes" DROP COLUMN "parsing_error"`,
    );
    await queryRunner.query(
      `ALTER TABLE "resumes" DROP COLUMN "parsing_status"`,
    );
  }
}
