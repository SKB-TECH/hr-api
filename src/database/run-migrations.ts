import { connectionSource } from './config/datasource';

async function runMigrations() {
  await connectionSource.initialize();
  try {
    const migrations = await connectionSource.runMigrations({
      transaction: 'all',
    });
    console.log(
      migrations.length
        ? `Applied migrations: ${migrations.map(({ name }) => name).join(', ')}`
        : 'Database schema is up to date',
    );
  } finally {
    await connectionSource.destroy();
  }
}

void runMigrations().catch((error: unknown) => {
  console.error('Database migration failed', error);
  process.exitCode = 1;
});
