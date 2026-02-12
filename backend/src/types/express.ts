import { Request, Response, NextFunction } from 'express';

// Express handler types
export type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

export type RequestHandler = (req: Request, res: Response, next: NextFunction) => void;

// Auth request with user
export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

export type AuthRequestHandler = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => Promise<void>;
