import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/database';
import { generateToken, requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware';
import { User, Organization, UserRole, OrganizationType } from '../db/types';

const router = Router();

// Demo accounts dictionary for quick testing
const DEMO_ACCOUNTS: Record<string, { email: string; role: UserRole }> = {
  donor: { email: 'donor@foodbridge.org', role: 'DONOR' },
  ngo: { email: 'ngo@foodbridge.org', role: 'RECIPIENT' },
  verified_ngo: { email: 'ngo@foodbridge.org', role: 'RECIPIENT' },
  pending_ngo: { email: 'hope@foodbridge.org', role: 'RECIPIENT' },
  volunteer: { email: 'volunteer@foodbridge.org', role: 'VOLUNTEER' },
  admin: { email: 'admin@foodbridge.org', role: 'ADMIN' },
};

// POST /api/auth/register
router.post('/register', async (req, res): Promise<void> => {
  try {
    const {
      name,
      email,
      password,
      role,
      organizationName,
      organizationType,
      description,
      address,
      latitude,
      longitude,
      phone,
      contactPerson,
      capacityMeals,
    } = req.body;

    if (!name || !email || !password || !role) {
      res.status(400).json({ error: 'Missing required registration fields.' });
      return;
    }

    if (role !== 'DONOR' && role !== 'RECIPIENT' && role !== 'VOLUNTEER') {
      res.status(400).json({ error: 'Role must be DONOR, RECIPIENT, or VOLUNTEER.' });
      return;
    }

    const existing = db.getUserByEmail(email);
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const newUser: User = {
      id: userId,
      name,
      email,
      passwordHash,
      role,
      accountStatus: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };

    await db.createUser(newUser);

    let newOrg: Organization | null = null;
    if (role === 'VOLUNTEER') {
      await db.updateVolunteerProfile(userId, {
        fullName: name,
        phone: phone || '+91 98490 00000',
        vehicleType: req.body.vehicleType || 'MOTORCYCLE',
        vehicleNumber: req.body.vehicleNumber || 'TS 09 AB 1234',
        isAvailable: true,
      });
    } else {
      // Create corresponding organization for DONOR or RECIPIENT
      const orgId = `org_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      newOrg = {
        id: orgId,
        userId,
        organizationName: organizationName || `${name}'s Organization`,
        organizationType: organizationType || (role === 'DONOR' ? 'RESTAURANT' : 'NGO'),
        description: description || `${organizationName || name} registered on FoodBridge AI`,
        address: address || 'Hyderabad, Telangana',
        latitude: Number(latitude) || 17.4156,
        longitude: Number(longitude) || 78.4350,
        contactDetails: {
          phone: phone || '+91 40 0000 0000',
          contactPerson: contactPerson || name,
        },
        // IMPORTANT BUSINESS RULE: Recipients start as PENDING until verified by Admin. Donors start as VERIFIED.
        verificationStatus: role === 'DONOR' ? 'VERIFIED' : 'PENDING',
        capacityMeals: Number(capacityMeals) || 50,
        createdAt: now,
        updatedAt: now,
      };

      await db.createOrganization(newOrg);
    }

    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      organizationId: newOrg?.id,
      organizationName: newOrg?.organizationName,
    });

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
      organization: newOrg,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Registration failed.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const user = db.getUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    if (user.accountStatus === 'SUSPENDED') {
      res.status(403).json({ error: 'This account has been suspended by administration.' });
      return;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const org = db.getOrganizationByUserId(user.id);
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: org?.id,
      organizationName: org?.organizationName,
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      organization: org || null,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Login failed.' });
  }
});

// POST /api/auth/quick-login (Frictionless 1-click login for judges and demo testing)
router.post('/quick-login', (req, res): void => {
  try {
    const { accountType } = req.body;
    const target = DEMO_ACCOUNTS[accountType];

    if (!target) {
      res.status(400).json({ error: 'Invalid demo account type.' });
      return;
    }

    const user = db.getUserByEmail(target.email);
    if (!user) {
      res.status(404).json({ error: 'Demo account not found.' });
      return;
    }

    const org = db.getOrganizationByUserId(user.id);
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: org?.id,
      organizationName: org?.organizationName,
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      organization: org || null,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Demo quick login failed.' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const user = db.getUserById(req.user.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  const org = db.getOrganizationByUserId(user.id);

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      accountStatus: user.accountStatus,
    },
    organization: org || null,
  });
});

// POST /api/auth/logout
router.post('/logout', (_req, res): void => {
  res.json({ message: 'Successfully logged out.' });
});

export default router;
