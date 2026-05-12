import { createCandidateSchema, updateCandidateSchema, loginSchema } from '../../src/validators/candidate.validator';

describe('createCandidateSchema', () => {
  const valid = {
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean@example.com',
    position: 'Developer',
    experience: 3,
    skills: ['TypeScript'],
  };

  it('should pass with valid data', () => {
    const { error } = createCandidateSchema.validate(valid);
    expect(error).toBeUndefined();
  });

  it('should fail without required fields', () => {
    const { error } = createCandidateSchema.validate({});
    expect(error).toBeDefined();
  });

  it('should fail with invalid email', () => {
    const { error } = createCandidateSchema.validate({ ...valid, email: 'not-an-email' });
    expect(error?.details[0].path).toContain('email');
  });

  it('should fail with empty skills array', () => {
    const { error } = createCandidateSchema.validate({ ...valid, skills: [] });
    expect(error).toBeDefined();
  });

  it('should fail with negative experience', () => {
    const { error } = createCandidateSchema.validate({ ...valid, experience: -1 });
    expect(error).toBeDefined();
  });

  it('should strip unknown fields', () => {
    const { value } = createCandidateSchema.validate({ ...valid, unknownField: 'test' }, { stripUnknown: true });
    expect((value as Record<string, unknown>).unknownField).toBeUndefined();
  });

  it('should fail with firstName too short', () => {
    const { error } = createCandidateSchema.validate({ ...valid, firstName: 'A' });
    expect(error?.details[0].path).toContain('firstName');
  });
});

describe('updateCandidateSchema', () => {
  it('should pass with partial data', () => {
    const { error } = updateCandidateSchema.validate({ position: 'Tech Lead' });
    expect(error).toBeUndefined();
  });

  it('should fail with empty object', () => {
    const { error } = updateCandidateSchema.validate({});
    expect(error).toBeDefined();
  });
});

describe('loginSchema', () => {
  it('should pass with valid credentials', () => {
    const { error } = loginSchema.validate({ email: 'user@example.com', password: 'Password1' });
    expect(error).toBeUndefined();
  });

  it('should fail with short password', () => {
    const { error } = loginSchema.validate({ email: 'user@example.com', password: '123' });
    expect(error).toBeDefined();
  });
});
