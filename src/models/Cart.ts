// src/models/Cart.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ICartItem {
  account: mongoose.Types.ObjectId;
}

export interface ICart extends Document {
  user: mongoose.Types.ObjectId;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<ICartItem>({
  account: {
    type: Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
  },
});

const cartSchema = new Schema<ICart>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const Cart = mongoose.model<ICart>('Cart', cartSchema);