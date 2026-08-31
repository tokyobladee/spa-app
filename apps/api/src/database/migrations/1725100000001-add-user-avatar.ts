import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserAvatar1725100000001 implements MigrationInterface {
  name = "AddUserAvatar1725100000001";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN avatar_url varchar(2048) NULL AFTER home_page
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      DROP COLUMN avatar_url
    `);
  }
}
