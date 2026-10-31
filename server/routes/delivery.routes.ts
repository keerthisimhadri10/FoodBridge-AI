import { Router, Response } from 'express';
import { db } from '../db/database';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware';
import { DeliveryTaskStatus } from '../db/types';

const router = Router();

// Helper to enrich delivery task
function enrichTask(task: any) {
  const listing = db.getListingById(task.listingId);
  const donorOrg = db.getOrganizationById(task.donorOrgId);
  const recipientOrg = db.getOrganizationById(task.recipientOrgId);
  const pickup = db.getPickupDetailsByRequestId(task.requestId);
  const request = db.getRequestById(task.requestId);

  return {
    ...task,
    listing: listing
      ? {
          id: listing.id,
          foodName: listing.foodName,
          category: listing.category,
          unit: listing.unit,
          imageUrl: listing.imageUrl,
          storageMethod: listing.storageMethod,
          handlingInstructions: listing.handlingInstructions,
        }
      : null,
    quantity: request?.requestedQuantity || 0,
    donorOrganization: donorOrg
      ? {
          id: donorOrg.id,
          organizationName: donorOrg.organizationName,
          address: donorOrg.address,
          phone: donorOrg.contactDetails.phone,
          contactPerson: donorOrg.contactDetails.contactPerson,
        }
      : null,
    recipientOrganization: recipientOrg
      ? {
          id: recipientOrg.id,
          organizationName: recipientOrg.organizationName,
          address: recipientOrg.address,
          phone: recipientOrg.contactDetails.phone,
          contactPerson: recipientOrg.contactDetails.contactPerson,
        }
      : null,
    pickupReference: pickup?.pickupReference || 'FB-REF',
    pickupStatus: pickup?.pickupStatus || 'SCHEDULED',
  };
}

// GET /api/deliveries
router.get('/', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { status, my } = req.query;
  const volunteer = db.getVolunteerProfileByUserId(req.user.id);

  let tasks = db.getDeliveryTasks({
    status: status as DeliveryTaskStatus | undefined,
  });

  if (my === 'true') {
    if (!volunteer && req.user.role !== 'ADMIN') {
      res.json([]);
      return;
    }
    const volId = volunteer?.id;
    tasks = tasks.filter((t) => t.volunteerId === volId);
  }

  const enriched = tasks.map(enrichTask);
  enriched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(enriched);
});

// GET /api/deliveries/volunteer/profile
router.get('/volunteer/profile', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  let profile = db.getVolunteerProfileByUserId(req.user.id);
  if (!profile && req.user.role === 'VOLUNTEER') {
    // Generate default profile for this volunteer
    profile = {
      id: `vol_${req.user.id}`,
      userId: req.user.id,
      fullName: req.user.name,
      phone: '+91 98490 12345',
      vehicleType: 'MOTORCYCLE',
      vehicleNumber: 'TS 09 AB 1234',
      isAvailable: true,
      totalDeliveriesCompleted: 0,
      averageRating: 5.0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  res.json(profile || null);
});

// PUT /api/deliveries/volunteer/profile
router.put('/volunteer/profile', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { fullName, phone, vehicleType, vehicleNumber, isAvailable } = req.body;
    const profile = await db.updateVolunteerProfile(req.user.id, {
      fullName,
      phone,
      vehicleType,
      vehicleNumber,
      isAvailable,
    });

    res.json(profile);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update volunteer profile.' });
  }
});

// GET /api/deliveries/:id
router.get('/:id', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const task = db.getDeliveryTaskById(req.params.id);
  if (!task) {
    res.status(404).json({ error: 'Delivery task not found.' });
    return;
  }

  res.json(enrichTask(task));
});

// PATCH /api/deliveries/:id/accept (Volunteer accepts task)
router.patch('/:id/accept', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (req.user.role !== 'VOLUNTEER' && req.user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Only volunteers can accept delivery tasks.' });
      return;
    }

    const updatedTask = await db.acceptDeliveryTask(req.params.id, req.user.id);
    res.json({
      message: 'Delivery task accepted successfully!',
      task: enrichTask(updatedTask),
    });
  } catch (err: any) {
    res.status(409).json({ error: err.message || 'Failed to accept delivery task.' });
  }
});

// PATCH /api/deliveries/:id/status (Volunteer updates status: PICKED_UP, IN_TRANSIT, DELIVERED)
router.patch('/:id/status', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { status, notes } = req.body;
    if (!status) {
      res.status(400).json({ error: 'Status is required.' });
      return;
    }

    const validStatuses: DeliveryTaskStatus[] = ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: `Invalid status. Valid values: ${validStatuses.join(', ')}` });
      return;
    }

    const updatedTask = await db.updateDeliveryTaskStatus(req.params.id, req.user.id, status, notes);
    res.json({
      message: `Delivery task updated to ${status}.`,
      task: enrichTask(updatedTask),
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update delivery status.' });
  }
});

export default router;
