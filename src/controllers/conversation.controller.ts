// src/controllers/conversation.controller.ts
import { Request, Response, NextFunction } from 'express';
import { Conversation } from '../models/Conversation';
import { Message } from '../models/Message';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../middleware/auth';
import { sendMessageSchema, getMessagesQuerySchema } from '../validators/conversation.validator';

export class ConversationController {
  async getMyConversations(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const conversations = await Conversation.find({
        participants: req.user!._id,
      })
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

      // Check if user is a participant or admin
      const isParticipant = conversation.participants.some(
        (p) => p._id.toString() === req.user!._id.toString()
      );
      const isAdmin = req.user!.role === 'admin';

      if (!isParticipant && !isAdmin) {
        throw new AppError('You do not have access to this conversation', 403);
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
      const query = getMessagesQuerySchema.parse(req.query);

      const conversation = await Conversation.findById(id);
      if (!conversation) {
        throw new AppError('Conversation not found', 404);
      }

      // Check if user is a participant or admin
      const isParticipant = conversation.participants.some(
        (p) => p.toString() === req.user!._id.toString()
      );
      const isAdmin = req.user!.role === 'admin';

      if (!isParticipant && !isAdmin) {
        throw new AppError('You do not have access to this conversation', 403);
      }

      const page = Math.max(1, query.page || 1);
      const limit = Math.min(100, Math.max(1, query.limit || 50));
      const skip = (page - 1) * limit;

      const [messages, total] = await Promise.all([
        Message.find({ conversation: id })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('sender', 'name email'),
        Message.countDocuments({ conversation: id }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          messages: messages.reverse(), // Return in chronological order
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async sendMessage(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const validatedData = sendMessageSchema.parse(req.body);

      const conversation = await Conversation.findById(id);
      if (!conversation) {
        throw new AppError('Conversation not found', 404);
      }

      // Check if user is a participant or admin
      const isParticipant = conversation.participants.some(
        (p) => p.toString() === req.user!._id.toString()
      );
      const isAdmin = req.user!.role === 'admin';

      if (!isParticipant && !isAdmin) {
        throw new AppError('You do not have access to this conversation', 403);
      }

      const message = await Message.create({
        conversation: id,
        sender: req.user!._id,
        message: validatedData.message,
      });

      await message.populate('sender', 'name email');

      res.status(201).json({
        success: true,
        data: {
          message: 'Message sent successfully',
          data: message,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const conversationController = new ConversationController();