// src/routes/cart.routes.ts
import { Router } from 'express';
import { cartController } from '../controllers/cart.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', cartController.getCart);
router.post('/:accountId', cartController.addToCart);
router.delete('/:accountId', cartController.removeFromCart);
router.delete('/', cartController.clearCart);

export default router;