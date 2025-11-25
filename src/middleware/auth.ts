import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
        return next();
    }

    throw new AppError('Authentication required', 401);
};
