import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFileDataToMessageMedia1234567890123 implements MigrationInterface {
    name = 'AddFileDataToMessageMedia1234567890123'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Ajouter la colonne fileData de type bytea
        await queryRunner.query(`
            ALTER TABLE "message_media"
            ADD COLUMN "fileData" bytea
        `);

        // Rendre filePath nullable (optionnel maintenant)
        await queryRunner.query(`
            ALTER TABLE "message_media"
            ALTER COLUMN "filePath" DROP NOT NULL
        `);

        console.log('Migration applied: Added fileData column and made filePath nullable');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Supprimer la colonne fileData
        await queryRunner.query(`
            ALTER TABLE "message_media"
            DROP COLUMN "fileData"
        `);

        // Remettre filePath en NOT NULL (si nécessaire)
        await queryRunner.query(`
            ALTER TABLE "message_media"
            ALTER COLUMN "filePath" SET NOT NULL
        `);

        console.log('Migration reverted: Removed fileData column and restored filePath NOT NULL');
    }
}
