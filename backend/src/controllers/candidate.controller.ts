import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { candidateService } from '../services/candidate.service';
import {
  sendSuccess,
  sendCreated,
  sendNotFound,
} from '../utils/response';
import { logger } from '../utils/logger';
import { ICandidate } from '../models/candidate.model';

export const createCandidate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const candidate = await candidateService.create(req.body as ICandidate);
    logger.info('Candidate created', { id: candidate.id, createdBy: req.user?.email });
    sendCreated(res, candidate, 'Candidat créé avec succès');
  } catch (error) {
    next(error);
  }
};

export const getCandidate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const candidate = await candidateService.findById(req.params.id);
    if (!candidate) {
      sendNotFound(res, 'Candidat introuvable');
      return;
    }
    sendSuccess(res, candidate);
  } catch (error) {
    next(error);
  }
};

export const updateCandidate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const candidate = await candidateService.update(req.params.id, req.body as Partial<ICandidate>);
    if (!candidate) {
      sendNotFound(res, 'Candidat introuvable');
      return;
    }
    sendSuccess(res, candidate, 'Candidat mis à jour avec succès');
  } catch (error) {
    next(error);
  }
};

export const deleteCandidate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const candidate = await candidateService.softDelete(req.params.id);
    if (!candidate) {
      sendNotFound(res, 'Candidat introuvable');
      return;
    }
    sendSuccess(res, null, 'Candidat supprimé avec succès');
  } catch (error) {
    next(error);
  }
};

export const validateCandidate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const candidate = await candidateService.validate(req.params.id);
    if (!candidate) {
      sendNotFound(res, 'Candidat introuvable');
      return;
    }
    sendSuccess(res, candidate, `Candidat ${candidate.status === 'validated' ? 'validé' : 'rejeté'}`);
  } catch (error) {
    next(error);
  }
};

export const listCandidates = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await candidateService.list({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
      status: req.query.status as string | undefined,
      position: req.query.position as string | undefined,
      search: req.query.search as string | undefined,
      sortBy: (req.query.sortBy as string) || 'createdAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    });

    sendSuccess(res, result.data, undefined, 200, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (error) {
    next(error);
  }
};
