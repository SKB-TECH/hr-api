import { MigrationInterface, QueryRunner } from 'typeorm';

export class CompleteJobManagement1786461100000 implements MigrationInterface {
  name = 'CompleteJobManagement1786461100000';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "jobs"
      ADD COLUMN "employment_types" jsonb NOT NULL DEFAULT '[]'::jsonb,
      ADD COLUMN "closed_at" timestamptz,
      ADD COLUMN "created_by" uuid`);
    await queryRunner.query(
      `UPDATE "jobs" SET "employment_types" = jsonb_build_array("employment_type"::text)`,
    );
    await queryRunner.query(
      `ALTER TABLE "job_benefits" ADD COLUMN "icon" varchar`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" ADD CONSTRAINT "FK_jobs_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_jobs_company_status_created" ON "jobs" ("company_id", "status", "created_at" DESC)`,
    );
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_jobs_company_status_created"`);
    await queryRunner.query(
      `ALTER TABLE "jobs" DROP CONSTRAINT "FK_jobs_created_by"`,
    );
    await queryRunner.query(`ALTER TABLE "job_benefits" DROP COLUMN "icon"`);
    await queryRunner.query(`ALTER TABLE "jobs"
      DROP COLUMN "created_by",
      DROP COLUMN "closed_at",
      DROP COLUMN "employment_types"`);
  }
}
