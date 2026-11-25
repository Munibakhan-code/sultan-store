// src/routes/order.routes.ts
import { Router } from 'express';
import { orderController } from '../controllers/order.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', orderController.createOrder);
router.post('/cart/checkout', orderController.createOrdersFromCart);
router.get('/', orderController.getMyOrders);
router.get('/:id', orderController.getOrderById);
router.post('/:orderId/payment', orderController.submitPayment);

export default router;