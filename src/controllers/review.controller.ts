// src/controllers/review.controller.ts
import { Request, Response, NextFunction } from 'express';
import { Review } from '../models/Review';
import { Order } from '../models/Order';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../middleware/auth';
import { createReviewSchema } from '../validators/review.validator';

export class ReviewController {
  async createReview(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = createReviewSchema.parse(req.body);

      // Check if order exists and belongs to user
      const order = await Order.findById(validatedData.orderId);
      if (!order) {
        throw new AppError('Order not found', 404);
      }

      if (order.buyer.toString() !== req.user!._id.toString()) {
        throw new AppError('You can only review your own orders', 403);
      }

      // Check if order is completed
      if (order.paymentStatus !== 'approved') {
        throw new AppError('Order must be paid to review', 400);
      }

      if (order.dealStatus !== 'completed') {
        throw new AppError('Deal must be completed to review', 400);
      }

      // Check if review already exists for this order
      const existingReview = await Review.findOne({ order: validatedData.orderId });
      if (existingReview) {
        throw new AppError('You have already reviewed this order', 400);
      }

      const review = await Review.create({
        user: req.user!._id,
        order: validatedData.orderId,
        rating: validatedData.rating,
        comment: validatedData.comment,
        status: 'pending',
      });

      await review.populate('user', 'name email');
      await review.populate('order');

      res.status(201).json({
        success: true,
        data: {
          message: 'Review created successfully. It will be published after admin approval.',
          review,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyReviews(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const reviews = await Review.find({ user: req.user!._id })
        .populate('order')
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: { reviews },
      });
    } catch (error) {
      next(error);
    }
  }

  async getPublicReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reviews = await Review.find({ status: 'published' })
        .populate('user', 'name')
        .populate({
          path: 'order',
          populate: {
            path: 'account',
            select: 'title level rank',
          },
        })
        .sort({ createdAt: -1 })
        .limit(50);

      res.status(200).json({
        success: true,
        data: { reviews },
      });
    } catch (error) {
      next(error);
    }
  }

  async getReviewStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await Review.aggregate([
        { $match: { status: 'published' } },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 },
            ratingCounts: {
              $push: '$rating',
            },
          },
        },
        {
          $project: {
            _id: 0,
            averageRating: { $round: ['$averageRating', 1] },
            totalReviews: 1,
            ratingDistribution: {
              $arrayToObject: {
                $map: {
                  input: { $range: [1, 6] },
                  as: 'r',
                  in: {
                    k: { $toString: '$$r' },
                    v: {
                      $size: {
                        $filter: {
                          input: '$ratingCounts',
                          as: 'rc',
                          cond: { $eq: ['$$rc', '$$r'] },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      ]);

      res.status(200).json({
        success: true,
        data: {
          stats: stats[0] || { averageRating: 0, totalReviews: 0, ratingDistribution: {} },
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const reviewController = new ReviewController();