// src/controllers/admin/adminCustomDemand.controller.ts
import { Request, Response, NextFunction } from 'express';
import { CustomDemand } from '../../models/CustomDemand';
import { Conversation } from '../../models/Conversation';
import { User } from '../../models/User';
import { AppError } from '../../utils/AppError';
import { AuthRequest } from '../../middleware/auth';
import { updateCustomDemandSchema } from '../../validators/customDemand.validator';

export class AdminCustomDemandController {
  async getAllDemands(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.query;

      const filter: any = {};
      if (status) {
        filter.status = status;
      }

      const demands = await CustomDemand.find(filter)
        .populate('user', 'name email')
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: { demands },
      });
    } catch (error) {
      next(error);
    }
  }

  async assistDemand(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const demand = await CustomDemand.findById(id);
      if (!demand) {
        throw new AppError('Custom demand not found', 404);
      }

      if (demand.status !== 'pending') {
        throw new AppError('Demand is already being assisted or completed', 400);
      }

      // Get admin user
      const admin = await User.findById(req.user!._id);
      if (!admin) {
        throw new AppError('Admin not found', 404);
      }

      // Create conversation between customer and admin
      const conversation = await Conversation.create({
        type: 'custom-demand',
        participants: [demand.user, admin._id],
        customDemand: demand._id,
      });

      // Update demand status
      demand.status = 'assisted';
      await demand.save();

      // Populate conversation data
      await conversation.populate('participants', 'name email');

      res.status(200).json({
        success: true,
        data: {
          message: 'Demand assisted successfully',
          demand,
          conversation,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateDemandStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body; // Fix: Extract status directly from body

      const demand = await CustomDemand.findById(id);
      if (!demand) {
        throw new AppError('Custom demand not found', 404);
      }

      // Fix: Check if status exists and is valid
      if (status && ['pending', 'assisted', 'completed'].includes(status)) {
        demand.status = status;
        await demand.save();
      }

      res.status(200).json({
        success: true,
        data: {
          message: 'Demand status updated successfully',
          demand,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const adminCustomDemandController = new AdminCustomDemandController();