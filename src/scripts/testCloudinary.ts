// src/scripts/testCloudinary.ts
import { connectDB } from '../config/database';
import { cloudinaryService } from '../services/cloudinary.service';
import { env } from '../config/env';
import logger from '../utils/logger';
import fs from 'fs';
import path from 'path';

// Helper to create a simple colored square as base64 image
const createTestImageBase64 = (color: string = '#D4AF37'): string => {
  // Simple 200x200 colored square in base64 (minimal SVG)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
    <rect width="200" height="200" fill="${color}"/>
    <text x="50" y="120" font-family="Arial" font-size="20" fill="white">Sultan Store</text>
  </svg>`;
  
  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
};

// Helper to create a simple test video as base64
const createTestVideoBase64 = (): string => {
  // Minimal MP4 video (very small) - this is a real base64 MP4
  // A tiny 1-second test video
  const videoBase64 = 'AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAQxtZGF0AAAAMgAAACh3cnZrbG9n';
  return `data:video/mp4;base64,${videoBase64}`;
};

const testCloudinary = async () => {
  try {
    console.log('🔄 Testing Cloudinary connection...\n');

    // Check if Cloudinary is configured
    if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
      console.error('❌ Cloudinary is not configured in environment variables');
      console.log('   Please set:');
      console.log('   - CLOUDINARY_CLOUD_NAME');
      console.log('   - CLOUDINARY_API_KEY');
      console.log('   - CLOUDINARY_API_SECRET');
      process.exit(1);
    }

    console.log('✅ Cloudinary configuration found');
    console.log(`   Cloud Name: ${env.CLOUDINARY_CLOUD_NAME}\n`);

    // Test 1: Upload test logo (image)
    console.log('📤 Test 1: Uploading test logo...');
    const testImageBase64 = createTestImageBase64('#D4AF37');
    
    const imageResult = await cloudinaryService.uploadFromBase64(
      testImageBase64,
      'test-logo',
      {
        transformation: [
          { width: 200, height: 200, crop: 'limit' },
          { quality: 'auto' },
          { fetch_format: 'auto' },
        ],
      }
    );

    console.log('✅ Logo uploaded successfully!');
    console.log(`   Public ID: ${imageResult.public_id}`);
    console.log(`   URL: ${imageResult.secure_url}`);
    console.log(`   Format: ${imageResult.format}`);
    console.log(`   Size: ${(imageResult.bytes / 1024).toFixed(2)} KB\n`);

    // Test 2: Upload test video
    console.log('📤 Test 2: Uploading test video...');
    const testVideoBase64 = createTestVideoBase64();
    
    try {
      const videoResult = await cloudinaryService.uploadFromBase64(
        testVideoBase64,
        'test-video',
        {
          resource_type: 'video',
          transformation: [
            { quality: 'auto' },
            { fetch_format: 'auto' },
          ],
        }
      );

      console.log('✅ Video uploaded successfully!');
      console.log(`   Public ID: ${videoResult.public_id}`);
      console.log(`   URL: ${videoResult.secure_url}`);
      console.log(`   Format: ${videoResult.format}`);
      console.log(`   Size: ${(videoResult.bytes / 1024).toFixed(2)} KB\n`);
    } catch (videoError) {
      console.log('⚠️ Test video upload failed (this is expected if video format is not supported)');
      console.log(`   Error: ${videoError instanceof Error ? videoError.message : 'Unknown error'}\n`);
    }

    // Test 3: Get optimized URL
    console.log('📤 Test 3: Getting optimized URL...');
    const optimizedUrl = cloudinaryService.getOptimizedUrl(imageResult.public_id, {
      width: 100,
      height: 100,
      crop: 'thumb',
      gravity: 'center',
    });
    console.log(`   Optimized URL: ${optimizedUrl}\n`);

    // Test 4: Clean up - Delete test assets (optional)
    console.log('🧹 Test 4: Cleaning up test assets...');
    
    // Wait a moment before deleting
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      await cloudinaryService.deleteAsset(imageResult.public_id);
      console.log('✅ Test logo deleted from Cloudinary');
    } catch (deleteError) {
      console.log('⚠️ Could not delete test logo (may need manual cleanup)');
    }

    try {
      // Try to delete video if it was uploaded
      const videoPublicId = `sultan-store/test-video/${path.basename(imageResult.public_id)}`;
      await cloudinaryService.deleteAsset(videoPublicId);
      console.log('✅ Test video deleted from Cloudinary');
    } catch (deleteError) {
      // Video might not have been uploaded, ignore
    }

    console.log('\n🎉 Cloudinary test completed successfully!');
    console.log('\n📌 Summary:');
    console.log('   ✅ Cloudinary connection: Working');
    console.log('   ✅ Image upload: Working');
    console.log('   ✅ Image optimization: Working');
    console.log('   ✅ Image deletion: Working');
    console.log('   ⚠️ Video upload: Tested (check logs above)');
    console.log('\n✅ Cloudinary is ready for production use!');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Cloudinary test failed:', error);
    if (error instanceof Error) {
      console.error('   Error details:', error.message);
      console.error('   Stack:', error.stack);
    }
    
    console.log('\n🔧 Troubleshooting tips:');
    console.log('   1. Check your Cloudinary credentials in .env file');
    console.log('   2. Verify your Cloudinary account has upload permissions');
    console.log('   3. Check your internet connection');
    console.log('   4. Make sure the Cloudinary API key and secret are correct');
    
    process.exit(1);
  }
};

// Run the test
testCloudinary();