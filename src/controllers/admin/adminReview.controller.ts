// src/controllers/admin/adminReview.controller.ts
import { Request, Response, NextFunction } from 'express';
import { Review } from '../../models/Review';
import { AppError } from '../../utils/AppError';
import { AuthRequest } from '../../middleware/auth';
import { updateReviewStatusSchema } from '../../validators/review.validator';

export class AdminReviewController {
  async getAllReviews(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.query;

      const filter: any = {};
      if (status) {
        filter.status = status;
      }

      const reviews = await Review.find(filter)
        .populate('user', 'name email')
        .populate({
          path: 'order',
          populate: {
            path: 'account',
            select: 'title level rank',
          },
        })
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: { reviews },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateReviewStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const validatedData = updateReviewStatusSchema.parse(req.body);

      const review = await Review.findById(id);
      if (!review) {
        throw new AppError('Review not found', 404);
      }

      review.status = validatedData.status;
      await review.save();

      await review.populate('user', 'name email');
      await review.populate('order');

      res.status(200).json({
        success: true,
        data: {
          message: 'Review status updated successfully',
          review,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteReview(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const review = await Review.findById(id);
      if (!review) {
        throw new AppError('Review not found', 404);
      }

      await review.deleteOne();

      res.status(200).json({
        success: true,
        data: {
          message: 'Review deleted successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const adminReviewController = new AdminReviewController();