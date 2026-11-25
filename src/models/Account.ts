// src/models/Account.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IAccountImage {
  url: string;
  publicId: string;
}

export interface IAccount extends Document {
  title: string;
  description: string;
  priceUSD: number;
  pricePKR: number;
  images: IAccountImage[];
  level: number;
  rank: string;
  skins: string[];
  weapons: string[];
  outfits: string[];
  status: 'available' | 'reserved' | 'sold';
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const accountImageSchema = new Schema<IAccountImage>({
  url: {
    type: String,
    required: true,
  },
  publicId: {
    type: String,
    required: true,
  },
});

const accountSchema = new Schema<IAccount>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    priceUSD: {
      type: Number,
      required: [true, 'USD price is required'],
      min: [0, 'Price must be a positive number'],
    },
    pricePKR: {
      type: Number,
      required: [true, 'PKR price is required'],
      min: [0, 'Price must be a positive number'],
    },
    images: {
      type: [accountImageSchema],
      default: [],
      validate: {
        validator: function (images: IAccountImage[]) {
          return images.length <= 10;
        },
        message: 'Maximum 10 images allowed',
      },
    },
    level: {
      type: Number,
      required: [true, 'Level is required'],
      min: [1, 'Level must be at least 1'],
      max: [500, 'Level cannot exceed 500'],
    },
    rank: {
      type: String,
      required: [true, 'Rank is required'],
      trim: true,
      enum: [
        'Bronze',
        'Silver',
        'Gold',
        'Platinum',
        'Diamond',
        'Crown',
        'Ace',
        'Conqueror',
      ],
    },
    skins: {
      type: [String],
      default: [],
    },
    weapons: {
      type: [String],
      default: [],
    },
    outfits: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['available', 'reserved', 'sold'],
      default: 'available',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for search and filtering
accountSchema.index({ title: 'text', description: 'text' });
accountSchema.index({ priceUSD: 1 });
accountSchema.index({ pricePKR: 1 });
accountSchema.index({ level: 1 });
accountSchema.index({ rank: 1 });
accountSchema.index({ status: 1 });
accountSchema.index({ createdAt: -1 });

export const Account = mongoose.model<IAccount>('Account', accountSchema);