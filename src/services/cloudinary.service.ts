// src/services/cloudinary.service.ts
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { env } from '../config/env';
import logger from '../utils/logger';

class CloudinaryService {
  constructor() {
    // Only initialize if Cloudinary credentials are provided
    if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
      cloudinary.config({
        cloud_name: env.CLOUDINARY_CLOUD_NAME,
        api_key: env.CLOUDINARY_API_KEY,
        api_secret: env.CLOUDINARY_API_SECRET,
        timeout: 60000, // Increase timeout to 60 seconds
      });
      logger.info('Cloudinary service initialized');
    } else {
      logger.warn('⚠️ Cloudinary not configured - upload features disabled');
      logger.warn('   Set CLOUDINARY_* environment variables to enable');
    }
  }

  private checkInitialized() {
    if (!env.CLOUDINARY_CLOUD_NAME) {
      throw new Error('Cloudinary is not configured. Please set CLOUDINARY_* environment variables.');
    }
  }

  async uploadImage(
    filePath: string,
    folder: string = 'accounts',
    options: any = {}
  ): Promise<UploadApiResponse> {
    this.checkInitialized();
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: `sultan-store/${folder}`,
        resource_type: 'image',
        timeout: 60000,
        ...options,
      });
      logger.info(`Image uploaded to Cloudinary: ${result.public_id}`);
      return result;
    } catch (error) {
      logger.error('Cloudinary upload error:', error);
      throw new Error('Failed to upload image to Cloudinary');
    }
  }

  async uploadVideo(
    filePath: string,
    folder: string = 'videos',
    options: any = {}
  ): Promise<UploadApiResponse> {
    this.checkInitialized();
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: `sultan-store/${folder}`,
        resource_type: 'video',
        timeout: 120000, // 2 minutes for videos
        ...options,
      });
      logger.info(`Video uploaded to Cloudinary: ${result.public_id}`);
      return result;
    } catch (error) {
      logger.error('Cloudinary upload error:', error);
      throw new Error('Failed to upload video to Cloudinary');
    }
  }

  async deleteAsset(publicId: string): Promise<void> {
    this.checkInitialized();
    try {
      await cloudinary.uploader.destroy(publicId);
      logger.info(`Asset deleted from Cloudinary: ${publicId}`);
    } catch (error) {
      logger.error('Cloudinary delete error:', error);
      throw new Error('Failed to delete asset from Cloudinary');
    }
  }

  async deleteMultipleAssets(publicIds: string[]): Promise<void> {
    this.checkInitialized();
    try {
      await cloudinary.api.delete_resources(publicIds);
      logger.info(`Multiple assets deleted from Cloudinary: ${publicIds.length}`);
    } catch (error) {
      logger.error('Cloudinary delete error:', error);
      throw new Error('Failed to delete assets from Cloudinary');
    }
  }

  async uploadFromBase64(
    base64String: string,
    folder: string = 'accounts',
    options: any = {}
  ): Promise<UploadApiResponse> {
    this.checkInitialized();
    try {
      // Determine if it's a video or image
      const isVideo = base64String.startsWith('data:video/');
      const resourceType = isVideo ? 'video' : 'image';
      const timeout = isVideo ? 120000 : 60000;

      const result = await cloudinary.uploader.upload(base64String, {
        folder: `sultan-store/${folder}`,
        resource_type: resourceType,
        timeout: timeout,
        ...options,
      });
      logger.info(`${resourceType} uploaded from base64: ${result.public_id}`);
      return result;
    } catch (error) {
      logger.error('Cloudinary upload error:', error);
      throw new Error('Failed to upload to Cloudinary');
    }
  }

  getOptimizedUrl(publicId: string, options: any = {}): string {
    this.checkInitialized();
    return cloudinary.url(publicId, {
      quality: 'auto',
      fetch_format: 'auto',
      ...options,
    });
  }
}

export const cloudinaryService = new CloudinaryService();