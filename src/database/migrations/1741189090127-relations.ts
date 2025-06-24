import { MigrationInterface, QueryRunner } from "typeorm";

export class Relations1741189090127 implements MigrationInterface {
    name = 'Relations1741189090127'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "menu_item_option"
            ADD "menuItemId" integer
        `);
        await queryRunner.query(`
            ALTER TABLE "menu_item_option"
            ADD CONSTRAINT "FK_a825c305cdfb4271d99ccb88a4b" FOREIGN KEY ("menuItemId") REFERENCES "menu_item"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "menu_item_option" DROP CONSTRAINT "FK_a825c305cdfb4271d99ccb88a4b"
        `);
        await queryRunner.query(`
            ALTER TABLE "menu_item_option" DROP COLUMN "menuItemId"
        `);
    }

}
