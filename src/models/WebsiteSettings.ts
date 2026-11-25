// src/models/WebsiteSettings.ts - Add getSettings as a static method properly
import mongoose, { Schema, Document } from 'mongoose';

export interface IWebsiteSettings extends Document {
  heroVideoUrl: string;
  heroVideoPublicId: string;
  themeColor: string;
  updatedAt: Date;
}

export interface IWebsiteSettingsModel extends mongoose.Model<IWebsiteSettings> {
  getSettings(): Promise<IWebsiteSettings>;
}

const websiteSettingsSchema = new Schema<IWebsiteSettings>(
  {
    heroVideoUrl: {
      type: String,
      default: '',
    },
    heroVideoPublicId: {
      type: String,
      default: '',
    },
    themeColor: {
      type: String,
      default: '#D4AF37',
      validate: {
        validator: function (v: string) {
          return /^#[0-9A-Fa-f]{6}$/.test(v);
        },
        message: 'Theme color must be a valid hex color (e.g., #D4AF37)',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one settings document exists
websiteSettingsSchema.statics.getSettings = async function (): Promise<IWebsiteSettings> {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({
      heroVideoUrl: '',
      heroVideoPublicId: '',
      themeColor: '#D4AF37',
    });
  }
  return settings;
};

export const WebsiteSettings = mongoose.model<IWebsiteSettings, IWebsiteSettingsModel>(
  'WebsiteSettings',
  websiteSettingsSchema
);