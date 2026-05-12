import jwt from 'jsonwebtoken';
import { User, IUserDocument } from '../models/user.model';
import { logger } from '../utils/logger';

export interface LoginResult {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export class AuthService {
  async register(data: { email: string; password: string; name: string; role?: string }): Promise<IUserDocument> {
    logger.info('Registering user', { email: data.email });
    const user = new User(data);
    return user.save();
  }

  async login(email: string, password: string): Promise<LoginResult | null> {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      logger.warn('Login attempt with unknown email', { email });
      return null;
    }

    if (user.isLocked()) {
      logger.warn('Login attempt on locked account', { email });
      throw new Error('ACCOUNT_LOCKED');
    }

    const isValid = await user.comparePassword(password);

    if (!isValid) {
      await user.incrementLoginAttempts();
      logger.warn('Invalid password attempt', { email });
      return null;
    }

    await user.resetLoginAttempts();

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET not configured');

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      secret,
      { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'] }
    );

    logger.info('User logged in', { email, role: user.role });

    return {
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }

  async findById(id: string): Promise<IUserDocument | null> {
    return User.findById(id).select('-password');
  }
}

export const authService = new AuthService();
