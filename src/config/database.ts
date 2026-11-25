// src/config/database.ts (Updated with indexes)
import mongoose from 'mongoose';
import logger from '../utils/logger';

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI!);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);

    // Create indexes for better performance
    await createIndexes();
    logger.info('Database indexes created successfully');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const createIndexes = async () => {
  try {
    // User indexes
    const User = mongoose.model('User');
    await User.collection.createIndex({ email: 1 }, { unique: true });

    // Account indexes
    const Account = mongoose.model('Account');
    await Account.collection.createIndex({ status: 1 });
    await Account.collection.createIndex({ price: 1 });
    await Account.collection.createIndex({ title: 'text', description: 'text' });

    // Order indexes
    const Order = mongoose.model('Order');
    await Order.collection.createIndex({ buyer: 1 });
    await Order.collection.createIndex({ paymentStatus: 1 });
    await Order.collection.createIndex({ dealStatus: 1 });
    await Order.collection.createIndex({ createdAt: -1 });

    // Conversation indexes
    const Conversation = mongoose.model('Conversation');
    await Conversation.collection.createIndex({ participants: 1 });

    // Message indexes
    const Message = mongoose.model('Message');
    await Message.collection.createIndex({ conversation: 1, createdAt: -1 });

    // Review indexes
    const Review = mongoose.model('Review');
    await Review.collection.createIndex({ status: 1 });
    await Review.collection.createIndex({ user: 1, createdAt: -1 });

    // CustomDemand indexes
    const CustomDemand = mongoose.model('CustomDemand');
    await CustomDemand.collection.createIndex({ user: 1, status: 1 });

    logger.info('All database indexes created');
  } catch (error) {
    logger.warn('Error creating indexes (they may already exist):', error);
  }
};