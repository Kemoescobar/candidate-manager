import { AuthService } from '../../src/services/auth.service';
import { setupTestDB } from '../helpers/db.helper';

setupTestDB();

process.env.JWT_SECRET = 'test-secret-key';

describe('AuthService', () => {
  let service: AuthService;
  const userData = { email: 'test@example.com', password: 'Password123', name: 'Test User' };

  beforeEach(() => {
    service = new AuthService();
  });

  describe('register()', () => {
    it('should register a new user', async () => {
      const user = await service.register(userData);
      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('Test User');
      expect(user.password).not.toBe('Password123'); // hashed
    });

    it('should throw on duplicate email', async () => {
      await service.register(userData);
      await expect(service.register(userData)).rejects.toThrow();
    });
  });

  describe('login()', () => {
    beforeEach(async () => {
      await service.register(userData);
    });

    it('should return token on valid credentials', async () => {
      const result = await service.login('test@example.com', 'Password123');
      expect(result).not.toBeNull();
      expect(result!.token).toBeDefined();
      expect(result!.user.email).toBe('test@example.com');
    });

    it('should return null on wrong password', async () => {
      const result = await service.login('test@example.com', 'wrongpassword');
      expect(result).toBeNull();
    });

    it('should return null on unknown email', async () => {
      const result = await service.login('unknown@example.com', 'Password123');
      expect(result).toBeNull();
    });
  });
});
