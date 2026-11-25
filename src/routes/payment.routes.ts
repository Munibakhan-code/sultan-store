// src/routes/payment.routes.ts
import { Router } from 'express';
import { paymentMethodController } from '../controllers/paymentMethod.controller';

const router = Router();

// Public - Get enabled payment methods
router.get('/methods', paymentMethodController.getPublicMethods);

export default router;