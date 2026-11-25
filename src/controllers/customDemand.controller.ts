// src/controllers/customDemand.controller.ts
import { Request, Response, NextFunction } from 'express';
import { CustomDemand } from '../models/CustomDemand';
import { Conversation } from '../models/Conversation';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../middleware/auth';
import { createCustomDemandSchema } from '../validators/customDemand.validator';

export class CustomDemandController {
  async createDemand(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = createCustomDemandSchema.parse(req.body);

      const demand = await CustomDemand.create({
        ...validatedData,
        user: req.user!._id,
      });

      res.status(201).json({
        success: true,
        data: {
          message: 'Custom demand created successfully',
          demand,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyDemands(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const demands = await CustomDemand.find({ user: req.user!._id })
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: { demands },
      });
    } catch (error) {
      next(error);
    }
  }

  async getDemandById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const demand = await CustomDemand.findById(id);
      if (!demand) {
        throw new AppError('Custom demand not found', 404);
      }

      // Check if user owns this demand or is admin
      if (demand.user.toString() !== req.user!._id.toString() && req.user!.role !== 'admin') {
        throw new AppError('You do not have permission to view this demand', 403);
      }

      res.status(200).json({
        success: true,
        data: { demand },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const customDemandController = new CustomDemandController();