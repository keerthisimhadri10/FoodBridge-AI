import { Router, Response } from 'express';
import { db } from '../db/database';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware';

const router = Router();

// GET /api/organizations
router.get('/', (req, res): void => {
  const { type, verificationStatus } = req.query;
  let orgs = db.getOrganizations();

  if (type) {
    orgs = orgs.filter((o) => o.organizationType === type);
  }
  if (verificationStatus) {
    orgs = orgs.filter((o) => o.verificationStatus === verificationStatus);
  }

  // Hide private sensitive info for public browse
  const sanitized = orgs.map((o) => ({
    id: o.id,
    organizationName: o.organizationName,
    organizationType: o.organizationType,
    description: o.description,
    address: o.address,
    latitude: o.latitude,
    longitude: o.longitude,
    verificationStatus: o.verificationStatus,
    capacityMeals: o.capacityMeals,
    createdAt: o.createdAt,
  }));

  res.json(sanitized);
});

// GET /api/organizations/:id
router.get('/:id', (req, res): void => {
  const org = db.getOrganizationById(req.params.id);
  if (!org) {
    res.status(404).json({ error: 'Organization not found' });
    return;
  }

  // Aggregate stats
  const listings = db.getListings().filter((l) => l.donorOrganizationId === org.id);
  const requests = db.getRequests().filter((r) => r.recipientOrganizationId === org.id);

  res.json({
    ...org,
    stats: {
      totalListingsCreated: listings.length,
      activeListingsCount: listings.filter((l) => l.listingStatus === 'AVAILABLE' || l.listingStatus === 'PARTIALLY_RESERVED').length,
      completedDonationsReceived: requests.filter((r) => r.requestStatus === 'COMPLETED').length,
    },
  });
});

// PUT /api/organizations/profile
router.put('/profile', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const org = db.getOrganizationByUserId(req.user.id);
    if (!org) {
      res.status(404).json({ error: 'Organization profile not found' });
      return;
    }

    const { organizationName, description, address, latitude, longitude, phone, contactPerson, website, capacityMeals } = req.body;

    const updated = await db.updateOrganization(org.id, {
      organizationName: organizationName || org.organizationName,
      description: description || org.description,
      address: address || org.address,
      latitude: latitude !== undefined ? Number(latitude) : org.latitude,
      longitude: longitude !== undefined ? Number(longitude) : org.longitude,
      contactDetails: {
        phone: phone || org.contactDetails.phone,
        contactPerson: contactPerson || org.contactDetails.contactPerson,
        website: website || org.contactDetails.website,
      },
      capacityMeals: capacityMeals !== undefined ? Number(capacityMeals) : org.capacityMeals,
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update organization profile.' });
  }
});

// GET /api/organizations/verification
router.get('/verification/status', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const org = db.getOrganizationByUserId(req.user.id);
  if (!org) {
    res.status(404).json({ error: 'Organization not found' });
    return;
  }
  res.json({
    organizationId: org.id,
    organizationName: org.organizationName,
    verificationStatus: org.verificationStatus,
    canRequestDonations: org.verificationStatus === 'VERIFIED',
  });
});

export default router;
