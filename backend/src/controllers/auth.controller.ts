import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { sendSuccess, sendCreated, sendError, sendUnauthorized } from '../utils/response';
import { logger } from '../utils/logger';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await authService.register(req.body);
    sendCreated(res, { id: user.id, email: user.email, name: user.name, role: user.role }, 'Compte créé');
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);

    if (!result) {
      sendUnauthorized(res, 'Email ou mot de passe incorrect');
      return;
    }

    sendSuccess(res, result, 'Connexion réussie');
  } catch (error) {
    if ((error as Error).message === 'ACCOUNT_LOCKED') {
      sendError(res, 'Compte verrouillé temporairement suite à trop de tentatives', 423);
      return;
    }
    next(error);
  }
};
