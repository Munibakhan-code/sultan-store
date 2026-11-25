// src/controllers/admin/adminCustomer.controller.ts
import { Request, Response, NextFunction } from 'express';
import { User } from '../../models/User';
import { Order } from '../../models/Order';
import { AppError } from '../../utils/AppError';
import { AuthRequest } from '../../middleware/auth';

export class AdminCustomerController {
  async getAllCustomers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, page = '1', limit = '10' } = req.query;

      const filter: any = {};
      
      // Search by name or email
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }

      const pageNum = Math.max(1, parseInt(page as string) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 10));
      const skip = (pageNum - 1) * limitNum;

      const [customers, total] = await Promise.all([
        User.find(filter)
          .select('-password -__v -verificationToken -verificationTokenExpires -resetPasswordToken -resetPasswordExpires')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum),
        User.countDocuments(filter),
      ]);

      // Get order count for each customer
      const customersWithOrderCount = await Promise.all(
        customers.map(async (customer) => {
          const orderCount = await Order.countDocuments({ buyer: customer._id });
          return {
            ...customer.toObject(),
            orderCount,
          };
        })
      );

      res.status(200).json({
        success: true,
        data: {
          customers: customersWithOrderCount,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getCustomerById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const customer = await User.findById(id)
        .select('-password -__v -verificationToken -verificationTokenExpires -resetPasswordToken -resetPasswordExpires');

      if (!customer) {
        throw new AppError('Customer not found', 404);
      }

      const orderCount = await Order.countDocuments({ buyer: customer._id });
      const orders = await Order.find({ buyer: customer._id })
        .populate('account')
        .sort({ createdAt: -1 })
        .limit(10);

      res.status(200).json({
        success: true,
        data: {
          customer: {
            ...customer.toObject(),
            orderCount,
            recentOrders: orders,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const adminCustomerController = new AdminCustomerController();