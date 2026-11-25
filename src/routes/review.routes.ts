// src/routes/review.routes.ts
import { Router } from 'express';
import { reviewController } from '../controllers/review.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/public', reviewController.getPublicReviews);
router.get('/stats', reviewController.getReviewStats);

// Protected routes
router.use(authenticate);
router.post('/', reviewController.createReview);
router.get('/my', reviewController.getMyReviews);

export default router;