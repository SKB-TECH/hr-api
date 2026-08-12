import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddJobRequirements1786459100000 implements MigrationInterface {
  name = 'AddJobRequirements1786459100000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "job_requirements" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "job_id" uuid NOT NULL,
      "type" varchar NOT NULL,
      "value" varchar NOT NULL,
      "is_required" boolean NOT NULL DEFAULT true,
      "is_hard_requirement" boolean NOT NULL DEFAULT false,
      CONSTRAINT "CHK_job_requirements_type" CHECK ("type" IN ('certification','license','language','education','availability','other')),
      CONSTRAINT "PK_job_requirements" PRIMARY KEY ("id"),
      CONSTRAINT "FK_job_requirements_job" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE
    )`);
    await queryRunner.query(
      `CREATE INDEX "IDX_job_requirements_job_id" ON "job_requirements" ("job_id")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "job_requirements"`);
  }
}
