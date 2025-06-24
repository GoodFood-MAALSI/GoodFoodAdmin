import { MigrationInterface, QueryRunner } from "typeorm";

export class Resto1741007647995 implements MigrationInterface {
    name = 'Resto1741007647995'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" SERIAL NOT NULL,
                "name" character varying NOT NULL,
                "email" character varying NOT NULL,
                "phone" integer NOT NULL,
                "password" character varying NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
                CONSTRAINT "UQ_a000cca60bcf04454e727699490" UNIQUE ("phone"),
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "restaurant" (
                "id" SERIAL NOT NULL,
                "name" character varying NOT NULL,
                "description" character varying NOT NULL,
                "street_number" character varying NOT NULL,
                "street" character varying NOT NULL,
                "city" character varying NOT NULL,
                "postal_code" character varying NOT NULL,
                "country" character varying NOT NULL,
                "email" character varying NOT NULL,
                "phone_number" integer NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_d055cac5f0f06d57b0a3b1fe574" UNIQUE ("email"),
                CONSTRAINT "UQ_f5718b24886dfaa270caf66ca71" UNIQUE ("phone_number"),
                CONSTRAINT "PK_649e250d8b8165cb406d99aa30f" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "restaurant_type" (
                "id" SERIAL NOT NULL,
                "name" character varying NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_0ef112ff464f12ee18aac2c7fa9" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "menu_item" (
                "id" SERIAL NOT NULL,
                "name" character varying NOT NULL,
                "price" numeric(10, 2) NOT NULL DEFAULT '0',
                "description" character varying NOT NULL,
                "picture" character varying NOT NULL,
                "promotion" numeric(10, 2) NOT NULL DEFAULT '0',
                "isAvailable" boolean NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_722c4de0accbbfafc77947a8556" PRIMARY KEY ("id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE "menu_item"
        `);
        await queryRunner.query(`
            DROP TABLE "restaurant_type"
        `);
        await queryRunner.query(`
            DROP TABLE "restaurant"
        `);
        await queryRunner.query(`
            DROP TABLE "users"
        `);
    }

}
