import * as bcrypt from 'bcrypt';
import { connectionSource } from './config/datasource';
import { User } from '../app/modules/users/entities/user.entity';
import { AuthProvider, UserRole, UserStatus } from '../utils/enums';

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const fullName = process.env.ADMIN_FULL_NAME?.trim() || 'Platform Admin';

  if (!email) throw new Error('ADMIN_EMAIL is required');

  await connectionSource.initialize();
  try {
    const users = connectionSource.getRepository(User);
    const existing = await users.findOne({ where: { email } });

    if (existing) {
      existing.role = UserRole.ADMIN;
      existing.status = UserStatus.active;
      existing.emailVerified = true;
      if (password) {
        if (password.length < 8)
          throw new Error('ADMIN_PASSWORD must contain at least 8 characters');
        existing.password = await bcrypt.hash(password, 10);
        existing.provider = AuthProvider.local;
      }
      await users.save(existing);
      console.log(`Administrator promoted: ${email}`);
      return;
    }

    if (!password || password.length < 8) {
      throw new Error(
        'ADMIN_PASSWORD with at least 8 characters is required for a new account',
      );
    }

    await users.save(
      users.create({
        email,
        fullName,
        password: await bcrypt.hash(password, 10),
        role: UserRole.ADMIN,
        profiles: ['COMPANY'],
        activeProfile: 'COMPANY',
        status: UserStatus.active,
        provider: AuthProvider.local,
        emailVerified: true,
        phoneVerified: false,
      }),
    );
    console.log(`Administrator created: ${email}`);
  } finally {
    await connectionSource.destroy();
  }
}

void createAdmin().catch((error: unknown) => {
  console.error(
    'Administrator creation failed',
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
});
