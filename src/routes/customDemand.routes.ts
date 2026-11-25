// src/routes/customDemand.routes.ts
import { Router } from 'express';
import { customDemandController } from '../controllers/customDemand.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', customDemandController.createDemand);
router.get('/', customDemandController.getMyDemands);
router.get('/:id', customDemandController.getDemandById);

export default router;