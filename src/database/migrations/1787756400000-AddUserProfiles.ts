import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserProfiles1787756400000 implements MigrationInterface {
  name = 'AddUserProfiles1787756400000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "profiles" varchar[] NOT NULL DEFAULT ARRAY['CANDIDATE']::varchar[]`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "active_profile" varchar NOT NULL DEFAULT 'CANDIDATE'`,
    );
    await queryRunner.query(
      `UPDATE "users" SET "profiles" = CASE WHEN "role" = 'CANDIDATE' THEN ARRAY['CANDIDATE']::varchar[] ELSE ARRAY['COMPANY']::varchar[] END, "active_profile" = CASE WHEN "role" = 'CANDIDATE' THEN 'CANDIDATE' ELSE 'COMPANY' END`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "CHK_users_active_profile" CHECK ("active_profile" IN ('CANDIDATE', 'COMPANY'))`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "CHK_users_active_profile"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "active_profile"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "profiles"`);
  }
}
