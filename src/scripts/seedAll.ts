// src/scripts/seedAll.ts - Combined seed script for all data
import { connectDB } from '../config/database';
import { User } from '../models/User';
import { PaymentMethod } from '../models/PaymentMethod';
import { WebsiteSettings } from '../models/WebsiteSettings';
import { env } from '../config/env';
import logger from '../utils/logger';

const seedAll = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();

    console.log('\n📦 Starting database seeding...\n');

    // 1. Seed Admin
    console.log('1️⃣ Seeding Admin...');
    const adminEmail = env.ADMIN_EMAIL;
    const adminPassword = env.ADMIN_PASSWORD;
    const adminName = env.ADMIN_NAME;

    if (adminEmail && adminPassword && adminName) {
      const existingAdmin = await User.findOne({ email: adminEmail });
      if (existingAdmin) {
        console.log(`   ✅ Admin already exists: ${adminEmail}`);
      } else {
        await User.create({
          name: adminName,
          email: adminEmail,
          password: adminPassword,
          role: 'admin',
          isEmailVerified: true,
        });
        console.log(`   ✅ Admin created: ${adminEmail}`);
      }
    } else {
      console.log('   ⚠️ Admin credentials not set in environment variables');
    }

    // 2. Seed Payment Methods
    console.log('\n2️⃣ Seeding Payment Methods...');
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
        console.log(`   ✅ Payment method created: ${method.name}`);
      } else {
        console.log(`   ℹ️ Payment method already exists: ${method.name}`);
      }
    }

    // 3. Seed Website Settings
    console.log('\n3️⃣ Seeding Website Settings...');
    const existingSettings = await WebsiteSettings.findOne();
    
    if (existingSettings) {
      console.log(`   ℹ️ Settings already exist - Theme: ${existingSettings.themeColor}`);
    } else {
      await WebsiteSettings.create({
        heroVideoUrl: '',
        heroVideoPublicId: '',
        themeColor: '#D4AF37',
      });
      console.log('   ✅ Website settings created with default theme: #D4AF37');
    }

    console.log('\n✅ All seeds completed successfully!');
    console.log('\n📌 Summary:');
    console.log('   - Admin user: ✓');
    console.log('   - Payment Methods: ✓');
    console.log('   - Website Settings: ✓');
    console.log('\n🚀 Your database is ready!');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    if (error instanceof Error) {
      console.error('   Error details:', error.message);
      console.error('   Stack:', error.stack);
    }
    process.exit(1);
  }
};

seedAll();