// src/routes/account.routes.ts
import { Router } from 'express';
import { accountController } from '../controllers/account.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', accountController.getPublicAccounts);
router.get('/favorites', authenticate, accountController.getFavoriteAccounts);
router.post('/favorites/:accountId', authenticate, accountController.toggleFavorite);
router.delete('/favorites/:accountId', authenticate, accountController.toggleFavorite);
router.get('/:id', accountController.getPublicAccount);

export default router;