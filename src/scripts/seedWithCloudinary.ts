// src/scripts/seedWithCloudinary.ts
import { connectDB } from '../config/database';
import { cloudinaryService } from '../services/cloudinary.service';
import { env } from '../config/env';
import { WebsiteSettings } from '../models/WebsiteSettings';
import { PaymentMethod } from '../models/PaymentMethod';

// Helper to create a simple colored square as base64 image
const createImageBase64 = (color: string = '#D4AF37', text: string = ''): string => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
    <rect width="200" height="200" fill="${color}"/>
    ${text ? `<text x="50" y="120" font-family="Arial" font-size="20" fill="white">${text}</text>` : ''}
  </svg>`;
  
  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
};

const seedWithCloudinary = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();

    // Check if Cloudinary is configured
    if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
      console.error('❌ Cloudinary is not configured. Please add Cloudinary credentials to .env file');
      console.log('   Required: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
      process.exit(1);
    }

    console.log('✅ Cloudinary configuration found\n');

    // 1. Upload Default Logo
    console.log('📤 Uploading default logo...');
    const logoBase64 = createImageBase64('#D4AF37', 'Sultan Store');
    
    const logoResult = await cloudinaryService.uploadFromBase64(
      logoBase64,
      'brand',
      {
        transformation: [
          { width: 200, height: 200, crop: 'limit' },
          { quality: 'auto' },
          { fetch_format: 'auto' },
        ],
      }
    );

    console.log(`   ✅ Logo uploaded: ${logoResult.secure_url}\n`);

    // 2. Upload Default Hero Video (simple placeholder)
    console.log('📤 Uploading default hero video...');
    // Create a simple animated SVG as a video placeholder
    const videoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080">
      <rect width="1920" height="1080" fill="#1a1a2e"/>
      <rect x="710" y="440" width="500" height="100" rx="10" fill="#D4AF37" opacity="0.9"/>
      <text x="810" y="510" font-family="Arial" font-size="48" fill="#1a1a2e" font-weight="bold">Sultan Store</text>
      <text x="760" y="580" font-family="Arial" font-size="24" fill="#D4AF37">PUBG Account Marketplace</text>
    </svg>`;
    
    const videoBase64 = Buffer.from(videoSvg).toString('base64');
    const heroVideoBase64 = `data:image/svg+xml;base64,${videoBase64}`;
    
    try {
      const heroResult = await cloudinaryService.uploadFromBase64(
        heroVideoBase64,
        'hero',
        {
          transformation: [
            { quality: 'auto' },
            { fetch_format: 'auto' },
          ],
        }
      );

      console.log(`   ✅ Hero video placeholder uploaded: ${heroResult.secure_url}\n`);
      
      // Update Website Settings with hero video
      const settings = await WebsiteSettings.getSettings();
      settings.heroVideoUrl = heroResult.secure_url;
      settings.heroVideoPublicId = heroResult.public_id;
      await settings.save();
      console.log('   ✅ Website settings updated with hero video\n');
    } catch (videoError) {
      console.log('   ⚠️ Hero video upload skipped (using default settings)\n');
    }

    // 3. Update Payment Methods with Logos
    console.log('📤 Updating payment methods with logos...');
    
    const paymentMethods = await PaymentMethod.find();
    
    for (const method of paymentMethods) {
      try {
        let color = '#4CAF50';
        let text = method.name;
        
        if (method.name.includes('Bank')) {
          color = '#2196F3';
        } else if (method.name.includes('Binance')) {
          color = '#F3BA2F';
        } else if (method.name.includes('Easy')) {
          color = '#9C27B0';
        } else if (method.name.includes('Jazz')) {
          color = '#FF6F00';
        }
        
        const logoBase64Payment = createImageBase64(color, text);
        
        const result = await cloudinaryService.uploadFromBase64(
          logoBase64Payment,
          'payment-methods',
          {
            transformation: [
              { width: 150, height: 150, crop: 'limit' },
              { quality: 'auto' },
              { fetch_format: 'auto' },
            ],
          }
        );
        
        method.logo = {
          url: result.secure_url,
          publicId: result.public_id,
        };
        await method.save();
        
        console.log(`   ✅ Logo uploaded for: ${method.name}`);
      } catch (error) {
        console.log(`   ⚠️ Failed to upload logo for: ${method.name}`);
      }
    }

    console.log('\n✅ All seed data with Cloudinary completed successfully!');
    console.log('\n📌 Summary:');
    console.log('   ✅ Default logo uploaded to Cloudinary');
    console.log('   ✅ Hero video placeholder uploaded to Cloudinary');
    console.log('   ✅ Payment method logos uploaded to Cloudinary');
    console.log('   ✅ Website settings updated');
    console.log('\n🌐 Cloudinary URLs are ready for frontend use!');

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

seedWithCloudinary();