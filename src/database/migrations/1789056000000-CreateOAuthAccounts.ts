import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOAuthAccounts1789056000000 implements MigrationInterface {
  name = 'CreateOAuthAccounts1789056000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."oauth_accounts_provider_enum" AS ENUM('google', 'linkedin')`,
    );
    await queryRunner.query(
      `CREATE TABLE "oauth_accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "provider" "public"."oauth_accounts_provider_enum" NOT NULL, "provider_account_id" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_oauth_accounts_provider_account" UNIQUE ("provider", "provider_account_id"), CONSTRAINT "PK_oauth_accounts_id" PRIMARY KEY ("id"), CONSTRAINT "FK_oauth_accounts_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_oauth_accounts_user_id" ON "oauth_accounts" ("user_id")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_oauth_accounts_user_id"`);
    await queryRunner.query(`DROP TABLE "oauth_accounts"`);
    await queryRunner.query(
      `DROP TYPE "public"."oauth_accounts_provider_enum"`,
    );
  }
}
