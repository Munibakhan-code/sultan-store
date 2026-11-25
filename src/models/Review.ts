// src/models/Review.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  user: mongoose.Types.ObjectId;
  order: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  status: 'pending' | 'published' | 'private';
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order is required'],
      unique: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
      required: [true, 'Comment is required'],
      trim: true,
      minlength: [3, 'Comment must be at least 3 characters'],
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'published', 'private'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
reviewSchema.index({ user: 1, createdAt: -1 });
reviewSchema.index({ order: 1 });
reviewSchema.index({ status: 1 });
reviewSchema.index({ rating: 1 });

export const Review = mongoose.model<IReview>('Review', reviewSchema);