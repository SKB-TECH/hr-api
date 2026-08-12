import { MigrationInterface, QueryRunner } from 'typeorm';

export class CompleteCompanyProfile1786461000000 implements MigrationInterface {
  name = 'CompleteCompanyProfile1786461000000';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "companies"
      ADD COLUMN "locations" jsonb NOT NULL DEFAULT '[]'::jsonb,
      ADD COLUMN "tech_stack" jsonb NOT NULL DEFAULT '[]'::jsonb,
      ADD COLUMN "perks" jsonb NOT NULL DEFAULT '[]'::jsonb,
      ADD COLUMN "gallery" jsonb NOT NULL DEFAULT '[]'::jsonb,
      ADD COLUMN "visibility" varchar NOT NULL DEFAULT 'public',
      ADD COLUMN "email_contact_enabled" boolean NOT NULL DEFAULT true,
      ADD COLUMN "in_app_contact_enabled" boolean NOT NULL DEFAULT true,
      ADD COLUMN "status" varchar NOT NULL DEFAULT 'active',
      ADD COLUMN "deactivation_reason" varchar,
      ADD COLUMN "deletion_scheduled_at" timestamptz,
      ADD CONSTRAINT "CHK_companies_visibility" CHECK ("visibility" IN ('public','authenticated','verified_candidates','private'))`);
    await queryRunner.query(
      `ALTER TABLE "companies" ADD CONSTRAINT "CHK_companies_status" CHECK ("status" IN ('active','deactivated','deletion_scheduled'))`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_members" ADD COLUMN "title" varchar`,
    );
    await queryRunner.query(`CREATE TABLE "company_team_members" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "company_id" uuid NOT NULL,
      "name" varchar(150) NOT NULL,
      "role" varchar(150) NOT NULL,
      "avatar" varchar,
      "instagram" varchar,
      "linkedin" varchar,
      "display_order" integer NOT NULL DEFAULT 0,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "updated_at" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "PK_company_team_members" PRIMARY KEY ("id"),
      CONSTRAINT "FK_company_team_members_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE
    )`);
    await queryRunner.query(
      `CREATE INDEX "IDX_company_team_members_company" ON "company_team_members" ("company_id", "display_order")`,
    );
    await queryRunner.query(`CREATE TABLE "company_invitations" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "company_id" uuid NOT NULL,
      "email" varchar NOT NULL,
      "full_name" varchar,
      "title" varchar,
      "role" varchar NOT NULL,
      "token_hash" char(64) NOT NULL,
      "status" varchar NOT NULL DEFAULT 'pending',
      "invited_by" uuid NOT NULL,
      "expires_at" timestamptz NOT NULL,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "updated_at" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "PK_company_invitations" PRIMARY KEY ("id"),
      CONSTRAINT "UQ_company_invitations_token" UNIQUE ("token_hash"),
      CONSTRAINT "CHK_company_invitations_role" CHECK ("role" IN ('HR_MANAGER','RECRUITER')),
      CONSTRAINT "CHK_company_invitations_status" CHECK ("status" IN ('pending','accepted','revoked','expired')),
      CONSTRAINT "FK_company_invitations_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE,
      CONSTRAINT "FK_company_invitations_inviter" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE CASCADE
    )`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_company_invitations_pending_email" ON "company_invitations" ("company_id", LOWER("email")) WHERE "status" = 'pending'`,
    );
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "company_invitations"`);
    await queryRunner.query(`DROP TABLE "company_team_members"`);
    await queryRunner.query(
      `ALTER TABLE "company_members" DROP COLUMN "title"`,
    );
    await queryRunner.query(`ALTER TABLE "companies"
      DROP CONSTRAINT "CHK_companies_status",
      DROP CONSTRAINT "CHK_companies_visibility",
      DROP COLUMN "deletion_scheduled_at",
      DROP COLUMN "deactivation_reason",
      DROP COLUMN "status",
      DROP COLUMN "in_app_contact_enabled",
      DROP COLUMN "email_contact_enabled",
      DROP COLUMN "visibility",
      DROP COLUMN "gallery",
      DROP COLUMN "perks",
      DROP COLUMN "tech_stack",
      DROP COLUMN "locations"`);
  }
}
