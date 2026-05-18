import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createCandidate,
  getCandidate,
  updateCandidate,
  deleteCandidate,
  validateCandidate,
  listCandidates,
} from '../controllers/candidate.controller';
import { register, login } from '../controllers/auth.controller';
import {
  createCandidateSchema,
  updateCandidateSchema,
  loginSchema,
  registerSchema,
  listCandidatesSchema,
} from '../validators/candidate.validator';

const router = Router();

// Async handler wrapper for routes
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => 
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// Auth routes
router.post('/auth/register', validate(registerSchema), asyncHandler(register));
router.post('/auth/login', validate(loginSchema), asyncHandler(login));

// Candidate routes (protected)
router.get('/candidates', authenticate, validate(listCandidatesSchema, 'query'), asyncHandler(listCandidates));
router.post('/candidates', authenticate, validate(createCandidateSchema), asyncHandler(createCandidate));
router.get('/candidates/:id', authenticate, asyncHandler(getCandidate));
router.put('/candidates/:id', authenticate, validate(updateCandidateSchema), asyncHandler(updateCandidate));
router.delete('/candidates/:id', authenticate, asyncHandler(deleteCandidate));
router.post('/candidates/:id/validate', authenticate, asyncHandler(validateCandidate));

export default router;
