import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddActiveCompanyMembership1787842800000 implements MigrationInterface {
  name = 'AddActiveCompanyMembership1787842800000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "company_members" ADD "is_active" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `UPDATE "company_members" member SET "is_active" = true WHERE member.id IN (SELECT DISTINCT ON ("user_id") id FROM "company_members" ORDER BY "user_id", "joined_at")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_company_members_one_active_per_user" ON "company_members" ("user_id") WHERE "is_active" = true`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "IDX_company_members_one_active_per_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_members" DROP COLUMN "is_active"`,
    );
  }
}
