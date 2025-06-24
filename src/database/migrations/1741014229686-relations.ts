import { MigrationInterface, QueryRunner } from "typeorm";

export class Relations1741014229686 implements MigrationInterface {
    name = 'Relations1741014229686'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "menu_category" (
                "id" SERIAL NOT NULL,
                "name" character varying NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "restaurantId" integer,
                CONSTRAINT "PK_246dfbfa0f3b0a4e953f7490544" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "menu_item_option" (
                "id" SERIAL NOT NULL,
                "name" character varying NOT NULL,
                "is_required" boolean NOT NULL,
                "is_multiple_choice" boolean NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_3eebb5719a58ccf588a601f74dd" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "menu_category"
            ADD CONSTRAINT "FK_4f1d952339a20edaa4164e4bf70" FOREIGN KEY ("restaurantId") REFERENCES "restaurant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "menu_category" DROP CONSTRAINT "FK_4f1d952339a20edaa4164e4bf70"
        `);
        await queryRunner.query(`
            DROP TABLE "menu_item_option"
        `);
        await queryRunner.query(`
            DROP TABLE "menu_category"
        `);
    }

}
