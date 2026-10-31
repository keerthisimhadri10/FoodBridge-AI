import { Router, Response } from 'express';
import { db } from '../db/database';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware';

const router = Router();

// GET /api/feedback
router.get('/', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const { requestId, listingId, orgId, volunteerId } = req.query;

  const feedbacks = db.getFeedbacks({
    requestId: requestId as string | undefined,
    listingId: listingId as string | undefined,
    orgId: orgId as string | undefined,
    volunteerId: volunteerId as string | undefined,
  });

  // Enrich with reviewer user info
  const enriched = feedbacks.map((f) => {
    const user = db.getUserById(f.reviewerUserId);
    return {
      ...f,
      reviewerName: user ? user.name : 'Platform Member',
    };
  });

  enriched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(enriched);
});

// POST /api/feedback
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { requestId, listingId, rating, comment, foodConditionRating, punctualityRating, targetOrgId, targetVolunteerId } = req.body;

    if (!requestId || !listingId || !rating) {
      res.status(400).json({ error: 'requestId, listingId, and rating are required.' });
      return;
    }

    const numRating = Math.max(1, Math.min(5, Number(rating)));
    const numFood = Math.max(1, Math.min(5, Number(foodConditionRating || rating)));
    const numPunct = Math.max(1, Math.min(5, Number(punctualityRating || rating)));

    const newFeedback = await db.submitFeedback({
      requestId,
      listingId,
      reviewerUserId: req.user.id,
      reviewerRole: req.user.role,
      targetOrgId,
      targetVolunteerId,
      rating: numRating,
      comment: comment || 'Smooth coordination and handover.',
      foodConditionRating: numFood,
      punctualityRating: numPunct,
    });

    res.status(201).json({
      message: 'Feedback submitted successfully. Thank you for building trust on FoodBridge!',
      feedback: newFeedback,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to submit feedback.' });
  }
});

export default router;
