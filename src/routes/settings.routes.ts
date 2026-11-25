// src/routes/settings.routes.ts
import { Router } from 'express';
import { WebsiteSettings } from '../models/WebsiteSettings';
import { WhatsAppSettings } from '../models/WhatsAppSettings';

const router = Router();

// Public settings
router.get('/public', async (req, res, next) => {
  try {
    const settings = await WebsiteSettings.getSettings();
    res.status(200).json({
      success: true,
      data: {
        heroVideoUrl: settings.heroVideoUrl,
        themeColor: settings.themeColor,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Public WhatsApp settings
router.get('/whatsapp', async (req, res, next) => {
  try {
    const settings = await WhatsAppSettings.getSettings();
    res.status(200).json({
      success: true,
      data: {
        phoneNumber: settings.isEnabled ? settings.phoneNumber : '',
        isEnabled: settings.isEnabled,
        messageTemplate: settings.messageTemplate,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;