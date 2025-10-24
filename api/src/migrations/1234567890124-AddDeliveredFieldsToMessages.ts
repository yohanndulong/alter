import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDeliveredFieldsToMessages1234567890124 implements MigrationInterface {
    name = 'AddDeliveredFieldsToMessages1234567890124'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Ajouter les colonnes delivered, deliveredAt et readAt
        await queryRunner.query(`
            ALTER TABLE "messages"
            ADD COLUMN "delivered" boolean NOT NULL DEFAULT false,
            ADD COLUMN "deliveredAt" timestamp,
            ADD COLUMN "readAt" timestamp
        `);

        console.log('Migration applied: Added delivered, deliveredAt, and readAt columns to messages');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Supprimer les colonnes
        await queryRunner.query(`
            ALTER TABLE "messages"
            DROP COLUMN "delivered",
            DROP COLUMN "deliveredAt",
            DROP COLUMN "readAt"
        `);

        console.log('Migration reverted: Removed delivered, deliveredAt, and readAt columns from messages');
    }
}
