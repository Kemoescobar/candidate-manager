import request from 'supertest';
import { createApp } from '../../src/app';
import { setupTestDB } from '../helpers/db.helper';
import { authService } from '../../src/services/auth.service';

setupTestDB();

process.env.JWT_SECRET = 'test-secret-key';
process.env.NODE_ENV = 'test';

const app = createApp();

describe('Candidates API Integration', () => {
  let token: string;

  const candidatePayload = {
    firstName: 'Marie',
    lastName: 'Martin',
    email: 'marie.martin@example.com',
    position: 'Full Stack Developer',
    experience: 4,
    skills: ['React', 'Node.js'],
  };

  beforeEach(async () => {
    await authService.register({ email: 'admin@test.com', password: 'Admin1234', name: 'Admin' });
    const result = await authService.login('admin@test.com', 'Admin1234');
    token = result!.token;
  });

  describe('POST /api/candidates', () => {
    it('should create a candidate with valid data', async () => {
      const res = await request(app)
        .post('/api/candidates')
        .set('Authorization', `Bearer ${token}`)
        .send(candidatePayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('marie.martin@example.com');
    });

    it('should return 422 with invalid data', async () => {
      const res = await request(app)
        .post('/api/candidates')
        .set('Authorization', `Bearer ${token}`)
        .send({ firstName: 'X' });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 without token', async () => {
      const res = await request(app).post('/api/candidates').send(candidatePayload);
      expect(res.status).toBe(401);
    });

    it('should prevent SQL injection via email field', async () => {
      const res = await request(app)
        .post('/api/candidates')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...candidatePayload, email: "' OR '1'='1" });

      expect(res.status).toBe(422);
    });
  });

  describe('GET /api/candidates/:id', () => {
    it('should retrieve a candidate by id', async () => {
      const created = await request(app)
        .post('/api/candidates')
        .set('Authorization', `Bearer ${token}`)
        .send(candidatePayload);

      const id = created.body.data.id;

      const res = await request(app)
        .get(`/api/candidates/${id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(id);
    });

    it('should return 404 for non-existing id', async () => {
      const res = await request(app)
        .get('/api/candidates/64f000000000000000000000')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/candidates/:id', () => {
    it('should partially update a candidate', async () => {
      const created = await request(app)
        .post('/api/candidates')
        .set('Authorization', `Bearer ${token}`)
        .send(candidatePayload);

      const id = created.body.data.id;

      const res = await request(app)
        .put(`/api/candidates/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ position: 'Senior Developer' });

      expect(res.status).toBe(200);
      expect(res.body.data.position).toBe('Senior Developer');
    });
  });

  describe('DELETE /api/candidates/:id', () => {
    it('should soft delete a candidate', async () => {
      const created = await request(app)
        .post('/api/candidates')
        .set('Authorization', `Bearer ${token}`)
        .send(candidatePayload);

      const id = created.body.data.id;

      const res = await request(app)
        .delete(`/api/candidates/${id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);

      // Verify it no longer returns
      const getRes = await request(app)
        .get(`/api/candidates/${id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(getRes.status).toBe(404);
    });
  });

  describe('POST /api/candidates/:id/validate', () => {
    it('should validate a candidate asynchronously', async () => {
      const created = await request(app)
        .post('/api/candidates')
        .set('Authorization', `Bearer ${token}`)
        .send(candidatePayload);

      const id = created.body.data.id;

      const res = await request(app)
        .post(`/api/candidates/${id}/validate`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(['validated', 'rejected']).toContain(res.body.data.status);
      expect(res.body.data.validatedAt).toBeDefined();
    }, 10000);
  });

  describe('GET /api/candidates', () => {
    it('should return paginated list', async () => {
      await request(app)
        .post('/api/candidates')
        .set('Authorization', `Bearer ${token}`)
        .send(candidatePayload);

      const res = await request(app)
        .get('/api/candidates?page=1&limit=10')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.pagination).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});

describe('Auth API Integration', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'new@test.com', password: 'Password123', name: 'New User' });

      expect(res.status).toBe(201);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await authService.register({ email: 'login@test.com', password: 'Password123', name: 'Login User' });
    });

    it('should login successfully', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login@test.com', password: 'Password123' });

      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();
    });

    it('should return 401 for wrong credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login@test.com', password: 'wrongpass' });

      expect(res.status).toBe(401);
    });
  });
});
