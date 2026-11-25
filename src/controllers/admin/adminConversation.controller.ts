// src/controllers/admin/adminConversation.controller.ts
import { Request, Response, NextFunction } from 'express';
import { Conversation } from '../../models/Conversation';
import { Message } from '../../models/Message';
import { AppError } from '../../utils/AppError';
import { AuthRequest } from '../../middleware/auth';

export class AdminConversationController {
  async getAllConversations(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const conversations = await Conversation.find()
        .populate('participants', 'name email')
        .populate('order')
        .populate('customDemand')
        .sort({ updatedAt: -1 });

      // Get last message for each conversation
      const conversationsWithLastMessage = await Promise.all(
        conversations.map(async (conv) => {
          const lastMessage = await Message.findOne({ conversation: conv._id })
            .sort({ createdAt: -1 })
            .populate('sender', 'name email');

          return {
            ...conv.toObject(),
            lastMessage: lastMessage || null,
          };
        })
      );

      res.status(200).json({
        success: true,
        data: { conversations: conversationsWithLastMessage },
      });
    } catch (error) {
      next(error);
    }
  }

  async getConversationById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const conversation = await Conversation.findById(id)
        .populate('participants', 'name email')
        .populate('order')
        .populate('customDemand');

      if (!conversation) {
        throw new AppError('Conversation not found', 404);
      }

      res.status(200).json({
        success: true,
        data: { conversation },
      });
    } catch (error) {
      next(error);
    }
  }

  async getMessages(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const conversation = await Conversation.findById(id);
      if (!conversation) {
        throw new AppError('Conversation not found', 404);
      }

      const messages = await Message.find({ conversation: id })
        .sort({ createdAt: -1 })
        .populate('sender', 'name email');

      res.status(200).json({
        success: true,
        data: { messages: messages.reverse() },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const adminConversationController = new AdminConversationController();