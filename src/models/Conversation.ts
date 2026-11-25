// src/models/Conversation.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IConversation extends Document {
  type: 'deal' | 'custom-demand';
  participants: mongoose.Types.ObjectId[];
  order?: mongoose.Types.ObjectId;
  customDemand?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    type: {
      type: String,
      enum: ['deal', 'custom-demand'],
      required: [true, 'Conversation type is required'],
    },
    participants: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      required: [true, 'Participants are required'],
      validate: {
        validator: function (participants: mongoose.Types.ObjectId[]) {
          return participants.length >= 2;
        },
        message: 'Conversation must have at least 2 participants',
      },
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
    },
    customDemand: {
      type: Schema.Types.ObjectId,
      ref: 'CustomDemand',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
conversationSchema.index({ participants: 1 });
conversationSchema.index({ order: 1 });
conversationSchema.index({ customDemand: 1 });

export const Conversation = mongoose.model<IConversation>('Conversation', conversationSchema);