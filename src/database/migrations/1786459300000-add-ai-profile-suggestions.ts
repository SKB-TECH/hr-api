import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAiProfileSuggestions1786459300000 implements MigrationInterface {
  name = 'AddAiProfileSuggestions1786459300000';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "ai_profile_suggestions" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "candidate_profile_id" uuid NOT NULL,
      "resume_id" uuid NOT NULL,
      "proposal" jsonb NOT NULL,
      "status" varchar NOT NULL DEFAULT 'pending_review',
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "updated_at" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "UQ_ai_profile_suggestions_resume" UNIQUE ("resume_id"),
      CONSTRAINT "CHK_ai_profile_suggestions_status" CHECK ("status" IN ('pending_review','dismissed')),
      CONSTRAINT "PK_ai_profile_suggestions" PRIMARY KEY ("id"),
      CONSTRAINT "FK_ai_profile_suggestions_candidate" FOREIGN KEY ("candidate_profile_id") REFERENCES "candidate_profiles"("id") ON DELETE CASCADE,
      CONSTRAINT "FK_ai_profile_suggestions_resume" FOREIGN KEY ("resume_id") REFERENCES "resumes"("id") ON DELETE CASCADE
    )`);
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_profile_suggestions_candidate" ON "ai_profile_suggestions" ("candidate_profile_id")`,
    );
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "ai_profile_suggestions"`);
  }
}
