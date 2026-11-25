// src/middleware/uploadValidator.ts (NEW FILE)
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export const validateImageUpload = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { images } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      throw new AppError('Images array is required', 400);
    }

    // Validate each image (base64 format)
    for (const image of images) {
      if (typeof image !== 'string') {
        throw new AppError('Each image must be a base64 string', 400);
      }

      // Check if it's a base64 image
      if (!image.startsWith('data:image/')) {
        throw new AppError('Invalid image format. Only base64 images are allowed', 400);
      }

      // Check size (rough estimate - base64 length * 0.75 gives approximate bytes)
      const approximateSize = image.length * 0.75;
      if (approximateSize > 5 * 1024 * 1024) { // 5MB limit
        throw new AppError('Image size exceeds 5MB limit', 400);
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const validateVideoUpload = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { videoBase64 } = req.body;

    if (!videoBase64) {
      throw new AppError('Video data is required', 400);
    }

    if (typeof videoBase64 !== 'string') {
      throw new AppError('Video must be a base64 string', 400);
    }

    // Check if it's a base64 video
    if (!videoBase64.startsWith('data:video/')) {
      throw new AppError('Invalid video format. Only base64 videos are allowed', 400);
    }

    // Check size (rough estimate)
    const approximateSize = videoBase64.length * 0.75;
    if (approximateSize > 50 * 1024 * 1024) { // 50MB limit
      throw new AppError('Video size exceeds 50MB limit', 400);
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const validateScreenshotUpload = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { screenshotBase64 } = req.body;

    if (!screenshotBase64) {
      throw new AppError('Screenshot is required', 400);
    }

    if (typeof screenshotBase64 !== 'string') {
      throw new AppError('Screenshot must be a base64 string', 400);
    }

    // Check if it's a base64 image
    if (!screenshotBase64.startsWith('data:image/')) {
      throw new AppError('Invalid screenshot format. Only base64 images are allowed', 400);
    }

    // Check size (rough estimate)
    const approximateSize = screenshotBase64.length * 0.75;
    if (approximateSize > 5 * 1024 * 1024) { // 5MB limit
      throw new AppError('Screenshot size exceeds 5MB limit', 400);
    }

    next();
  } catch (error) {
    next(error);
  }
};