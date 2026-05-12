import { Router } from 'express';
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

// Auth routes
router.post('/auth/register', validate(registerSchema), register);
router.post('/auth/login', validate(loginSchema), login);

// Candidate routes (protected)
router.get('/candidates', authenticate, validate(listCandidatesSchema, 'query'), listCandidates);
router.post('/candidates', authenticate, validate(createCandidateSchema), createCandidate);
router.get('/candidates/:id', authenticate, getCandidate);
router.put('/candidates/:id', authenticate, validate(updateCandidateSchema), updateCandidate);
router.delete('/candidates/:id', authenticate, deleteCandidate);
router.post('/candidates/:id/validate', authenticate, validateCandidate);

export default router;
