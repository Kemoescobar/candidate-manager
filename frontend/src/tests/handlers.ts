import { http, HttpResponse } from 'msw';

const mockCandidates = [
  {
    id: 'abc123',
    firstName: 'Alice',
    lastName: 'Dupont',
    email: 'alice@example.com',
    position: 'Dev',
    experience: 3,
    skills: ['React'],
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const handlers = [
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as { email: string; password: string };
    if (body.email === 'test@test.com' && body.password === 'Password1') {
      return HttpResponse.json({
        success: true,
        data: { token: 'mock-token', user: { id: '1', email: 'test@test.com', name: 'Test', role: 'recruiter' } },
      });
    }
    return HttpResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }),

  http.get('/api/candidates', () => {
    return HttpResponse.json({
      success: true,
      data: mockCandidates,
      pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });
  }),

  http.get('/api/candidates/:id', ({ params }) => {
    const candidate = mockCandidates.find((c) => c.id === params.id);
    if (!candidate) return HttpResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    return HttpResponse.json({ success: true, data: candidate });
  }),

  http.post('/api/candidates', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({
      success: true,
      data: { ...body, id: 'new-id', status: 'pending', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    }, { status: 201 });
  }),

  http.put('/api/candidates/:id', async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ success: true, data: { ...mockCandidates[0], ...body, id: params.id } });
  }),

  http.delete('/api/candidates/:id', () => {
    return HttpResponse.json({ success: true, data: null, message: 'Supprimé' });
  }),

  http.post('/api/candidates/:id/validate', ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: { ...mockCandidates[0], id: params.id, status: 'validated', validatedAt: new Date().toISOString() },
      message: 'Candidat validé',
    });
  }),
];
