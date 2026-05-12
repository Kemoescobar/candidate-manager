import { CandidateService } from '../../src/services/candidate.service';
import { Candidate } from '../../src/models/candidate.model';
import { setupTestDB } from '../helpers/db.helper';

setupTestDB();

const mockCandidateData = {
  firstName: 'Jean',
  lastName: 'Dupont',
  email: 'jean.dupont@example.com',
  position: 'Développeur Full Stack',
  experience: 5,
  skills: ['TypeScript', 'React', 'Node.js'],
  status: 'pending' as const,
};

describe('CandidateService', () => {
  let service: CandidateService;

  beforeEach(() => {
    service = new CandidateService();
  });

  describe('create()', () => {
    it('should create a candidate successfully', async () => {
      const result = await service.create(mockCandidateData);
      expect(result.firstName).toBe('Jean');
      expect(result.email).toBe('jean.dupont@example.com');
      expect(result.status).toBe('pending');
      expect(result.id).toBeDefined();
    });

    it('should throw on duplicate email', async () => {
      await service.create(mockCandidateData);
      await expect(service.create(mockCandidateData)).rejects.toThrow();
    });
  });

  describe('findById()', () => {
    it('should find an existing candidate', async () => {
      const created = await service.create(mockCandidateData);
      const found = await service.findById(created.id);
      expect(found).not.toBeNull();
      expect(found!.email).toBe('jean.dupont@example.com');
    });

    it('should return null for non-existing id', async () => {
      const result = await service.findById('64f0000000000000000000000'.replace(/0+$/, '0'.repeat(24 - 3)));
      // Use a valid ObjectId format
      const { Types } = await import('mongoose');
      const fakeId = new Types.ObjectId().toString();
      const found = await service.findById(fakeId);
      expect(found).toBeNull();
      // Suppress unused var warning
      void result;
    });

    it('should not return a soft-deleted candidate', async () => {
      const created = await service.create(mockCandidateData);
      await service.softDelete(created.id);
      const found = await service.findById(created.id);
      expect(found).toBeNull();
    });
  });

  describe('update()', () => {
    it('should partially update a candidate', async () => {
      const created = await service.create(mockCandidateData);
      const updated = await service.update(created.id, { position: 'Tech Lead' });
      expect(updated!.position).toBe('Tech Lead');
      expect(updated!.firstName).toBe('Jean'); // unchanged
    });

    it('should return null for non-existing candidate', async () => {
      const { Types } = await import('mongoose');
      const fakeId = new Types.ObjectId().toString();
      const result = await service.update(fakeId, { position: 'Test' });
      expect(result).toBeNull();
    });
  });

  describe('softDelete()', () => {
    it('should soft delete a candidate', async () => {
      const created = await service.create(mockCandidateData);
      const deleted = await service.softDelete(created.id);
      expect(deleted!.status).toBe('deleted');
      expect(deleted!.deletedAt).toBeDefined();
    });

    it('should return null for already deleted candidate', async () => {
      const created = await service.create(mockCandidateData);
      await service.softDelete(created.id);
      const result = await service.softDelete(created.id);
      expect(result).toBeNull();
    });
  });

  describe('validate()', () => {
    it('should validate a valid candidate', async () => {
      const created = await service.create(mockCandidateData);
      const validated = await service.validate(created.id);
      expect(validated!.status).toBe('validated');
      expect(validated!.validatedAt).toBeDefined();
    }, 10000);

    it('should return null for non-existing candidate', async () => {
      const { Types } = await import('mongoose');
      const fakeId = new Types.ObjectId().toString();
      const result = await service.validate(fakeId);
      expect(result).toBeNull();
    }, 10000);
  });

  describe('list()', () => {
    beforeEach(async () => {
      await Candidate.insertMany([
        { ...mockCandidateData, email: 'a@test.com' },
        { ...mockCandidateData, email: 'b@test.com', position: 'Designer' },
        { ...mockCandidateData, email: 'c@test.com', status: 'validated' },
      ]);
    });

    it('should return paginated results', async () => {
      const result = await service.list({ page: 1, limit: 2, sortBy: 'createdAt', sortOrder: 'desc' });
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(3);
      expect(result.totalPages).toBe(2);
    });

    it('should filter by position', async () => {
      const result = await service.list({ page: 1, limit: 10, position: 'Designer', sortBy: 'createdAt', sortOrder: 'desc' });
      expect(result.data).toHaveLength(1);
    });

    it('should search across name fields', async () => {
      const result = await service.list({ page: 1, limit: 10, search: 'Dupont', sortBy: 'createdAt', sortOrder: 'desc' });
      expect(result.data.length).toBeGreaterThan(0);
    });
  });
});
