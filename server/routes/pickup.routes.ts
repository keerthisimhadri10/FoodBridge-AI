import { Router, Response } from 'express';
import { db } from '../db/database';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware';

const router = Router();

// GET /api/pickups/:id
router.get('/:id', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const pickup = db.getPickupDetailsById(req.params.id) || db.getPickupDetailsByRequestId(req.params.id);
  if (!pickup) {
    res.status(404).json({ error: 'Pickup details not found.' });
    return;
  }

  const request = db.getRequestById(pickup.requestId);
  const listing = request ? db.getListingById(request.listingId) : null;
  const donorOrg = listing ? db.getOrganizationById(listing.donorOrganizationId) : null;
  const recipientOrg = request ? db.getOrganizationById(request.recipientOrganizationId) : null;

  res.json({
    ...pickup,
    request,
    listing,
    donorOrganization: donorOrg,
    recipientOrganization: recipientOrg,
  });
});

// PATCH /api/pickups/confirm (Dual Independent Confirmation)
router.patch('/confirm', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { requestId, notes } = req.body;
    if (!requestId) {
      res.status(400).json({ error: 'requestId is required for pickup confirmation.' });
      return;
    }

    const result = await db.confirmPickup(requestId, req.user.id, req.user.role, notes);

    res.json({
      message:
        result.request.requestStatus === 'COMPLETED'
          ? 'Dual confirmation completed! Donation is officially marked as COMPLETED.'
          : 'Collection confirmed on your side. Awaiting counter-party confirmation to finalize.',
      request: result.request,
      pickup: result.pickup,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to confirm pickup.' });
  }
});

export default router;
