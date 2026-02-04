# MikroORM – Database Setup (Dev)

This project uses **MikroORM + PostgreSQL** with:
- Entity-driven schema
- Migrations for schema history
- Seeders for initial / fake data
- Optional force-sync during early development

---

## 1. Prerequisites

- PostgreSQL running
- `.env` file with a valid connection string:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/db_name
```

> MikroORM does **not** create the database itself — only tables inside an existing database.

---

## 2. Initial Table Creation (Recommended Path)

Use migrations as the source of truth, even in development.

### Generate initial migration

Run this **once** when the database is empty:

```bash
npx mikro-orm migration:create
```

This will:
- Compare entities with the empty database
- Generate SQL to create all tables
- Save the migration in `src/migrations`

### Apply migration

```bash
npx mikro-orm migration:up
```

Result:
- All tables are created
- Schema changes are now tracked

---

## 3. Force Schema Sync (Dev Only)

Use this only during early development when data does not matter.

### Sync schema without migrations

```bash
npx mikro-orm schema:update --run
```

### Drop everything and recreate

```bash
npx mikro-orm schema:update --run --drop-tables
```

> ⚠️ Never use `schema:update` in production.

---

## 4. Seeding Initial Data

Seeding is used for:
- Initial admin users
- Demo organizations
- Development and test data
- Consistent local setups

### 4.1 Enable SeedManager

Update `mikro-orm.config.ts`:

```ts
import { defineConfig } from '@mikro-orm/postgresql';
import { SeedManager } from '@mikro-orm/seeder';

export default defineConfig({
  clientUrl: process.env.DATABASE_URL,
  entities: ['./dist/entities'],
  entitiesTs: ['./src/entities'],

  migrations: {
    path: 'dist/migrations',
    pathTs: 'src/migrations',
  },

  extensions: [SeedManager],
});
```

---

### 4.2 Create a Seeder

```bash
npx mikro-orm seeder:create DatabaseSeeder
```

This creates:

```ts
src/seeders/DatabaseSeeder.ts
```

---

### 4.3 Example Seeder

```ts
import { Seeder } from '@mikro-orm/seeder';
import { EntityManager } from '@mikro-orm/postgresql';
import { Organization } from '../entities/Organization';
import { User } from '../entities/User';

export class DatabaseSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const org = em.create(Organization, {
      name: 'Demo Organization',
    });

    em.create(User, {
      email: 'admin@ilmi.com',
      password: 'hashed-password',
      organization: org,
      role: 'admin',
    });
  }
}
```

Notes:
- `em.create()` does not immediately write to the database
- Seeders run inside a transaction
- Flush is handled automatically

---

### 4.4 Run Seeders

```bash
npx mikro-orm seeder:run
```

Run a specific seeder:

```bash
npx mikro-orm seeder:run --class=DatabaseSeeder
```

---

## 5. Typical Development Workflow

### Fresh setup

```bash
npx mikro-orm migration:create
npx mikro-orm migration:up
npx mikro-orm seeder:run
```

### Early experimentation

```bash
npx mikro-orm schema:update --run --drop-tables
npx mikro-orm seeder:run
```

### Before serious development

- Reset database
- Regenerate a clean migration
- Stop using `schema:update`

---

## 6. Mental Model

- **Entities** → blueprint
- **Migrations** → legal record of schema changes
- **Seeders** → controlled initial data
- **schema:update** → temporary bulldozer

Mixing these carelessly leads to unstable schemas.

---

## 7. Rules to Follow

- Never use `schema:update` in production
- Always commit migrations
- Do not assume seed data exists in production
- Avoid manually editing migration SQL unless necessary

---

This setup scale