// src/routes/conversation.routes.ts
import { Router } from 'express';
import { conversationController } from '../controllers/conversation.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', conversationController.getMyConversations);
router.get('/:id', conversationController.getConversationById);
router.get('/:id/messages', conversationController.getMessages);
router.post('/:id/messages', conversationController.sendMessage);

export default router;