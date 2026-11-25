// src/controllers/account.controller.ts
import { Request, Response, NextFunction } from 'express';
import { Account } from '../models/Account';
import { Favorite } from '../models/Favorite';
import { Cart } from '../models/Cart';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../middleware/auth';
import {
  createAccountSchema,
  updateAccountSchema,
  getAccountsQuerySchema,
} from '../validators/account.validator';
import { cloudinaryService } from '../services/cloudinary.service';

export class AccountController {
  async getPublicAccounts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = getAccountsQuerySchema.parse(req.query);

      const filter: any = { status: 'available' };

      // Search
      if (query.search) {
        filter.$text = { $search: query.search };
      }

      // Price range - USD
      if (query.minPriceUSD !== undefined) {
        filter.priceUSD = { $gte: query.minPriceUSD };
      }
      if (query.maxPriceUSD !== undefined) {
        filter.priceUSD = { ...filter.priceUSD, $lte: query.maxPriceUSD };
      }

      // Price range - PKR
      if (query.minPricePKR !== undefined) {
        filter.pricePKR = { $gte: query.minPricePKR };
      }
      if (query.maxPricePKR !== undefined) {
        filter.pricePKR = { ...filter.pricePKR, $lte: query.maxPricePKR };
      }

      // Rank
      if (query.rank) {
        filter.rank = query.rank;
      }

      // Level range
      if (query.minLevel !== undefined) {
        filter.level = { $gte: query.minLevel };
      }
      if (query.maxLevel !== undefined) {
        filter.level = { ...filter.level, $lte: query.maxLevel };
      }

      // Sorting
      const sort: any = {};
      sort[query.sortBy] = query.sortOrder === 'asc' ? 1 : -1;

      // Pagination
      const page = Math.max(1, query.page || 1);
      const limit = Math.min(100, Math.max(1, query.limit || 10));
      const skip = (page - 1) * limit;

      const [accounts, total] = await Promise.all([
        Account.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate('createdBy', 'name email'),
        Account.countDocuments(filter),
      ]);

      res.status(200).json({
        success: true,
        data: {
          accounts,
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

  async getPublicAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const account = await Account.findOne({
        _id: id,
        status: 'available',
      }).populate('createdBy', 'name email');

      if (!account) {
        throw new AppError('Account not found or not available', 404);
      }

      res.status(200).json({
        success: true,
        data: { account },
      });
    } catch (error) {
      next(error);
    }
  }

  async getFavoriteAccounts(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const favorites = await Favorite.find({ user: req.user!._id })
        .populate({
          path: 'account',
          populate: {
            path: 'createdBy',
            select: 'name email',
          },
        })
        .sort({ createdAt: -1 });

      const accounts = favorites.map((fav) => fav.account);

      res.status(200).json({
        success: true,
        data: { accounts },
      });
    } catch (error) {
      next(error);
    }
  }

  async toggleFavorite(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { accountId } = req.params;

      const account = await Account.findById(accountId);
      if (!account) {
        throw new AppError('Account not found', 404);
      }

      if (account.status !== 'available') {
        throw new AppError('Cannot favorite this account', 400);
      }

      const existingFavorite = await Favorite.findOne({
        user: req.user!._id,
        account: accountId,
      });

      if (existingFavorite) {
        await existingFavorite.deleteOne();
        res.status(200).json({
          success: true,
          data: { message: 'Removed from favorites', favorited: false },
        });
      } else {
        await Favorite.create({
          user: req.user!._id,
          account: accountId,
        });
        res.status(200).json({
          success: true,
          data: { message: 'Added to favorites', favorited: true },
        });
      }
    } catch (error) {
      next(error);
    }
  }
}

export const accountController = new AccountController();