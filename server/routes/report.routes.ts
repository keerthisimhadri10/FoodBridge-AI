import { Router, Response } from 'express';
import { db } from '../db/database';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware';

const router = Router();

// POST /api/reports
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { listingId, reason, description } = req.body;
    if (!listingId || !reason) {
      res.status(400).json({ error: 'listingId and reason are required.' });
      return;
    }

    const report = await db.submitReport(
      listingId,
      req.user.id,
      reason,
      description || 'User submitted concerns regarding this listing.'
    );

    res.status(201).json({
      message: 'Report submitted. Our administrative safety team will review this listing shortly.',
      report,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to submit report.' });
  }
});

export default router;
