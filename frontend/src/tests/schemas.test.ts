import { describe, it, expect } from 'vitest';
import { candidateSchema, loginSchema } from '../../utils/schemas';

describe('candidateSchema', () => {
  const valid = {
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean@example.com',
    position: 'Developer',
    experience: 3,
    skills: ['TypeScript'],
  };

  it('should pass with valid data', () => {
    const result = candidateSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('should fail with invalid email', () => {
    const result = candidateSchema.safeParse({ ...valid, email: 'bad-email' });
    expect(result.success).toBe(false);
  });

  it('should fail with empty skills', () => {
    const result = candidateSchema.safeParse({ ...valid, skills: [] });
    expect(result.success).toBe(false);
  });

  it('should fail with firstName too short', () => {
    const result = candidateSchema.safeParse({ ...valid, firstName: 'A' });
    expect(result.success).toBe(false);
  });

  it('should fail with negative experience', () => {
    const result = candidateSchema.safeParse({ ...valid, experience: -1 });
    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('should pass with valid credentials', () => {
    const result = loginSchema.safeParse({ email: 'a@b.com', password: 'Password1' });
    expect(result.success).toBe(true);
  });

  it('should fail with short password', () => {
    const result = loginSchema.safeParse({ email: 'a@b.com', password: '123' });
    expect(result.success).toBe(false);
  });

  it('should fail with invalid email', () => {
    const result = loginSchema.safeParse({ email: 'notvalid', password: 'Password1' });
    expect(result.success).toBe(false);
  });
});
