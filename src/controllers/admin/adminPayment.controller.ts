// src/controllers/admin/adminPayment.controller.ts (Updated with screenshots access)
import { Request, Response, NextFunction } from 'express';
import { Order } from '../../models/Order';
import { Account } from '../../models/Account';
import { Conversation } from '../../models/Conversation';
import { AppError } from '../../utils/AppError';
import { AuthRequest } from '../../middleware/auth';
import { getOrdersQuerySchema, updateDealStatusSchema } from '../../validators/order.validator';
import { cloudinaryService } from '../../services/cloudinary.service';
import mongoose from 'mongoose';

export class AdminPaymentController {
  async getAllOrders(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = getOrdersQuerySchema.parse(req.query);

      const filter: any = {};

      if (query.status) {
        filter.paymentStatus = query.status;
      }

      if (query.dealStatus) {
        filter.dealStatus = query.dealStatus;
      }

      const page = Math.max(1, query.page || 1);
      const limit = Math.min(100, Math.max(1, query.limit || 10));
      const skip = (page - 1) * limit;

      const [orders, total] = await Promise.all([
        Order.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('buyer', 'name email')
          .populate('account')
          .populate('paymentMethod'),
        Order.countDocuments(filter),
      ]);

      res.status(200).json({
        success: true,
        data: {
          orders,
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

  async getOrderById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const order = await Order.findById(id)
        .populate('buyer', 'name email')
        .populate('account')
        .populate('paymentMethod');

      if (!order) {
        throw new AppError('Order not found', 404);
      }

      res.status(200).json({
        success: true,
        data: { order },
      });
    } catch (error) {
      next(error);
    }
  }

  async approvePayment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { id } = req.params;

      const order = await Order.findById(id).session(session);
      if (!order) {
        throw new AppError('Order not found', 404);
      }

      if (order.paymentStatus !== 'submitted') {
        throw new AppError('Order is not in submitted state', 400);
      }

      // Verify account still belongs to order and is reserved
      const account = await Account.findById(order.account).session(session);
      if (!account) {
        throw new AppError('Account not found', 404);
      }

      if (account.status !== 'reserved') {
        throw new AppError('Account is no longer reserved', 400);
      }

      // Update order payment status
      order.paymentStatus = 'approved';
      await order.save({ session });

      // Mark account as sold
      account.status = 'sold';
      await account.save({ session });

      // Create conversation for the deal
      const conversation = await Conversation.create({
        type: 'deal',
        participants: [order.buyer, req.user!._id],
        order: order._id,
      });

      await session.commitTransaction();

      const populatedOrder = await Order.findById(order._id)
        .populate('buyer', 'name email')
        .populate('account')
        .populate('paymentMethod');

      res.status(200).json({
        success: true,
        data: {
          message: 'Payment approved successfully. Account marked as sold.',
          order: populatedOrder,
          conversation,
        },
      });
    } catch (error) {
      await session.abortTransaction();
      next(error);
    } finally {
      session.endSession();
    }
  }

  async rejectPayment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { id } = req.params;

      const order = await Order.findById(id).session(session);
      if (!order) {
        throw new AppError('Order not found', 404);
      }

      if (order.paymentStatus !== 'submitted') {
        throw new AppError('Order is not in submitted state', 400);
      }

      // Update order payment status
      order.paymentStatus = 'rejected';
      await order.save({ session });

      // Release the account back to available
      const account = await Account.findById(order.account).session(session);
      if (account && account.status === 'reserved') {
        account.status = 'available';
        await account.save({ session });
      }

      await session.commitTransaction();

      const populatedOrder = await Order.findById(order._id)
        .populate('buyer', 'name email')
        .populate('account')
        .populate('paymentMethod');

      res.status(200).json({
        success: true,
        data: {
          message: 'Payment rejected. Account released back to available.',
          order: populatedOrder,
        },
      });
    } catch (error) {
      await session.abortTransaction();
      next(error);
    } finally {
      session.endSession();
    }
  }

  async updateDealStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const validatedData = updateDealStatusSchema.parse(req.body);

      const order = await Order.findById(id);
      if (!order) {
        throw new AppError('Order not found', 404);
      }

      if (order.paymentStatus !== 'approved') {
        throw new AppError('Cannot update deal status for unpaid order', 400);
      }

      order.dealStatus = validatedData.dealStatus;
      await order.save();

      const populatedOrder = await Order.findById(order._id)
        .populate('buyer', 'name email')
        .populate('account')
        .populate('paymentMethod');

      res.status(200).json({
        success: true,
        data: {
          message: 'Deal status updated successfully',
          order: populatedOrder,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getPaymentScreenshot(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const order = await Order.findById(id);
      if (!order) {
        throw new AppError('Order not found', 404);
      }

      if (!order.paymentScreenshot) {
        throw new AppError('No payment screenshot found', 404);
      }

      // Only admin can access payment screenshots
      res.status(200).json({
        success: true,
        data: {
          screenshot: order.paymentScreenshot,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const adminPaymentController = new AdminPaymentController();