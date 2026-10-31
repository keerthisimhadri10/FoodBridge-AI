import { Router, Response } from 'express';
import { aiService } from '../services/ai.service';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware';

const router = Router();

// POST /api/ai/match
router.post('/match', async (req, res): Promise<void> => {
  try {
    const { listingId } = req.body;
    if (!listingId) {
      res.status(400).json({ error: 'listingId is required for intelligent matching.' });
      return;
    }

    const matches = await aiService.matchNGOsForListing(listingId);
    res.json({
      listingId,
      matches,
      criteria: {
        distanceWeight: '30%',
        quantityWeight: '25%',
        dietaryWeight: '20%',
        availabilityWeight: '25%',
      },
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Matching failed.' });
  }
});

// POST /api/ai/generate-description
router.post('/generate-description', async (req, res): Promise<void> => {
  try {
    const { foodName, quantity, unit, category, dietaryType, preparationInfo, storageDetails } = req.body;

    if (!foodName || !quantity || !category) {
      res.status(400).json({ error: 'foodName, quantity, and category are required.' });
      return;
    }

    const result = await aiService.generateFoodDescription({
      foodName,
      quantity: Number(quantity),
      unit: unit || 'MEAL_BOXES',
      category,
      dietaryType: dietaryType || 'VEGETARIAN',
      preparationInfo,
      storageDetails,
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'AI description generation failed.' });
  }
});

// GET /api/ai/insights
router.get('/insights', async (_req, res): Promise<void> => {
  try {
    const insights = await aiService.getDonationInsights();
    res.json(insights);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch AI insights.' });
  }
});

export default router;
