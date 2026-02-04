import { Migration } from '@mikro-orm/migrations';

export class Migration20260203070853_AddRefreshTokens extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "refresh_token" (
        "id" SERIAL PRIMARY KEY,
        "token" VARCHAR(255) NOT NULL UNIQUE,
        "user_id" INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        "expires_at" TIMESTAMPTZ NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "revoked_at" TIMESTAMPTZ NULL,
        "revoked_by" VARCHAR(255) NULL,
        "user_agent" TEXT NULL,
        "ip_address" VARCHAR(255) NULL
      );
    `);

    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_refresh_token_user_id" ON "refresh_token" ("user_id");`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_refresh_token_token" ON "refresh_token" ("token");`);
  }

  override async down(): Promise<void> {
    this.addSql(`DROP INDEX IF EXISTS "idx_refresh_token_user_id";`);
    this.addSql(`DROP INDEX IF EXISTS "idx_refresh_token_token";`);
    this.addSql(`DROP TABLE IF EXISTS "refresh_token" CASCADE;`);
  }
}
