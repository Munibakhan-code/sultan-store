// src/models/CustomDemand.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomDemand extends Document {
  user: mongoose.Types.ObjectId;
  requirements: string;
  rank?: string;
  level?: number;
  skins?: string[];
  budget?: number;
  additionalInformation?: string;
  status: 'pending' | 'assisted' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

const customDemandSchema = new Schema<ICustomDemand>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    requirements: {
      type: String,
      required: [true, 'Requirements are required'],
      trim: true,
      minlength: [10, 'Requirements must be at least 10 characters'],
      maxlength: [2000, 'Requirements cannot exceed 2000 characters'],
    },
    rank: {
      type: String,
      trim: true,
    },
    level: {
      type: Number,
      min: 1,
      max: 500,
    },
    skins: {
      type: [String],
      default: [],
    },
    budget: {
      type: Number,
      min: 0,
    },
    additionalInformation: {
      type: String,
      trim: true,
      maxlength: [1000, 'Additional information cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'assisted', 'completed'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
customDemandSchema.index({ user: 1, createdAt: -1 });
customDemandSchema.index({ status: 1 });

export const CustomDemand = mongoose.model<ICustomDemand>('CustomDemand', customDemandSchema);