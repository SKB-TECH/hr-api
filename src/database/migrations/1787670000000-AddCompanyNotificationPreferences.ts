import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompanyNotificationPreferences1787670000000 implements MigrationInterface {
  name = 'AddCompanyNotificationPreferences1787670000000';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "company_notification_preferences" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "company_id" uuid NOT NULL, "user_id" uuid NOT NULL, "recruiter_related" boolean NOT NULL DEFAULT true, "subscription_notifications" boolean NOT NULL DEFAULT true, "billing_alerts" boolean NOT NULL DEFAULT false, "security_updates" boolean NOT NULL DEFAULT true, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_company_notification_preferences_company_user" UNIQUE ("company_id", "user_id"), CONSTRAINT "PK_company_notification_preferences" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_notification_preferences" ADD CONSTRAINT "FK_company_notification_preferences_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "company_notification_preferences" ADD CONSTRAINT "FK_company_notification_preferences_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE`,
    );
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "company_notification_preferences"`);
  }
}
