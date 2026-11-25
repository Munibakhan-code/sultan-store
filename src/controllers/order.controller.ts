// src/controllers/order.controller.ts
import { Request, Response, NextFunction } from 'express';
import { Order } from '../models/Order';
import { Account } from '../models/Account';
import { Cart } from '../models/Cart';
import { PaymentMethod } from '../models/PaymentMethod';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../middleware/auth';
import { createOrderSchema, submitPaymentSchema, getOrdersQuerySchema } from '../validators/order.validator';
import { cloudinaryService } from '../services/cloudinary.service';
import mongoose from 'mongoose';

export class OrderController {
  async createOrder(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const validatedData = createOrderSchema.parse(req.body);

      const account = await Account.findById(validatedData.accountId).session(session);
      if (!account) {
        throw new AppError('Account not found', 404);
      }

      if (account.status !== 'available') {
        throw new AppError('Account is not available for purchase', 400);
      }

      const paymentMethod = await PaymentMethod.findById(validatedData.paymentMethodId).session(session);
      if (!paymentMethod) {
        throw new AppError('Payment method not found', 404);
      }

      if (!paymentMethod.enabled) {
        throw new AppError('Payment method is not enabled', 400);
      }

      const updatedAccount = await Account.findOneAndUpdate(
        {
          _id: validatedData.accountId,
          status: 'available',
        },
        {
          status: 'reserved',
        },
        {
          new: true,
          session,
        }
      );

      if (!updatedAccount) {
        throw new AppError('Account was purchased by another customer', 409);
      }

      // Use priceUSD for orders
      const order = await Order.create(
        [
          {
            buyer: req.user!._id,
            account: updatedAccount._id,
            amount: updatedAccount.priceUSD,
            paymentMethod: new mongoose.Types.ObjectId(validatedData.paymentMethodId),
            paymentStatus: 'pending',
            dealStatus: 'pending',
          },
        ],
        { session }
      );

      await Cart.findOneAndUpdate(
        { user: req.user!._id },
        {
          $pull: { items: { account: updatedAccount._id } },
        },
        { session }
      );

      await session.commitTransaction();

      const populatedOrder = await Order.findById(order[0]._id)
        .populate('buyer', 'name email')
        .populate('account')
        .populate('paymentMethod');

      res.status(201).json({
        success: true,
        data: {
          message: 'Order created successfully. Please submit payment.',
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

  async createOrdersFromCart(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { paymentMethodId } = req.body;

      if (!paymentMethodId) {
        throw new AppError('Payment method is required', 400);
      }

      const cart = await Cart.findOne({ user: req.user!._id }).session(session);
      if (!cart || cart.items.length === 0) {
        throw new AppError('Cart is empty', 400);
      }

      const paymentMethod = await PaymentMethod.findById(paymentMethodId).session(session);
      if (!paymentMethod) {
        throw new AppError('Payment method not found', 404);
      }

      if (!paymentMethod.enabled) {
        throw new AppError('Payment method is not enabled', 400);
      }

      const accountIds = cart.items.map((item) => item.account);
      const orders = [];

      for (const accountId of accountIds) {
        const account = await Account.findById(accountId).session(session);
        if (!account) {
          throw new AppError(`Account ${accountId} not found`, 404);
        }

        if (account.status !== 'available') {
          throw new AppError(`Account ${account.title} is not available for purchase`, 400);
        }

        const updatedAccount = await Account.findOneAndUpdate(
          {
            _id: accountId,
            status: 'available',
          },
          {
            status: 'reserved',
          },
          {
            new: true,
            session,
          }
        );

        if (!updatedAccount) {
          throw new AppError(`Account ${account.title} was purchased by another customer`, 409);
        }

        // Use priceUSD for orders
        const order = await Order.create(
          [
            {
              buyer: req.user!._id,
              account: updatedAccount._id,
              amount: updatedAccount.priceUSD,
              paymentMethod: new mongoose.Types.ObjectId(paymentMethodId),
              paymentStatus: 'pending',
              dealStatus: 'pending',
            },
          ],
          { session }
        );

        orders.push(order[0]);
      }

      cart.items = [];
      await cart.save({ session });

      await session.commitTransaction();

      const populatedOrders = await Order.find({
        _id: { $in: orders.map((o) => o._id) },
      })
        .populate('buyer', 'name email')
        .populate('account')
        .populate('paymentMethod');

      res.status(201).json({
        success: true,
        data: {
          message: `${orders.length} order(s) created successfully. Please submit payment.`,
          orders: populatedOrders,
        },
      });
    } catch (error) {
      await session.abortTransaction();
      next(error);
    } finally {
      session.endSession();
    }
  }

  async getMyOrders(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = getOrdersQuerySchema.parse(req.query);

      const filter: any = { buyer: req.user!._id };

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

      if (order.buyer._id.toString() !== req.user!._id.toString() && req.user!.role !== 'admin') {
        throw new AppError('You do not have permission to view this order', 403);
      }

      res.status(200).json({
        success: true,
        data: { order },
      });
    } catch (error) {
      next(error);
    }
  }

  async submitPayment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { orderId } = req.params;
      const validatedData = submitPaymentSchema.parse(req.body);

      const order = await Order.findById(orderId);
      if (!order) {
        throw new AppError('Order not found', 404);
      }

      if (order.buyer.toString() !== req.user!._id.toString()) {
        throw new AppError('You do not have permission to update this order', 403);
      }

      if (order.paymentStatus === 'approved') {
        throw new AppError('Order is already paid', 400);
      }

      if (order.paymentStatus === 'submitted') {
        throw new AppError('Payment already submitted, waiting for approval', 400);
      }

      const paymentMethod = await PaymentMethod.findById(validatedData.paymentMethodId);
      if (!paymentMethod) {
        throw new AppError('Payment method not found', 404);
      }

      if (!paymentMethod.enabled) {
        throw new AppError('Payment method is not enabled', 400);
      }

      const result = await cloudinaryService.uploadFromBase64(
        validatedData.screenshotBase64,
        'payments',
        {
          folder: `payments/${order._id}`,
          transformation: [
            { quality: 'auto' },
            { fetch_format: 'auto' },
          ],
        }
      );

      order.paymentMethod = new mongoose.Types.ObjectId(validatedData.paymentMethodId);
      order.paymentScreenshot = {
        url: result.secure_url,
        publicId: result.public_id,
      };
      order.paymentStatus = 'submitted';
      await order.save();

      const populatedOrder = await Order.findById(order._id)
        .populate('buyer', 'name email')
        .populate('account')
        .populate('paymentMethod');

      res.status(200).json({
        success: true,
        data: {
          message: 'Payment submitted successfully. Waiting for admin approval.',
          order: populatedOrder,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const orderController = new OrderController();