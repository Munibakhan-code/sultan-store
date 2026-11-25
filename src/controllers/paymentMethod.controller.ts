// src/controllers/paymentMethod.controller.ts
import { Request, Response, NextFunction } from 'express';
import { PaymentMethod } from '../models/PaymentMethod';

export class PaymentMethodController {
  async getPublicMethods(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const methods = await PaymentMethod.find({ enabled: true })
        .select('name type logo details instructions')
        .sort({ createdAt: 1 });
      
      // Return only customer-facing details
      const publicMethods = methods.map((method: any) => {
        const publicData: any = {
          id: method._id,
          name: method.name,
          type: method.type,
          logo: method.logo,
        };

        // Add relevant details based on type
        if (method.type === 'bank_transfer') {
          publicData.details = {
            bankName: method.details.bankName,
            accountName: method.details.accountName,
            accountNumber: method.details.accountNumber,
            instructions: method.details.instructions,
          };
        } else if (method.type === 'crypto') {
          publicData.details = {
            cryptoAddress: method.details.cryptoAddress,
            cryptoNetwork: method.details.cryptoNetwork,
            instructions: method.details.instructions,
          };
        } else {
          publicData.details = {
            instructions: method.details.instructions,
          };
        }

        return publicData;
      });

      res.status(200).json({
        success: true,
        data: { methods: publicMethods },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const paymentMethodController = new PaymentMethodController();