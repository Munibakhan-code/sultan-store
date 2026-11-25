// src/models/Order.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderPaymentScreenshot {
  url: string;
  publicId: string;
}

export interface IOrder extends Document {
  buyer: mongoose.Types.ObjectId;
  account: mongoose.Types.ObjectId;
  amount: number;
  paymentMethod: mongoose.Types.ObjectId;
  paymentScreenshot?: IOrderPaymentScreenshot;
  paymentStatus: 'pending' | 'submitted' | 'approved' | 'rejected';
  dealStatus: 'pending' | 'credentials_sent' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

const orderPaymentScreenshotSchema = new Schema<IOrderPaymentScreenshot>({
  url: {
    type: String,
    required: true,
  },
  publicId: {
    type: String,
    required: true,
  },
});

const orderSchema = new Schema<IOrder>(
  {
    buyer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Buyer is required'],
    },
    account: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      required: [true, 'Account is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount must be a positive number'],
    },
    paymentMethod: {
      type: Schema.Types.ObjectId,
      ref: 'PaymentMethod',
      required: [true, 'Payment method is required'],
    },
    paymentScreenshot: {
      type: orderPaymentScreenshotSchema,
      required: false,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'submitted', 'approved', 'rejected'],
      default: 'pending',
    },
    dealStatus: {
      type: String,
      enum: ['pending', 'credentials_sent', 'completed'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
orderSchema.index({ buyer: 1, createdAt: -1 });
orderSchema.index({ account: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ dealStatus: 1 });

export const Order = mongoose.model<IOrder>('Order', orderSchema);