// src/controllers/admin/adminSettings.controller.ts
import { Request, Response, NextFunction } from 'express';
import { WebsiteSettings } from '../../models/WebsiteSettings';
import { WhatsAppSettings } from '../../models/WhatsAppSettings';
import { AppError } from '../../utils/AppError';
import { AuthRequest } from '../../middleware/auth';
import { 
  updateThemeSchema, 
  heroVideoSchema, 
  updateWhatsAppSchema 
} from '../../validators/settings.validator';
import { cloudinaryService } from '../../services/cloudinary.service';
import logger from '../../utils/logger';

export class AdminSettingsController {
  async getSettings(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await WebsiteSettings.getSettings();
      
      res.status(200).json({
        success: true,
        data: { settings },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateTheme(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = updateThemeSchema.parse(req.body);

      const settings = await WebsiteSettings.getSettings();
      settings.themeColor = validatedData.themeColor;
      await settings.save();

      res.status(200).json({
        success: true,
        data: {
          message: 'Theme color updated successfully',
          themeColor: settings.themeColor,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async uploadHeroVideo(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { videoBase64 } = req.body;

      if (!videoBase64) {
        throw new AppError('Video data is required', 400);
      }

      const settings = await WebsiteSettings.getSettings();

      if (settings.heroVideoPublicId) {
        try {
          await cloudinaryService.deleteAsset(settings.heroVideoPublicId);
        } catch (error) {
          logger.warn('Failed to delete old hero video:', error);
        }
      }

      const result = await cloudinaryService.uploadFromBase64(
        videoBase64,
        'videos/hero',
        {
          resource_type: 'video',
          transformation: [
            { quality: 'auto' },
            { fetch_format: 'auto' },
          ],
        }
      );

      settings.heroVideoUrl = result.secure_url;
      settings.heroVideoPublicId = result.public_id;
      await settings.save();

      res.status(200).json({
        success: true,
        data: {
          message: 'Hero video uploaded successfully',
          heroVideoUrl: settings.heroVideoUrl,
          heroVideoPublicId: settings.heroVideoPublicId,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteHeroVideo(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await WebsiteSettings.getSettings();

      if (!settings.heroVideoPublicId) {
        throw new AppError('No hero video to delete', 404);
      }

      await cloudinaryService.deleteAsset(settings.heroVideoPublicId);

      settings.heroVideoUrl = '';
      settings.heroVideoPublicId = '';
      await settings.save();

      res.status(200).json({
        success: true,
        data: {
          message: 'Hero video deleted successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // WhatsApp Settings Methods
  async getWhatsAppSettings(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await WhatsAppSettings.getSettings();
      
      res.status(200).json({
        success: true,
        data: { settings },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateWhatsAppSettings(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = updateWhatsAppSchema.parse(req.body);
      
      const settings = await WhatsAppSettings.getSettings();
      
      if (validatedData.phoneNumber !== undefined) {
        settings.phoneNumber = validatedData.phoneNumber;
      }
      if (validatedData.isEnabled !== undefined) {
        settings.isEnabled = validatedData.isEnabled;
      }
      if (validatedData.messageTemplate !== undefined) {
        settings.messageTemplate = validatedData.messageTemplate;
      }
      
      await settings.save();
      
      res.status(200).json({
        success: true,
        data: {
          message: 'WhatsApp settings updated successfully',
          settings,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const adminSettingsController = new AdminSettingsController();