import { MigrationInterface, QueryRunner } from "typeorm";

export class Relations1741183845539 implements MigrationInterface {
    name = 'Relations1741183845539'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "menu_item"
            ADD "menuCategoryId" integer
        `);
        await queryRunner.query(`
            ALTER TABLE "menu_item"
            ADD CONSTRAINT "FK_092ed10b47eb715385d56f6097e" FOREIGN KEY ("menuCategoryId") REFERENCES "menu_category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "menu_item" DROP CONSTRAINT "FK_092ed10b47eb715385d56f6097e"
        `);
        await queryRunner.query(`
            ALTER TABLE "menu_item" DROP COLUMN "menuCategoryId"
        `);
    }

}
