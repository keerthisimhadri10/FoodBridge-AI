import { Router, Response } from 'express';
import { db } from '../db/database';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth.middleware';

const router = Router();

// All routes here require ADMIN role
router.use(requireAuth);
router.use(requireRole('ADMIN'));

// GET /api/admin/dashboard
router.get('/dashboard', (_req, res): void => {
  const users = db.getUsers();
  const orgs = db.getOrganizations();
  const listings = db.getListings();
  const requests = db.getRequests();
  const reports = db.getReports();

  const donors = orgs.filter((o) =>
    ['RESTAURANT', 'HOTEL', 'BAKERY', 'SUPERMARKET', 'CATERER', 'COMMUNITY_KITCHEN'].includes(o.organizationType)
  );
  const recipients = orgs.filter((o) =>
    ['NGO', 'ORPHANAGE', 'SHELTER', 'CHARITY', 'COMMUNITY_GROUP'].includes(o.organizationType)
  );
  const verifiedRecipients = recipients.filter((r) => r.verificationStatus === 'VERIFIED');
  const pendingRecipients = recipients.filter((r) => r.verificationStatus === 'PENDING');

  const activeListings = listings.filter((l) => l.listingStatus === 'AVAILABLE' || l.listingStatus === 'PARTIALLY_RESERVED');
  const completedRequests = requests.filter((r) => r.requestStatus === 'COMPLETED');

  // Compute total meals redistributed from completed requests
  let totalMealsRedistributed = 0;
  for (const req of completedRequests) {
    const listing = db.getListingById(req.listingId);
    if (listing) {
      if (listing.unit === 'MEAL_BOXES' || listing.unit === 'PLATES') {
        totalMealsRedistributed += req.requestedQuantity;
      } else if (listing.unit === 'KILOGRAMS') {
        // 1 meal approx 0.4kg
        totalMealsRedistributed += Math.round(req.requestedQuantity / 0.4);
      } else {
        totalMealsRedistributed += Math.round(req.requestedQuantity * 1.5);
      }
    }
  }

  res.json({
    totalUsers: users.length,
    totalDonors: donors.length,
    totalRecipients: recipients.length,
    verifiedRecipients: verifiedRecipients.length,
    pendingVerifications: pendingRecipients.length,
    totalListings: listings.length,
    activeListings: activeListings.length,
    totalRequests: requests.length,
    completedDonations: completedRequests.length,
    totalMealsRedistributed,
    pendingReports: reports.filter((r) => r.reportStatus === 'PENDING').length,
  });
});

// GET /api/admin/users
router.get('/users', (_req, res): void => {
  const users = db.getUsers();
  const list = users.map((u) => {
    const org = db.getOrganizationByUserId(u.id);
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      accountStatus: u.accountStatus,
      createdAt: u.createdAt,
      organization: org
        ? {
            id: org.id,
            name: org.organizationName,
            type: org.organizationType,
            verificationStatus: org.verificationStatus,
          }
        : null,
    };
  });
  res.json(list);
});

// PATCH /api/admin/users/:id/status (Suspend or Reactivate)
router.patch('/users/:id/status', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    if (status !== 'ACTIVE' && status !== 'SUSPENDED') {
      res.status(400).json({ error: 'Status must be ACTIVE or SUSPENDED.' });
      return;
    }

    const user = db.getUserById(req.params.id);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    if (user.role === 'ADMIN') {
      res.status(400).json({ error: 'Cannot alter administrative master account status.' });
      return;
    }

    user.accountStatus = status;
    user.updatedAt = new Date().toISOString();

    res.json({ message: `User status changed to ${status}`, user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/organizations (All organizations for admin monitoring)
router.get('/organizations', (_req, res): void => {
  const orgs = db.getOrganizations();
  res.json(orgs);
});

// GET /api/admin/verifications
router.get('/verifications', (_req, res): void => {
  const orgs = db
    .getOrganizations()
    .filter((o) => ['NGO', 'ORPHANAGE', 'SHELTER', 'CHARITY', 'COMMUNITY_GROUP'].includes(o.organizationType));
  res.json(orgs);
});

// PATCH /api/admin/organizations/:id/verify
router.patch('/organizations/:id/verify', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { reason } = req.body;
    const org = await db.verifyOrganization(req.params.id, req.user.id, 'VERIFIED', reason);
    res.json({ message: 'Organization successfully verified.', organization: org });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Verification failed.' });
  }
});

// PATCH /api/admin/organizations/:id/reject
router.patch('/organizations/:id/reject', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { reason } = req.body;
    const org = await db.verifyOrganization(req.params.id, req.user.id, 'REJECTED', reason);
    res.json({ message: 'Organization verification rejected.', organization: org });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Rejection failed.' });
  }
});

// GET /api/admin/listings
router.get('/listings', (_req, res): void => {
  const listings = db.getListings().map((l) => {
    const org = db.getOrganizationById(l.donorOrganizationId);
    return {
      ...l,
      donorOrganizationName: org?.organizationName || 'Unknown Donor',
    };
  });
  res.json(listings);
});

// DELETE /api/admin/listings/:id (Admin moderation removal)
router.delete('/listings/:id', async (_req, res): Promise<void> => {
  try {
    const listing = db.getListingById(_req.params.id);
    if (!listing) {
      res.status(404).json({ error: 'Listing not found.' });
      return;
    }

    listing.listingStatus = 'REMOVED';
    listing.availableQuantity = 0;
    listing.updatedAt = new Date().toISOString();

    res.json({ message: 'Listing moderated and removed.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/reports
router.get('/reports', (_req, res): void => {
  const reports = db.getReports().map((r) => {
    const listing = db.getListingById(r.listingId);
    const reporter = db.getUserById(r.reportedBy);
    return {
      ...r,
      listingName: listing?.foodName || 'Unknown Listing',
      reporterEmail: reporter?.email || 'Anonymous',
    };
  });
  res.json(reports);
});

// PATCH /api/admin/reports/:id/resolve
router.patch('/reports/:id/resolve', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { status, details } = req.body;
    const resolved = await db.resolveReport(req.params.id, req.user.id, status || 'RESOLVED', details);
    res.json({ message: `Report marked ${status || 'RESOLVED'}`, report: resolved });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/admin/audit-logs
router.get('/audit-logs', (_req, res): void => {
  const logs = [...db.getAdminAuditLogs()].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  res.json(logs);
});

export default router;
