import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRenewalFailedNotificationType1745200000001
  implements MigrationInterface
{
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "notifications_type_enum"
        ADD VALUE IF NOT EXISTS 'subscription_renewal_failed'
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL does not support removing enum values directly.
    // A full enum recreation would be required; left as a no-op for safety.
  }
}
