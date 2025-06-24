import { MigrationInterface, QueryRunner } from "typeorm";

export class Relations1741359204622 implements MigrationInterface {
    name = 'Relations1741359204622'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "menu_item_option_value" (
                "id" SERIAL NOT NULL,
                "name" character varying NOT NULL,
                "extra_price" numeric(10, 2) NOT NULL DEFAULT '0',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "menuItemOptionId" integer,
                CONSTRAINT "PK_a5f26729925158ffccc6ec24057" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "menu_item_option_value"
            ADD CONSTRAINT "FK_08ca0940ee3292d67e1c1e04189" FOREIGN KEY ("menuItemOptionId") REFERENCES "menu_item_option"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "menu_item_option_value" DROP CONSTRAINT "FK_08ca0940ee3292d67e1c1e04189"
        `);
        await queryRunner.query(`
            DROP TABLE "menu_item_option_value"
        `);
    }

}
