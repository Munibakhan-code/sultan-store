// src/models/WhatsAppSettings.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IWhatsAppSettings extends Document {
  phoneNumber: string;
  isEnabled: boolean;
  messageTemplate?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWhatsAppSettingsModel extends mongoose.Model<IWhatsAppSettings> {
  getSettings(): Promise<IWhatsAppSettings>;
}

const whatsAppSettingsSchema = new Schema<IWhatsAppSettings>(
  {
    phoneNumber: {
      type: String,
      default: '',
      trim: true,
    },
    isEnabled: {
      type: Boolean,
      default: false,
    },
    messageTemplate: {
      type: String,
      default: 'Hello, I am interested in your account: {{accountTitle}}',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one settings document exists
whatsAppSettingsSchema.statics.getSettings = async function (): Promise<IWhatsAppSettings> {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({
      phoneNumber: '',
      isEnabled: false,
      messageTemplate: 'Hello, I am interested in your account: {{accountTitle}}',
    });
  }
  return settings;
};

export const WhatsAppSettings = mongoose.model<IWhatsAppSettings, IWhatsAppSettingsModel>(
  'WhatsAppSettings',
  whatsAppSettingsSchema
);