import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMessaging1788446400000 implements MigrationInterface {
  name = 'CreateMessaging1788446400000';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "conversations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "company_id" uuid NOT NULL, "candidate_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_conversations_company_candidate" UNIQUE ("company_id", "candidate_id"), CONSTRAINT "PK_conversations" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_conversations_company" ON "conversations" ("company_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_conversations_candidate" ON "conversations" ("candidate_id")`);
    await queryRunner.query(`CREATE TABLE "messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "conversation_id" uuid NOT NULL, "sender_id" uuid NOT NULL, "text" text NOT NULL, "type" character varying NOT NULL DEFAULT 'TEXT', "job_id" uuid, "read_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_messages" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_messages_conversation" ON "messages" ("conversation_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_messages_sender" ON "messages" ("sender_id")`);
    await queryRunner.query(`ALTER TABLE "conversations" ADD CONSTRAINT "FK_conversations_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "conversations" ADD CONSTRAINT "FK_conversations_candidate" FOREIGN KEY ("candidate_id") REFERENCES "users"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_messages_conversation" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_messages_sender" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_messages_job" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE SET NULL`);
  }
  public async down(queryRunner: QueryRunner): Promise<void> { await queryRunner.query(`DROP TABLE "messages"`); await queryRunner.query(`DROP TABLE "conversations"`); }
}
