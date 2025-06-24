import { MigrationInterface, QueryRunner } from "typeorm";

export class Updatecolumn1741008044610 implements MigrationInterface {
    name = 'Updatecolumn1741008044610'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "restaurant"
            ADD "is_open" boolean NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "restaurant" DROP COLUMN "is_open"
        `);
    }

}
