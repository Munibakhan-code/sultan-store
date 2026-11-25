// src/routes/admin/admin.routes.ts
import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth';
import { adminAccountController } from '../../controllers/admin/adminAccount.controller';
import { adminSettingsController } from '../../controllers/admin/adminSettings.controller';
import { adminPaymentMethodController } from '../../controllers/admin/adminPaymentMethod.controller';
import { adminPaymentController } from '../../controllers/admin/adminPayment.controller';
import { adminConversationController } from '../../controllers/admin/adminConversation.controller';
import { adminCustomDemandController } from '../../controllers/admin/adminCustomDemand.controller';
import { adminReviewController } from '../../controllers/admin/adminReview.controller';
import { adminAnalyticsController } from '../../controllers/admin/adminAnalytics.controller';
import { adminCustomerController } from '../../controllers/admin/adminCustomer.controller';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

// Analytics
router.get('/analytics', adminAnalyticsController.getAnalytics);

// Customer Management
router.get('/customers', adminCustomerController.getAllCustomers);
router.get('/customers/:id', adminCustomerController.getCustomerById);

// Account management
router.get('/accounts', adminAccountController.getAllAccounts);
router.post('/accounts', adminAccountController.createAccount);
router.patch('/accounts/:id', adminAccountController.updateAccount);
router.delete('/accounts/:id', adminAccountController.deleteAccount);
router.post('/accounts/:id/images', adminAccountController.uploadAccountImages);
router.delete('/accounts/:id/images/:publicId', adminAccountController.deleteAccountImage);

// Settings
router.get('/settings', adminSettingsController.getSettings);
router.patch('/settings/theme', adminSettingsController.updateTheme);
router.post('/settings/hero-video', adminSettingsController.uploadHeroVideo);
router.delete('/settings/hero-video', adminSettingsController.deleteHeroVideo);

// WhatsApp Settings (NEW)
router.get('/settings/whatsapp', adminSettingsController.getWhatsAppSettings);
router.patch('/settings/whatsapp', adminSettingsController.updateWhatsAppSettings);

// Payment Methods
router.get('/payment-methods', adminPaymentMethodController.getAllMethods);
router.post('/payment-methods', adminPaymentMethodController.createMethod);
router.patch('/payment-methods/:id', adminPaymentMethodController.updateMethod);
router.delete('/payment-methods/:id', adminPaymentMethodController.deleteMethod);
router.post('/payment-methods/:id/logo', adminPaymentMethodController.uploadLogo);
router.delete('/payment-methods/:id/logo', adminPaymentMethodController.deleteLogo);

// Orders & Payments
router.get('/orders', adminPaymentController.getAllOrders);
router.get('/orders/:id', adminPaymentController.getOrderById);
router.get('/orders/:id/screenshot', adminPaymentController.getPaymentScreenshot);
router.post('/orders/:id/approve', adminPaymentController.approvePayment);
router.post('/orders/:id/reject', adminPaymentController.rejectPayment);
router.patch('/orders/:id/status', adminPaymentController.updateDealStatus);

// Conversations (Admin)
router.get('/conversations', adminConversationController.getAllConversations);
router.get('/conversations/:id', adminConversationController.getConversationById);
router.get('/conversations/:id/messages', adminConversationController.getMessages);

// Custom Demands (Admin)
router.get('/custom-demands', adminCustomDemandController.getAllDemands);
router.post('/custom-demands/:id/assist', adminCustomDemandController.assistDemand);
router.patch('/custom-demands/:id/status', adminCustomDemandController.updateDemandStatus);

// Reviews (Admin)
router.get('/reviews', adminReviewController.getAllReviews);
router.patch('/reviews/:id/status', adminReviewController.updateReviewStatus);
router.delete('/reviews/:id', adminReviewController.deleteReview);

export default router;