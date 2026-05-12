import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { sendServerError, sendError } from '../utils/response';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;

  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    statusCode,
  });

  if (err.name === 'ValidationError') {
    sendError(res, 'Données invalides', 422);
    return;
  }

  if (err.name === 'CastError') {
    sendError(res, 'ID invalide', 400);
    return;
  }

  if ((err as NodeJS.ErrnoException).code === '11000') {
    sendError(res, 'Cette valeur existe déjà', 409);
    return;
  }

  if (err.isOperational) {
    sendError(res, err.message, statusCode);
    return;
  }

  sendServerError(res);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  sendError(res, `Route ${req.method} ${req.url} introuvable`, 404);
};
