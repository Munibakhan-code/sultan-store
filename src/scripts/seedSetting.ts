// src/scripts/seedSettings.ts
import { WebsiteSettings } from '../models/WebsiteSettings';
import { connectDB } from '../config/database';
import logger from '../utils/logger';

const seedSettings = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();

    // Check if settings already exist
    const existingSettings = await WebsiteSettings.findOne();
    
    if (existingSettings) {
      console.log('📋 Settings already exist in database:');
      console.log(`   Theme Color: ${existingSettings.themeColor}`);
      console.log(`   Hero Video: ${existingSettings.heroVideoUrl || 'Not set'}`);
      console.log('   ✅ Skipping seed (settings already exist)');
      process.exit(0);
    }

    console.log('📝 Creating default site settings...');

    // Default settings
    const defaultSettings = {
      heroVideoUrl: '', // Empty initially, can be updated via admin
      heroVideoPublicId: '', // Empty initially
      themeColor: '#D4AF37', // Gold theme matching PUBG store
    };

    const settings = await WebsiteSettings.create(defaultSettings);

    console.log('✅ Site settings created successfully!');
    console.log(`   Theme Color: ${settings.themeColor}`);
    console.log(`   Hero Video: ${settings.heroVideoUrl || 'Not configured'}`);
    console.log(`   Settings ID: ${settings._id}`);

    // Also display helpful next steps
    console.log('\n📌 Next Steps:');
    console.log('   1. Update hero video via admin: POST /api/admin/settings/hero-video');
    console.log('   2. Update theme color via admin: PATCH /api/admin/settings/theme');
    console.log('   3. View public settings: GET /api/settings/public');

    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to seed settings:', error);
    if (error instanceof Error) {
      console.error('   Error details:', error.message);
      console.error('   Stack:', error.stack);
    }
    process.exit(1);
  }
};

seedSettings();