import { Router, Response } from 'express';
import { db } from '../db/database';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware';

const router = Router();

// GET /api/requests
router.get('/', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { status, listingId } = req.query;
  let requests = db.getRequests();

  if (status && typeof status === 'string') {
    requests = requests.filter((r) => r.requestStatus === status);
  }

  if (listingId && typeof listingId === 'string') {
    requests = requests.filter((r) => r.listingId === listingId);
  }

  // Filter based on user role
  if (req.user.role === 'DONOR') {
    const org = db.getOrganizationByUserId(req.user.id);
    if (!org) {
      res.json([]);
      return;
    }
    const myListingIds = new Set(
      db.getListings().filter((l) => l.donorOrganizationId === org.id).map((l) => l.id)
    );
    requests = requests.filter((r) => myListingIds.has(r.listingId));
  } else if (req.user.role === 'RECIPIENT') {
    const org = db.getOrganizationByUserId(req.user.id);
    if (!org) {
      res.json([]);
      return;
    }
    requests = requests.filter((r) => r.recipientOrganizationId === org.id);
  }
  // Admin sees all

  // Enrich with listing and organization details
  const enriched = requests.map((r) => {
    const listing = db.getListingById(r.listingId);
    const recipientOrg = db.getOrganizationById(r.recipientOrganizationId);
    const donorOrg = listing ? db.getOrganizationById(listing.donorOrganizationId) : null;
    const pickup = db.getPickupDetailsByRequestId(r.id);

    return {
      ...r,
      listing: listing
        ? {
            id: listing.id,
            foodName: listing.foodName,
            category: listing.category,
            dietaryType: listing.dietaryType,
            unit: listing.unit,
            imageUrl: listing.imageUrl,
            pickupLocation: listing.pickupLocation,
            pickupStart: listing.pickupStart,
            pickupEnd: listing.pickupEnd,
            availableQuantity: listing.availableQuantity,
          }
        : null,
      recipientOrganization: recipientOrg
        ? {
            id: recipientOrg.id,
            organizationName: recipientOrg.organizationName,
            organizationType: recipientOrg.organizationType,
            verificationStatus: recipientOrg.verificationStatus,
            phone: recipientOrg.contactDetails.phone,
            contactPerson: recipientOrg.contactDetails.contactPerson,
          }
        : null,
      donorOrganization: donorOrg
        ? {
            id: donorOrg.id,
            organizationName: donorOrg.organizationName,
            phone: donorOrg.contactDetails.phone,
          }
        : null,
      pickupReference: pickup?.pickupReference || null,
      pickupStatus: pickup?.pickupStatus || null,
    };
  });

  // Sort by newest
  enriched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json(enriched);
});

// GET /api/requests/:id
router.get('/:id', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const request = db.getRequestById(req.params.id);
  if (!request) {
    res.status(404).json({ error: 'Donation request not found.' });
    return;
  }

  const listing = db.getListingById(request.listingId);
  const recipientOrg = db.getOrganizationById(request.recipientOrganizationId);
  const donorOrg = listing ? db.getOrganizationById(listing.donorOrganizationId) : null;
  const pickup = db.getPickupDetailsByRequestId(request.id);
  const history = db.getStatusHistory(request.id);

  res.json({
    ...request,
    listing,
    recipientOrganization: recipientOrg,
    donorOrganization: donorOrg,
    pickupDetails: pickup || null,
    statusHistory: history,
  });
});

// POST /api/requests (Submit request by verified NGO)
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (req.user.role !== 'RECIPIENT' && req.user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Only recipient organizations can submit food donation requests.' });
      return;
    }

    const org = db.getOrganizationByUserId(req.user.id);
    if (!org && req.user.role !== 'ADMIN') {
      res.status(400).json({ error: 'User is not linked to any recipient organization profile.' });
      return;
    }

    const recipientOrganizationId = org ? org.id : req.body.recipientOrganizationId;
    const { listingId, requestedQuantity, pickupWindow, notes } = req.body;

    if (!listingId || !requestedQuantity) {
      res.status(400).json({ error: 'Listing ID and requested quantity are required.' });
      return;
    }

    const newReq = await db.createRequest(
      listingId,
      recipientOrganizationId,
      Number(requestedQuantity),
      pickupWindow || 'Standard scheduled window',
      notes
    );

    res.status(201).json(newReq);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to submit donation request.' });
  }
});

// PATCH /api/requests/:id/accept (Donor accepts request - concurrency protected)
router.patch('/:id/accept', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (req.user.role !== 'DONOR' && req.user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Only the food donor can accept this request.' });
      return;
    }

    const result = await db.acceptRequest(req.params.id, req.user.id);
    res.json({
      message: 'Donation request accepted and inventory reserved successfully.',
      request: result.request,
      pickup: result.pickup,
    });
  } catch (err: any) {
    res.status(409).json({ error: err.message || 'Could not accept donation request.' });
  }
});

// PATCH /api/requests/:id/reject (Donor rejects request)
router.patch('/:id/reject', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { reason } = req.body;
    const request = await db.rejectRequest(req.params.id, req.user.id, reason);
    res.json({ message: 'Donation request rejected.', request });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Could not reject request.' });
  }
});

// PATCH /api/requests/:id/cancel (Recipient or Donor cancels)
router.patch('/:id/cancel', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { reason } = req.body;
    const request = await db.cancelRequest(req.params.id, req.user.id, reason);
    res.json({ message: 'Donation request cancelled and inventory restored.', request });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Could not cancel request.' });
  }
});

export default router;
