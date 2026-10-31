import { Router, Response } from 'express';
import { db } from '../db/database';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth.middleware';
import { calculateDistanceKm } from '../services/ai.service';
import { FoodListing, FoodCategory, DietaryType, MeasurementUnit } from '../db/types';

const router = Router();

// GET /api/listings
router.get('/', (req, res): void => {
  const {
    q,
    category,
    dietaryType,
    status,
    donorId,
    userLat,
    userLng,
    sortBy,
    maxDistance,
  } = req.query;

  let listings = db.getListings();

  // Search by food name or description
  if (q && typeof q === 'string') {
    const term = q.toLowerCase();
    listings = listings.filter(
      (l) => l.foodName.toLowerCase().includes(term) || l.description.toLowerCase().includes(term)
    );
  }

  // Filter by category
  if (category && typeof category === 'string' && category !== 'ALL') {
    listings = listings.filter((l) => l.category === category);
  }

  // Filter by dietary type
  if (dietaryType && typeof dietaryType === 'string' && dietaryType !== 'ALL') {
    listings = listings.filter((l) => l.dietaryType === dietaryType);
  }

  // Filter by status (default to available / partially reserved for discovery unless requested)
  if (status && typeof status === 'string') {
    listings = listings.filter((l) => l.listingStatus === status);
  } else if (!donorId) {
    // Public browse: show only active available or partially reserved
    listings = listings.filter(
      (l) => l.listingStatus === 'AVAILABLE' || l.listingStatus === 'PARTIALLY_RESERVED'
    );
  }

  // Filter by donor organization
  if (donorId && typeof donorId === 'string') {
    listings = listings.filter((l) => l.donorOrganizationId === donorId);
  }

  // Enrich with donor organization metadata and distance calculation
  const enriched = listings.map((l) => {
    const donorOrg = db.getOrganizationById(l.donorOrganizationId);
    let distanceKm: number | null = null;
    if (userLat && userLng && donorOrg) {
      distanceKm = calculateDistanceKm(
        Number(userLat),
        Number(userLng),
        donorOrg.latitude,
        donorOrg.longitude
      );
    }
    return {
      ...l,
      donorOrganizationName: donorOrg?.organizationName || 'Donor Organization',
      donorOrganizationType: donorOrg?.organizationType || 'RESTAURANT',
      donorCity: 'Hyderabad',
      donorCoordinates: donorOrg ? { latitude: donorOrg.latitude, longitude: donorOrg.longitude } : null,
      distanceKm,
    };
  });

  // Filter by max distance if requested
  let filtered = enriched;
  if (maxDistance && !isNaN(Number(maxDistance))) {
    filtered = filtered.filter((l) => l.distanceKm === null || l.distanceKm <= Number(maxDistance));
  }

  // Sorting
  if (sortBy === 'nearest') {
    filtered.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
  } else if (sortBy === 'quantity') {
    filtered.sort((a, b) => b.availableQuantity - a.availableQuantity);
  } else {
    // Default newest
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  res.json(filtered);
});

// GET /api/listings/:id
router.get('/:id', (req, res): void => {
  const listing = db.getListingById(req.params.id);
  if (!listing) {
    res.status(404).json({ error: 'Listing not found' });
    return;
  }

  const donorOrg = db.getOrganizationById(listing.donorOrganizationId);
  const requests = db.getRequests().filter((r) => r.listingId === listing.id);

  res.json({
    ...listing,
    donorOrganization: donorOrg
      ? {
          id: donorOrg.id,
          organizationName: donorOrg.organizationName,
          organizationType: donorOrg.organizationType,
          address: donorOrg.address,
          latitude: donorOrg.latitude,
          longitude: donorOrg.longitude,
          contactPhone: donorOrg.contactDetails.phone,
        }
      : null,
    requestsCount: requests.length,
    activeRequestsCount: requests.filter((r) => r.requestStatus === 'PENDING' || r.requestStatus === 'ACCEPTED').length,
  });
});

// POST /api/listings
router.post(
  '/',
  requireAuth,
  requireRole('DONOR', 'ADMIN'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const org = db.getOrganizationByUserId(req.user.id);
      if (!org && req.user.role !== 'ADMIN') {
        res.status(400).json({ error: 'User does not have an associated donor organization.' });
        return;
      }

      const donorOrganizationId = org ? org.id : req.body.donorOrganizationId;

      const {
        foodName,
        description,
        imageUrl,
        category,
        dietaryType,
        totalQuantity,
        unit,
        preparationTime,
        storageMethod,
        handlingInstructions,
        allergenInformation,
        pickupLocation,
        pickupStart,
        pickupEnd,
        collectionDeadline,
        donorDeclarationConfirmed,
      } = req.body;

      // Validate required fields
      if (
        !foodName ||
        !totalQuantity ||
        !unit ||
        !category ||
        !dietaryType ||
        !pickupStart ||
        !pickupEnd ||
        !collectionDeadline
      ) {
        res.status(400).json({ error: 'Missing required listing fields.' });
        return;
      }

      if (!donorDeclarationConfirmed) {
        res.status(400).json({
          error: 'Donor food handling and hygiene declaration must be acknowledged before publishing.',
        });
        return;
      }

      const quantityNum = Number(totalQuantity);
      if (isNaN(quantityNum) || quantityNum <= 0) {
        res.status(400).json({ error: 'Total quantity must be a positive number.' });
        return;
      }

      const now = new Date().toISOString();
      const newListing: FoodListing = {
        id: `lst_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        donorOrganizationId,
        foodName,
        description: description || `${foodName} available for community donation.`,
        imageUrl: imageUrl || '/src/assets/images/food_cooked_meals_1793427944757.jpg',
        category: category as FoodCategory,
        dietaryType: dietaryType as DietaryType,
        totalQuantity: quantityNum,
        availableQuantity: quantityNum,
        reservedQuantity: 0,
        collectedQuantity: 0,
        unit: unit as MeasurementUnit,
        preparationTime: preparationTime || now,
        storageMethod: storageMethod || 'Stored in food-grade insulated containers.',
        handlingInstructions: handlingInstructions || 'Transport in clean containers and distribute promptly.',
        allergenInformation: allergenInformation || 'No known allergens reported.',
        pickupLocation: pickupLocation || (org ? org.address : 'Donor Kitchen'),
        pickupStart,
        pickupEnd,
        collectionDeadline,
        listingStatus: 'AVAILABLE',
        donorDeclarationConfirmed: true,
        createdAt: now,
        updatedAt: now,
      };

      const created = await db.createListing(newListing);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to create food listing.' });
    }
  }
);

// PUT & PATCH /api/listings/:id
const updateListingHandler = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const listing = db.getListingById(req.params.id);
    if (!listing) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }

    const org = db.getOrganizationByUserId(req.user.id);
    if (req.user.role !== 'ADMIN' && (!org || org.id !== listing.donorOrganizationId)) {
      res.status(403).json({ error: 'You do not have permission to modify this listing.' });
      return;
    }

    const updated = await db.updateListing(listing.id, req.body, listing.donorOrganizationId);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update listing.' });
  }
};

router.put('/:id', requireAuth, requireRole('DONOR', 'ADMIN'), updateListingHandler);
router.patch('/:id', requireAuth, requireRole('DONOR', 'ADMIN'), updateListingHandler);

// DELETE /api/listings/:id
router.delete(
  '/:id',
  requireAuth,
  requireRole('DONOR', 'ADMIN'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const listing = db.getListingById(req.params.id);
      if (!listing) {
        res.status(404).json({ error: 'Listing not found' });
        return;
      }

      const org = db.getOrganizationByUserId(req.user.id);
      if (req.user.role !== 'ADMIN' && (!org || org.id !== listing.donorOrganizationId)) {
        res.status(403).json({ error: 'You do not have permission to remove this listing.' });
        return;
      }

      const success = await db.removeListing(listing.id, listing.donorOrganizationId);
      if (success) {
        res.json({ message: 'Listing successfully removed from active redistribution.' });
      } else {
        res.status(400).json({ error: 'Could not remove listing.' });
      }
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to remove listing.' });
    }
  }
);

export default router;
