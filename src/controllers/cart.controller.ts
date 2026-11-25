// src/controllers/cart.controller.ts
import { Request, Response, NextFunction } from 'express';
import { Cart } from '../models/Cart';
import { Account } from '../models/Account';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../middleware/auth';

export class CartController {
  async getCart(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      let cart = await Cart.findOne({ user: req.user!._id }).populate({
        path: 'items.account',
        populate: {
          path: 'createdBy',
          select: 'name email',
        },
      });

      if (!cart) {
        cart = await Cart.create({ user: req.user!._id, items: [] });
      }

      res.status(200).json({
        success: true,
        data: { cart },
      });
    } catch (error) {
      next(error);
    }
  }

  async addToCart(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { accountId } = req.params;

      const account = await Account.findById(accountId);
      if (!account) {
        throw new AppError('Account not found', 404);
      }

      if (account.status !== 'available') {
        throw new AppError('This account is not available for purchase', 400);
      }

      let cart = await Cart.findOne({ user: req.user!._id });

      if (!cart) {
        cart = await Cart.create({ user: req.user!._id, items: [] });
      }

      const alreadyInCart = cart.items.some(
        (item) => item.account.toString() === accountId
      );

      if (alreadyInCart) {
        throw new AppError('Account already in cart', 400);
      }

      cart.items.push({ account: account._id });
      await cart.save();

      await cart.populate({
        path: 'items.account',
        populate: {
          path: 'createdBy',
          select: 'name email',
        },
      });

      res.status(200).json({
        success: true,
        data: {
          message: 'Added to cart',
          cart,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async removeFromCart(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { accountId } = req.params;

      const cart = await Cart.findOne({ user: req.user!._id });

      if (!cart) {
        throw new AppError('Cart not found', 404);
      }

      cart.items = cart.items.filter(
        (item) => item.account.toString() !== accountId
      );

      await cart.save();

      await cart.populate({
        path: 'items.account',
        populate: {
          path: 'createdBy',
          select: 'name email',
        },
      });

      res.status(200).json({
        success: true,
        data: {
          message: 'Removed from cart',
          cart,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async clearCart(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const cart = await Cart.findOne({ user: req.user!._id });

      if (!cart) {
        throw new AppError('Cart not found', 404);
      }

      cart.items = [];
      await cart.save();

      res.status(200).json({
        success: true,
        data: {
          message: 'Cart cleared',
          cart,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const cartController = new CartController();