import { Migration } from '@mikro-orm/migrations';

export class Migration20260123090853_Initial extends Migration {
  override async up(): Promise<void> {
    await Promise.resolve(this.addSql(`select 1`));
  }

  override async down(): Promise<void> {
    await Promise.resolve(this.addSql(`select 1`));
  }
}
