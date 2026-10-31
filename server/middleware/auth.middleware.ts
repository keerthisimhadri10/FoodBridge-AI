import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/database';
import { UserRole } from '../db/types';

const JWT_SECRET = process.env.JWT_SECRET || 'foodbridge_secure_jwt_secret_key_2026';

export interface AuthUserPayload {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId?: string;
  organizationName?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUserPayload;
}

export function generateToken(user: AuthUserPayload): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. No valid bearer token provided.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUserPayload;
    // Check if user still exists and is active
    const user = db.getUserById(decoded.id);
    if (!user) {
      res.status(401).json({ error: 'User account no longer exists.' });
      return;
    }
    if (user.accountStatus === 'SUSPENDED') {
      res.status(403).json({ error: 'User account has been suspended by administration.' });
      return;
    }

    const org = db.getOrganizationByUserId(user.id);
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: org?.id,
      organizationName: org?.organizationName,
    };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: `Forbidden: This resource requires one of [${roles.join(', ')}] permissions. Current role: ${req.user.role}.`,
      });
      return;
    }

    next();
  };
}
