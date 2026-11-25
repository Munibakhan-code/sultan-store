// src/models/PaymentMethod.ts (Updated)
import mongoose, { Schema, Document } from 'mongoose';

export interface IPaymentMethodLogo {
  url: string;
  publicId: string;
}

export interface IPaymentMethod extends Document {
  name: string;
  type: 'bank_transfer' | 'crypto' | 'other';
  enabled: boolean;
  logo?: IPaymentMethodLogo;
  details: {
    accountNumber?: string;
    bankName?: string;
    accountName?: string;
    cryptoAddress?: string;
    cryptoNetwork?: string;
    instructions?: string;
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

const paymentMethodLogoSchema = new Schema<IPaymentMethodLogo>({
  url: {
    type: String,
    required: true,
  },
  publicId: {
    type: String,
    required: true,
  },
});

const paymentMethodSchema = new Schema<IPaymentMethod>(
  {
    name: {
      type: String,
      required: [true, 'Payment method name is required'],
      trim: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ['bank_transfer', 'crypto', 'other'],
      required: [true, 'Payment method type is required'],
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    logo: {
      type: paymentMethodLogoSchema,
      required: false,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export const PaymentMethod = mongoose.model<IPaymentMethod>(
  'PaymentMethod',
  paymentMethodSchema
);