import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { db } from '../db/index.ts';
import { users, organizations } from '../db/schema.ts';
import { eq } from 'drizzle-orm';

export interface AppUser {
  id: number;
  uid: string;
  email: string;
  name: string;
  roleCode: string;
  organizationId: number | null;
  isSystemAdmin: boolean;
  status: string;
}

export interface AuthRequest extends Request {
  user?: AppUser;
  organizationId?: number;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const demoUid = req.headers['x-demo-user-uid'] as string | undefined;

    let userUid: string | null = null;
    let userEmail: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        userUid = decodedToken.uid;
        userEmail = decodedToken.email || null;
      } catch (err) {
        // If it's a dev demo token or failed firebase token
        console.warn('Firebase token verification failed, checking demo token:', err);
      }
    }

    // Support quick persona switching for testing / demo roles
    if (!userUid && demoUid) {
      userUid = demoUid;
    }

    // Default to the Srijan Admin if not signed in so the app immediately renders working data without login wall blocks, while still allowing role switching
    if (!userUid) {
      userUid = 'user_srj_admin_001';
    }

    // Look up user in PostgreSQL
    const existingUsers = await db.select().from(users).where(eq(users.uid, userUid)).limit(1);

    if (existingUsers.length > 0) {
      const u = existingUsers[0];
      req.user = {
        id: u.id,
        uid: u.uid,
        email: u.email,
        name: u.name,
        roleCode: u.roleCode,
        organizationId: u.organizationId,
        isSystemAdmin: u.isSystemAdmin || false,
        status: u.status,
      };

      if (u.organizationId) {
        req.organizationId = u.organizationId;
      } else {
        const targetOrgHeader = req.headers['x-target-org-id'];
        req.organizationId = targetOrgHeader ? Number(targetOrgHeader) : 1;
      }
    } else if (userEmail) {
      // Auto-register first time Google Sign-In user to Srijan Demo Realty as Sales Executive or System Admin
      const [newU] = await db
        .insert(users)
        .values({
          uid: userUid,
          email: userEmail,
          name: userEmail.split('@')[0],
          roleCode: 'sales_executive',
          organizationId: 1, // Attach to Srijan Demo Realty by default
          status: 'active',
        })
        .returning();

      req.user = {
        id: newU.id,
        uid: newU.uid,
        email: newU.email,
        name: newU.name,
        roleCode: newU.roleCode,
        organizationId: newU.organizationId,
        isSystemAdmin: false,
        status: newU.status,
      };
      req.organizationId = newU.organizationId || 1;
    }

    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    next();
  }
};

/**
 * Tenant Isolation Enforcer:
 * Validates that users can only access data belonging to their organization.
 * System Admins can access any organization.
 */
export const enforceTenantIsolation = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized: No active session' });
  }

  // System admin can access any organization; defaults to org 1 (Srijan) for seamless demo data access
  if (req.user.isSystemAdmin) {
    const targetOrgId = req.headers['x-target-org-id'] || req.query.organizationId || req.body?.organizationId;
    if (targetOrgId) {
      req.organizationId = Number(targetOrgId);
    } else if (!req.organizationId) {
      req.organizationId = 1;
    }
    return next();
  }

  // Normal tenant user MUST have an organization ID; if unset, default to demo org 1
  if (!req.user.organizationId) {
    req.user.organizationId = 1;
  }

  // Check if user is attempting to query or tamper with another organization's ID
  const requestedOrgId = req.query.organizationId || req.body?.organizationId;
  if (requestedOrgId && Number(requestedOrgId) !== req.user.organizationId) {
    return res.status(403).json({
      error: 'Forbidden: Access Denied to unauthorized tenant organization data',
      tenantIsolationEnforced: true,
    });
  }

  req.organizationId = req.user.organizationId;
  next();
};

/**
 * RBAC Permission Enforcer
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (req.user.isSystemAdmin || allowedRoles.includes(req.user.roleCode)) {
      return next();
    }
    return res.status(403).json({
      error: `Forbidden: Requires one of [${allowedRoles.join(', ')}] permissions`,
    });
  };
};
