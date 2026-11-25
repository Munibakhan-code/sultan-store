// src/scripts/seedAdmin.ts
import { User } from '../models/User';
import { env } from '../config/env';
import { connectDB } from '../config/database';
import logger from '../utils/logger';

const seedAdmin = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();

    const adminEmail = env.ADMIN_EMAIL;
    const adminPassword = env.ADMIN_PASSWORD;
    const adminName = env.ADMIN_NAME;

    console.log('📧 Admin email:', adminEmail);

    if (!adminEmail || !adminPassword || !adminName) {
      console.error(
        '❌ Admin credentials not set in environment variables'
      );
      console.error('   Required: ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME');
      process.exit(1);
    }

    console.log('🔍 Checking for existing admin...');
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log(`✅ Admin user already exists: ${adminEmail}`);
      console.log(`   Name: ${existingAdmin.name}`);
      console.log(`   Role: ${existingAdmin.role}`);
      process.exit(0);
    }

    console.log('👤 Creating admin user...');
    const admin = await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      isEmailVerified: true,
    });

    console.log(`✅ Admin user created successfully!`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Name: ${admin.name}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   ID: ${admin._id}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to seed admin:', error);
    if (error instanceof Error) {
      console.error('   Error details:', error.message);
      console.error('   Stack:', error.stack);
    }
    process.exit(1);
  }
};

seedAdmin();