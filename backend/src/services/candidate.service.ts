import { FilterQuery } from 'mongoose';
import { Candidate, ICandidate, ICandidateDocument } from '../models/candidate.model';
import { logger } from '../utils/logger';

export interface CandidateListOptions {
  page: number;
  limit: number;
  status?: string;
  position?: string;
  search?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class CandidateService {
  async create(data: ICandidate): Promise<ICandidateDocument> {
    logger.info('Creating candidate', { email: data.email });
    const candidate = new Candidate(data);
    return candidate.save();
  }

  async findById(id: string): Promise<ICandidateDocument | null> {
    return Candidate.findOne({ _id: id, status: { $ne: 'deleted' } });
  }

  async update(id: string, data: Partial<ICandidate>): Promise<ICandidateDocument | null> {
    logger.info('Updating candidate', { id });
    return Candidate.findOneAndUpdate(
      { _id: id, status: { $ne: 'deleted' } },
      { $set: data },
      { new: true, runValidators: true }
    );
  }

  async softDelete(id: string): Promise<ICandidateDocument | null> {
    logger.info('Soft deleting candidate', { id });
    return Candidate.findOneAndUpdate(
      { _id: id, status: { $ne: 'deleted' } },
      { $set: { status: 'deleted', deletedAt: new Date() } },
      { new: true }
    );
  }

  async validate(id: string): Promise<ICandidateDocument | null> {
    logger.info('Validating candidate', { id });
    // Simulate async validation with 2s delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const candidate = await Candidate.findOne({ _id: id, status: { $ne: 'deleted' } });
    if (!candidate) return null;

    // Simulate validation logic
    const isValid = this.runValidationRules(candidate);

    return Candidate.findByIdAndUpdate(
      id,
      {
        $set: {
          status: isValid ? 'validated' : 'rejected',
          validatedAt: new Date(),
        },
      },
      { new: true }
    );
  }

  private runValidationRules(candidate: ICandidateDocument): boolean {
    if (candidate.skills.length === 0) return false;
    if (candidate.experience < 0) return false;
    if (!candidate.email) return false;
    return true;
  }

  async list(options: CandidateListOptions): Promise<PaginatedResult<ICandidateDocument>> {
    const { page, limit, status, position, search, sortBy, sortOrder } = options;
    const skip = (page - 1) * limit;

    const filter: FilterQuery<ICandidateDocument> = {
      status: { $ne: 'deleted' },
    };

    if (status) filter.status = status;
    if (position) filter.position = { $regex: position, $options: 'i' };
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      Candidate.find(filter)
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit),
      Candidate.countDocuments(filter),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export const candidateService = new CandidateService();
