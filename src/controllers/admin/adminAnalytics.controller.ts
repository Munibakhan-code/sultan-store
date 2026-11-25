// src/controllers/admin/adminAnalytics.controller.ts
import { Request, Response, NextFunction } from 'express';
import { User } from '../../models/User';
import { Account } from '../../models/Account';
import { Order } from '../../models/Order';
import { AuthRequest } from '../../middleware/auth';

export class AdminAnalyticsController {
  async getAnalytics(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get all counts in parallel for better performance
      const [
        totalUsers,
        totalAccounts,
        availableAccounts,
        soldAccounts,
        totalOrders,
        pendingPayments,
        completedDeals,
        pendingDeals,
        totalRevenue,
      ] = await Promise.all([
        User.countDocuments(),
        Account.countDocuments(),
        Account.countDocuments({ status: 'available' }),
        Account.countDocuments({ status: 'sold' }),
        Order.countDocuments(),
        Order.countDocuments({ paymentStatus: 'pending' }),
        Order.countDocuments({ dealStatus: 'completed' }),
        Order.countDocuments({ dealStatus: 'pending' }),
        Order.aggregate([
          { $match: { paymentStatus: 'approved' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
      ]);

      res.status(200).json({
        success: true,
        data: {
          totalUsers,
          totalAccounts,
          availableAccounts,
          soldAccounts,
          totalOrders,
          pendingPayments,
          completedDeals,
          pendingDeals,
          totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const adminAnalyticsController = new AdminAnalyticsController();