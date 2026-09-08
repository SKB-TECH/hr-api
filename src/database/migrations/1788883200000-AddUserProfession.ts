import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserProfession1788883200000 implements MigrationInterface {
  name = 'AddUserProfession1788883200000';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "professions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" varchar NOT NULL, "code" varchar NOT NULL, "category" varchar, "is_active" boolean NOT NULL DEFAULT true, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), CONSTRAINT "UQ_professions_code" UNIQUE ("code"), CONSTRAINT "PK_professions" PRIMARY KEY ("id"))`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profession_id" uuid`);
    await queryRunner.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_users_profession') THEN ALTER TABLE "users" ADD CONSTRAINT "fk_users_profession" FOREIGN KEY ("profession_id") REFERENCES "professions"("id") ON DELETE SET NULL; END IF; END $$`);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "fk_users_profession"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "profession_id"`);
  }
}
