// src/scripts/seedPaymentMethods.ts (Updated)
import { PaymentMethod } from '../models/PaymentMethod';
import { connectDB } from '../config/database';
import logger from '../utils/logger';

const seedPaymentMethods = async () => {
  try {
    await connectDB();

    const paymentMethods = [
      {
        name: 'Binance',
        type: 'crypto',
        enabled: true,
        details: {
          username: 'AhsanxSultan_Official',
          binanceId: '571628736',
          cryptoAddress: '0x1234567890abcdef1234567890abcdef12345678',
          cryptoNetwork: 'BSC',
          instructions: 'Send USDT on BSC network to the address above. Include your order ID in the memo.',
        },
      },
      {
        name: 'Bank Transfer',
        type: 'bank_transfer',
        enabled: true,
        details: {
          bankName: 'United Bank Limited (UBL)',
          accountName: 'Muhammad Ashfaq',
          accountNumber: '0360309820482',
          instructions: 'Please transfer the exact amount to the above account and send the screenshot.',
        },
      },
      {
        name: 'Easy Paisa',
        type: 'other',
        enabled: true,
        details: {
          accountNumber: '123456789',
          accountName: 'Sultan Store',
          instructions: 'Send payment via Easy Paisa and share transaction ID with screenshot.',
        },
      },
      {
        name: 'JazzCash',
        type: 'other',
        enabled: true,
        details: {
          accountNumber: '987654321',
          accountName: 'Sultan Store',
          instructions: 'Send payment via JazzCash and share transaction ID with screenshot.',
        },
      },
    ];

    for (const method of paymentMethods) {
      const existing = await PaymentMethod.findOne({ name: method.name });
      if (!existing) {
        await PaymentMethod.create(method);
        logger.info(`✅ Payment method created: ${method.name}`);
      } else {
        logger.info(`Payment method already exists: ${method.name}`);
      }
    }

    process.exit(0);
  } catch (error) {
    logger.error('Failed to seed payment methods:', error);
    process.exit(1);
  }
};

seedPaymentMethods();