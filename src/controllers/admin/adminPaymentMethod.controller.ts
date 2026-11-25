// src/controllers/admin/adminPaymentMethod.controller.ts
import { Request, Response, NextFunction } from 'express';
import { PaymentMethod } from '../../models/PaymentMethod';
import { AppError } from '../../utils/AppError';
import { AuthRequest } from '../../middleware/auth';
import { paymentMethodSchema } from '../../validators/settings.validator';
import { cloudinaryService } from '../../services/cloudinary.service';

export class AdminPaymentMethodController {
  async getAllMethods(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const methods = await PaymentMethod.find().sort({ createdAt: -1 });
      
      res.status(200).json({
        success: true,
        data: { methods },
      });
    } catch (error) {
      next(error);
    }
  }

  async createMethod(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = paymentMethodSchema.parse(req.body);
      
      const existing = await PaymentMethod.findOne({ name: validatedData.name });
      if (existing) {
        throw new AppError('Payment method with this name already exists', 400);
      }
      
      const method = await PaymentMethod.create(validatedData);
      
      res.status(201).json({
        success: true,
        data: {
          message: 'Payment method created successfully',
          method,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateMethod(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const validatedData = paymentMethodSchema.partial().parse(req.body);
      
      const method = await PaymentMethod.findById(id);
      if (!method) {
        throw new AppError('Payment method not found', 404);
      }
      
      Object.assign(method, validatedData);
      await method.save();
      
      res.status(200).json({
        success: true,
        data: {
          message: 'Payment method updated successfully',
          method,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteMethod(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      const method = await PaymentMethod.findById(id);
      if (!method) {
        throw new AppError('Payment method not found', 404);
      }
      
      // Delete logo from Cloudinary if exists
      if (method.logo?.publicId) {
        try {
          await cloudinaryService.deleteAsset(method.logo.publicId);
        } catch (error) {
          console.log('Failed to delete logo:', error);
        }
      }
      
      await method.deleteOne();
      
      res.status(200).json({
        success: true,
        data: {
          message: 'Payment method deleted successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async uploadLogo(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { logoBase64 } = req.body;
      
      if (!logoBase64) {
        throw new AppError('Logo data is required', 400);
      }
      
      const method = await PaymentMethod.findById(id);
      if (!method) {
        throw new AppError('Payment method not found', 404);
      }
      
      // Delete old logo if exists
      if (method.logo?.publicId) {
        try {
          await cloudinaryService.deleteAsset(method.logo.publicId);
        } catch (error) {
          console.log('Failed to delete old logo:', error);
        }
      }
      
      // Upload new logo
      const result = await cloudinaryService.uploadFromBase64(
        logoBase64,
        'payment-methods',
        {
          transformation: [
            { width: 200, height: 200, crop: 'limit' },
            { quality: 'auto' },
            { fetch_format: 'auto' },
          ],
        }
      );
      
      method.logo = {
        url: result.secure_url,
        publicId: result.public_id,
      };
      await method.save();
      
      res.status(200).json({
        success: true,
        data: {
          message: 'Logo uploaded successfully',
          logo: method.logo,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteLogo(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      const method = await PaymentMethod.findById(id);
      if (!method) {
        throw new AppError('Payment method not found', 404);
      }
      
      if (!method.logo?.publicId) {
        throw new AppError('No logo to delete', 404);
      }
      
      await cloudinaryService.deleteAsset(method.logo.publicId);
      
      method.logo = undefined;
      await method.save();
      
      res.status(200).json({
        success: true,
        data: {
          message: 'Logo deleted successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const adminPaymentMethodController = new AdminPaymentMethodController();