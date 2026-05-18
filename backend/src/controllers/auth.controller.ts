import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { sendSuccess, sendCreated, sendError, sendUnauthorized } from '../utils/response';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await authService.register(req.body as { email: string; password: string; name: string; role?: string });
    sendCreated(res, { id: user.id, email: user.email, name: user.name, role: user.role }, 'Compte créé');
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body as { email: string; password: string };
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
