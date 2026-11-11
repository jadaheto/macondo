import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { bootApp } from './helpers';

describe('limitación de intentos de login', () => {
  let app: INestApplication;
  beforeAll(async () => {
    process.env.LOGIN_THROTTLE_LIMIT = '3';
    app = await bootApp();
  });
  afterAll(async () => {
    process.env.LOGIN_THROTTLE_LIMIT = '1000';
    await app?.close();
  });

  it('tras 3 intentos responde 429 con mensaje en español; otras rutas no se limitan', async () => {
    const body = { email: 'nadie@macondo.local', password: 'incorrecta123' };
    for (let i = 0; i < 3; i++) await request(app.getHttpServer()).post('/api/auth/login').send(body).expect(401);
    const res = await request(app.getHttpServer()).post('/api/auth/login').send(body).expect(429);
    expect(res.body.message).toMatch(/Demasiados intentos/);
    for (let i = 0; i < 5; i++) await request(app.getHttpServer()).get('/api/health').expect(200);
  });
});
