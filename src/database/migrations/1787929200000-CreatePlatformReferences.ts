import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePlatformReferences1787929200000 implements MigrationInterface {
  name = 'CreatePlatformReferences1787929200000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "platform_references" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" varchar(40) NOT NULL,
        "code" varchar(100) NOT NULL,
        "name" varchar(200) NOT NULL,
        "description" text,
        "icon" varchar(100),
        "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_platform_references" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_platform_references_type_code" UNIQUE ("type", "code")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_platform_references_type_name" ON "platform_references" ("type", "name")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_platform_references_type_name"`);
    await queryRunner.query(`DROP TABLE "platform_references"`);
  }
}
