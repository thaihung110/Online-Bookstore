import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EmailService } from './email.service';

@ApiTags('email-test')
@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Get('test-connection')
  @ApiOperation({ summary: 'Test email connection' })
  @ApiResponse({ status: 200, description: 'Email connection test result' })
  async testConnection() {
    const result = await this.emailService.testEmailConnection();
    return {
      success: result,
      message: result
        ? 'Email connection successful'
        : 'Email connection failed',
    };
  }

  @Post('test-payment-success')
  @ApiOperation({ summary: 'Test payment success email' })
  @ApiResponse({ status: 200, description: 'Test email sent successfully' })
  async testPaymentSuccessEmail(@Body() testData?: any) {
    const mockOrderData = {
      order: {
        _id: '64f8c1234567890abcdef123',
        orderNumber: 'ORD-TEST-001',
        status: 'RECEIVED',
        total: 500000,
        subtotal: 450000,
        tax: 45000,
        shippingCost: 5000,
        items: [
          {
            title: 'Sample Book Title',
            quantity: 2,
            price: 225000,
          },
        ],
        shippingAddress: {
          fullName: 'Test User',
          addressLine1: '123 Test Street',
          city: 'Ho Chi Minh City',
          country: 'Vietnam',
          email: 'testuser@example.com',
        },
        user: {
          email: 'user@example.com',
        },
        createdAt: new Date(),
        receivedAt: new Date(),
      },
      payment: {
        _id: 'pay_64f8c1234567890abcdef123',
        status: 'COMPLETED',
        amount: 500000,
        paymentMethod: 'vnpay',
        transactionId: 'VNP12345678',
        bankCode: 'NCB',
        completedAt: new Date(),
      },
      vnpayResponse: {
        vnp_Amount: '50000000', // VND * 100
        vnp_BankCode: 'NCB',
        vnp_TransactionNo: 'VNP12345678',
        vnp_ResponseCode: '00',
      },
    };

    // Override with test data if provided
    const orderData = testData || mockOrderData;

    const result = await this.emailService.sendPaymentSuccessEmail(orderData);

    return {
      success: result,
      message: result
        ? 'Test email sent successfully'
        : 'Failed to send test email',
      recipient:
        orderData.order?.shippingAddress?.email ||
        orderData.order?.user?.email ||
        'hungvt0110@outlook.com',
      orderData: orderData.order,
    };
  }
}
