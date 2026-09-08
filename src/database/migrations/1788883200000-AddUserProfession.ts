import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserProfession1788883200000 implements MigrationInterface {
  name = 'AddUserProfession1788883200000';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profession_id" uuid`);
    await queryRunner.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_users_profession') THEN ALTER TABLE "users" ADD CONSTRAINT "fk_users_profession" FOREIGN KEY ("profession_id") REFERENCES "professions"("id") ON DELETE SET NULL; END IF; END $$`);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "fk_users_profession"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "profession_id"`);
  }
}
