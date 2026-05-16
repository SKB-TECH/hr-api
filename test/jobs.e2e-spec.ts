import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobsModule } from '../src/modules/jobs/jobs.module';
import { Job } from '../src/modules/jobs/entities/job.entity';
import { JobApplication } from '../src/modules/jobs/entities/job-application.entity';
import { GlobalExceptionFilter } from '../src/common/errors/global-exception.filter';

describe('Jobs (e2e)', () => {
  let app: INestApplication;
  let createdJobId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST ?? 'localhost',
          port: Number(process.env.DB_PORT) ?? 5432,
          username: process.env.DB_USERNAME ?? 'postgres',
          password: process.env.DB_PASSWORD ?? 'postgres',
          database: process.env.DB_NAME ?? 'hr_api',
          entities: [Job, JobApplication],
          synchronize: true,
        }),
        JobsModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ── CREATE JOB ────────────────────────────────────────────────────────────

  it('POST /api/jobs — creates a job (admin)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/jobs')
      .set('Authorization', 'Bearer test-token')
      .send({
        title: 'Frontend Developer',
        location: 'Manchester, UK',
        salaryMin: 45000,
        salaryMax: 65000,
        salaryExtras: 'Bonus + Pension + Benefits',
        jobType: 'Hybrid, Permanent',
        reference: '#ITEM#2038-234',
        description: 'UK Leading Ecommerce Firm test description.',
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Frontend Developer');
    createdJobId = res.body.data.id;
  });

  // ── GET JOB ───────────────────────────────────────────────────────────────

  it('GET /api/jobs/:id — returns job detail', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/jobs/${createdJobId}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(createdJobId);
    expect(res.body.data.title).toBe('Frontend Developer');
    expect(res.body.data.salaryMin).toBe(45000);
    expect(res.body.data.salaryMax).toBe(65000);
  });

  it('GET /api/jobs/:id — returns 404 for unknown id', async () => {
    await request(app.getHttpServer())
      .get('/api/jobs/00000000-0000-0000-0000-000000000000')
      .expect(404);
  });

  // ── APPLY ─────────────────────────────────────────────────────────────────

  it('POST /api/jobs/:id/apply — submits application', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/jobs/${createdJobId}/apply`)
      .send({
        fullName: 'John Smith',
        email: 'john@example.com',
        contactNumber: '+250788123456',
        coverLetter: 'I am very interested in this role.',
      })
      .expect(201);

    expect(res.body.success).toBe(true);
  });

  it('POST /api/jobs/:id/apply — returns 400 for invalid data', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/jobs/${createdJobId}/apply`)
      .send({ fullName: '', email: 'not-an-email', contactNumber: '', coverLetter: '' })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  // ── AUTH GUARD ────────────────────────────────────────────────────────────

  it('POST /api/jobs — returns 401 without auth token', async () => {
    await request(app.getHttpServer())
      .post('/api/jobs')
      .send({ title: 'Test' })
      .expect(401);
  });

  // ── UPDATE ────────────────────────────────────────────────────────────────

  it('PUT /api/jobs/:id — updates job (admin)', async () => {
    const res = await request(app.getHttpServer())
      .put(`/api/jobs/${createdJobId}`)
      .set('Authorization', 'Bearer test-token')
      .send({ salaryMin: 50000, salaryMax: 70000 })
      .expect(200);

    expect(res.body.data.salaryMin).toBe(50000);
  });

  // ── DELETE ────────────────────────────────────────────────────────────────

  it('DELETE /api/jobs/:id — deletes job (admin)', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/api/jobs/${createdJobId}`)
      .set('Authorization', 'Bearer test-token')
      .expect(200);

    expect(res.body.success).toBe(true);
  });
});
