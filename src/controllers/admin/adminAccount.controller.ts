// src/controllers/admin/adminAccount.controller.ts
import { Request, Response, NextFunction } from 'express';
import { Account } from '../../models/Account';
import { AppError } from '../../utils/AppError';
import { AuthRequest } from '../../middleware/auth';
import {
  createAccountSchema,
  updateAccountSchema,
  getAccountsQuerySchema,
} from '../../validators/account.validator';
import { cloudinaryService } from '../../services/cloudinary.service';
import logger from '../../utils/logger';

export class AdminAccountController {
  async getAllAccounts(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = getAccountsQuerySchema.parse(req.query);

      const filter: any = {};

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

      // Status
      if (query.status) {
        filter.status = query.status;
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

  async createAccount(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = createAccountSchema.parse(req.body);

      const account = await Account.create({
        ...validatedData,
        createdBy: req.user!._id,
      });

      res.status(201).json({
        success: true,
        data: {
          message: 'Account created successfully',
          account,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateAccount(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      // Remove images from body if present, they should be handled separately
      const { images, ...updateData } = req.body;
      
      // Validate only the non-image fields
      const validatedData = updateAccountSchema.parse(updateData);

      const account = await Account.findById(id);
      if (!account) {
        throw new AppError('Account not found', 404);
      }

      Object.assign(account, validatedData);
      await account.save();

      res.status(200).json({
        success: true,
        data: {
          message: 'Account updated successfully',
          account,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteAccount(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const account = await Account.findById(id);
      if (!account) {
        throw new AppError('Account not found', 404);
      }

      // Delete images from Cloudinary
      if (account.images.length > 0) {
        const publicIds = account.images.map((img) => img.publicId);
        await cloudinaryService.deleteMultipleAssets(publicIds);
      }

      await account.deleteOne();

      res.status(200).json({
        success: true,
        data: {
          message: 'Account deleted successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async uploadAccountImages(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      console.log('📦 Request Body:', JSON.stringify(req.body, null, 2));
      console.log('📦 Request Headers:', req.headers['content-type']);
      console.log('📦 Request Params:', req.params);

      const { id } = req.params;
      
      let images = req.body.images || req.body.image || req.body.files || req.body.file;
      
      console.log('🖼️ Images data type:', typeof images);
      console.log('🖼️ Images value:', images ? (Array.isArray(images) ? `Array of ${images.length} items` : 'Single item') : 'undefined');

      let imageArray: string[] = [];
      
      if (typeof images === 'string') {
        imageArray = [images];
        console.log('✅ Single image detected');
      } else if (Array.isArray(images) && images.length > 0) {
        imageArray = images;
        console.log(`✅ Multiple images detected: ${images.length}`);
      } else if (images && typeof images === 'object' && !Array.isArray(images)) {
        if (images.data || images.base64) {
          imageArray = [images.data || images.base64];
          console.log('✅ Image from object detected');
        }
      } else {
        console.error('❌ No images found in request body. Body keys:', Object.keys(req.body));
        throw new AppError('Images field is required. Please send images as base64 string or array.', 400);
      }

      const validImages = imageArray.filter(img => {
        if (typeof img !== 'string') return false;
        if (!img.includes('base64,')) return false;
        return true;
      });

      if (validImages.length === 0) {
        console.error('❌ No valid base64 images found. Received:', imageArray);
        throw new AppError('Invalid image format. Please send valid base64 encoded images.', 400);
      }

      if (validImages.length !== imageArray.length) {
        console.warn(`⚠️ ${imageArray.length - validImages.length} invalid images filtered out`);
      }

      const account = await Account.findById(id);
      if (!account) {
        throw new AppError('Account not found', 404);
      }

      if (account.images.length + validImages.length > 10) {
        throw new AppError(`Maximum 10 images/videos allowed per account. Current: ${account.images.length}, Adding: ${validImages.length}`, 400);
      }

      console.log(`📤 Uploading ${validImages.length} media to Cloudinary...`);
      const uploadedImages = [];
      let failedCount = 0;

      for (let i = 0; i < validImages.length; i++) {
        const media = validImages[i];
        try {
          console.log(`⏳ Uploading media ${i + 1}/${validImages.length}...`);
          const result = await cloudinaryService.uploadFromBase64(
            media,
            `accounts/${account._id}`
          );
          
          uploadedImages.push({
            url: result.secure_url,
            publicId: result.public_id,
          });
          
          console.log(`✅ Media ${i + 1}/${validImages.length} uploaded: ${result.public_id}`);
        } catch (uploadError) {
          failedCount++;
          console.error(`❌ Failed to upload media ${i + 1}:`, uploadError instanceof Error ? uploadError.message : uploadError);
        }
      }

      if (uploadedImages.length === 0) {
        throw new AppError(`Failed to upload any media. ${failedCount} attempt(s) failed. Please try again.`, 400);
      }

      account.images.push(...uploadedImages);
      await account.save();

      const message = uploadedImages.length === 1 
        ? 'Image uploaded successfully' 
        : `${uploadedImages.length} media uploaded successfully`;

      console.log(`✅ Upload complete: ${uploadedImages.length} success, ${failedCount} failed`);

      res.status(200).json({
        success: true,
        data: {
          message: failedCount > 0 ? `${message} (${failedCount} failed)` : message,
          images: uploadedImages,
          totalImages: account.images.length,
          failedCount,
        },
      });
    } catch (error) {
      console.error('❌ Upload error:', error);
      next(error);
    }
  }

  async deleteAccountImage(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, publicId } = req.params;

      const account = await Account.findById(id);
      if (!account) {
        throw new AppError('Account not found', 404);
      }

      const imageIndex = account.images.findIndex(
        (img) => img.publicId === publicId
      );

      if (imageIndex === -1) {
        throw new AppError('Image not found', 404);
      }

      await cloudinaryService.deleteAsset(publicId);

      account.images.splice(imageIndex, 1);
      await account.save();

      res.status(200).json({
        success: true,
        data: {
          message: 'Image deleted successfully',
          remainingImages: account.images.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const adminAccountController = new AdminAccountController();