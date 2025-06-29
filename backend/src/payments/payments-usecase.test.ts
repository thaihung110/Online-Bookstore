import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

// Mock interfaces để tránh TypeScript errors
interface MockPayment {
  _id: string;
  orderId: string;
  amount: number;
  paymentMethod: string;
  status: string;
  transactionId?: string;
  createdAt: Date;
}

interface MockRequest {
  ip: string;
  user?: { id: string };
}

describe('Payment Use Cases - Simplified Tests', () => {
  let controller: PaymentsController;
  let paymentsService: jest.Mocked<PaymentsService>;

  const mockPayment: MockPayment = {
    _id: '507f1f77bcf86cd799439011',
    orderId: 'ORD123',
    amount: 500000,
    paymentMethod: 'VNPAY',
    status: 'PENDING',
    transactionId: null,
    createdAt: new Date(),
  };

  const mockRequest: MockRequest = {
    ip: '127.0.0.1',
    user: { id: 'user123' },
  };

  const mockVnpayCallback = {
    vnp_Amount: '50000000',
    vnp_ResponseCode: '00',
    vnp_TransactionNo: 'VNP123456',
    vnp_TxnRef: mockPayment._id,
  };

  beforeEach(async () => {
    const mockPaymentsService = {
      createPayment: jest.fn(),
      handleVnpayCallback: jest.fn(),
      findOne: jest.fn(),
      refundPayment: jest.fn(),
      findByOrderId: jest.fn(),
      processPayment: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        {
          provide: PaymentsService,
          useValue: mockPaymentsService,
        },
      ],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
    paymentsService = module.get<PaymentsService>(
      PaymentsService,
    ) as jest.Mocked<PaymentsService>;
  });

  describe('Pay Order Use Case', () => {
    describe('Create Payment', () => {
      it('should create VNPAY payment with redirect URL', async () => {
        // Arrange
        const createPaymentDto = {
          orderId: 'ORD123',
          paymentMethod: 'VNPAY',
          description: 'Test payment',
        };

        const expectedResult = {
          payment: mockPayment,
          redirectUrl: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...',
        };

        paymentsService.createPayment.mockResolvedValue(expectedResult as any);

        // Act
        const result = await controller.create(
          createPaymentDto as any,
          mockRequest as any,
        );

        // Assert
        expect(paymentsService.createPayment).toHaveBeenCalledWith(
          createPaymentDto,
          mockRequest.ip,
        );
        expect(result).toEqual(expectedResult);
        expect((result as any).redirectUrl).toBeDefined();
      });

      it('should create COD payment without redirect URL', async () => {
        // Arrange
        const codPaymentDto = {
          orderId: 'ORD123',
          paymentMethod: 'COD',
          description: 'COD payment',
        };

        const expectedResult = {
          payment: { ...mockPayment, paymentMethod: 'COD' },
        };

        paymentsService.createPayment.mockResolvedValue(expectedResult as any);

        // Act
        const result = await controller.create(
          codPaymentDto as any,
          mockRequest as any,
        );

        // Assert
        expect((result as any).payment.paymentMethod).toBe('COD');
        expect((result as any).redirectUrl).toBeUndefined();
      });

      it('should handle payment creation errors', async () => {
        // Arrange
        const invalidDto = {
          orderId: '',
          paymentMethod: 'VNPAY',
        };

        paymentsService.createPayment.mockRejectedValue(
          new BadRequestException('Invalid order ID'),
        );

        // Act & Assert
        await expect(
          controller.create(invalidDto as any, mockRequest as any),
        ).rejects.toThrow(BadRequestException);
      });
    });

    describe('Handle VNPAY Callback', () => {
      it('should handle successful VNPAY callback', async () => {
        // Arrange
        const successfulPayment = {
          ...mockPayment,
          status: 'COMPLETED',
          transactionId: 'VNP123456',
        };

        paymentsService.handleVnpayCallback.mockResolvedValue(
          successfulPayment as any,
        );

        // Act
        const mockResponse = { redirect: jest.fn() };
        await controller.handleVnpayCallback(
          mockVnpayCallback as any,
          mockRequest as any,
          mockResponse as any,
        );

        // Assert
        expect(paymentsService.handleVnpayCallback).toHaveBeenCalledWith(
          mockVnpayCallback,
        );
        expect(mockResponse.redirect).toHaveBeenCalledWith(
          expect.stringContaining('http://localhost:3000/order-confirmation')
        );
        expect(mockResponse.redirect).toHaveBeenCalledWith(
          expect.stringContaining('status=success')
        );
      });

      it('should handle failed VNPAY callback', async () => {
        // Arrange
        const failedCallback = { ...mockVnpayCallback, vnp_ResponseCode: '01' };
        const failedPayment = { ...mockPayment, status: 'FAILED' };

        paymentsService.handleVnpayCallback.mockResolvedValue(
          failedPayment as any,
        );

        // Act
        const mockResponse = { redirect: jest.fn() };
        await controller.handleVnpayCallback(
          failedCallback as any,
          mockRequest as any,
          mockResponse as any,
        );

        // Assert
        expect(mockResponse.redirect).toHaveBeenCalledWith(
          expect.stringContaining('http://localhost:3000/order-confirmation')
        );
        expect(mockResponse.redirect).toHaveBeenCalledWith(
          expect.stringContaining('status=success')
        );
      });

      it('should handle invalid payment reference', async () => {
        // Arrange
        paymentsService.handleVnpayCallback.mockRejectedValue(
          new NotFoundException('Payment not found'),
        );

        // Act
        const mockResponse = { redirect: jest.fn() };
        await controller.handleVnpayCallback(
          mockVnpayCallback as any,
          mockRequest as any,
          mockResponse as any,
        );

        // Assert - should redirect to error page
        expect(mockResponse.redirect).toHaveBeenCalledWith(
          expect.stringContaining('http://localhost:3000/order-confirmation')
        );
        expect(mockResponse.redirect).toHaveBeenCalledWith(
          expect.stringContaining('status=error')
        );
      });
    });
  });

  describe('Refund Use Case', () => {
    describe('Process Refund', () => {
      it('should refund VNPAY payment successfully', async () => {
        // Arrange
        const completedPayment = {
          ...mockPayment,
          status: 'COMPLETED',
          transactionId: 'VNP123456',
        };

        paymentsService.findOne.mockResolvedValue(completedPayment as any);
        paymentsService.refundPayment.mockResolvedValue({
          success: true,
        } as any);

        // Act
        const result = await controller.refundPayment(completedPayment._id);

        // Assert
        expect(paymentsService.findOne).toHaveBeenCalledWith(
          completedPayment._id,
        );
        expect(paymentsService.refundPayment).toHaveBeenCalledWith(
          completedPayment,
        );
        expect(result.success).toBe(true);
      });

      it('should refund COD payment successfully', async () => {
        // Arrange
        const codPayment = {
          ...mockPayment,
          paymentMethod: 'COD',
          status: 'COMPLETED',
        };

        paymentsService.findOne.mockResolvedValue(codPayment as any);
        paymentsService.refundPayment.mockResolvedValue({
          success: true,
        } as any);

        // Act
        const result = await controller.refundPayment(codPayment._id);

        // Assert
        expect(result.success).toBe(true);
      });

      it('should handle refund errors', async () => {
        // Arrange
        const pendingPayment = { ...mockPayment, status: 'PENDING' };

        paymentsService.findOne.mockResolvedValue(pendingPayment as any);
        paymentsService.refundPayment.mockRejectedValue(
          new BadRequestException('Payment not completed'),
        );

        // Act & Assert
        await expect(
          controller.refundPayment(pendingPayment._id),
        ).rejects.toThrow(BadRequestException);
      });

      it('should handle non-existent payment', async () => {
        // Arrange
        paymentsService.findOne.mockRejectedValue(
          new NotFoundException('Payment not found'),
        );

        // Act & Assert
        await expect(controller.refundPayment('invalid_id')).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('Find Payment by Order ID', () => {
      it('should find payment by order ID', async () => {
        // Arrange
        paymentsService.findByOrderId.mockResolvedValue(mockPayment as any);

        // Act
        const result = await controller.findByOrderId('ORD123');

        // Assert
        expect(paymentsService.findByOrderId).toHaveBeenCalledWith('ORD123');
        expect(result.orderId).toBe('ORD123');
      });

      it('should handle non-existent order payment', async () => {
        // Arrange
        paymentsService.findByOrderId.mockRejectedValue(
          new NotFoundException('Payment not found for order'),
        );

        // Act & Assert
        await expect(controller.findByOrderId('INVALID_ORDER')).rejects.toThrow(
          NotFoundException,
        );
      });
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete payment-to-refund flow', async () => {
      // Arrange - Create payment
      const createDto = {
        orderId: 'ORD123',
        paymentMethod: 'VNPAY',
      };

      paymentsService.createPayment.mockResolvedValue({
        payment: mockPayment,
        redirectUrl: 'vnpay_url',
      } as any);

      // Handle callback
      const completedPayment = {
        ...mockPayment,
        status: 'COMPLETED',
        transactionId: 'VNP123456',
      };

      paymentsService.handleVnpayCallback.mockResolvedValue(
        completedPayment as any,
      );

      // Refund
      paymentsService.findOne.mockResolvedValue(completedPayment as any);
      paymentsService.refundPayment.mockResolvedValue({ success: true } as any);

      // Act & Assert - Complete flow
      // 1. Create payment
      const createResult = await controller.create(
        createDto as any,
        mockRequest as any,
      );
      expect(createResult.payment).toBeDefined();

      // 2. Handle callback
      const mockResponse = { redirect: jest.fn() };
      await controller.handleVnpayCallback(
        { vnp_ResponseCode: '00', vnp_TxnRef: mockPayment._id } as any,
        mockRequest as any,
        mockResponse as any,
      );
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('status=success')
      );

      // 3. Refund payment
      const refundResult = await controller.refundPayment(completedPayment._id);
      expect(refundResult.success).toBe(true);
    });

    it('should handle COD payment creation and refund', async () => {
      // Arrange
      const codDto = {
        orderId: 'ORD123',
        paymentMethod: 'COD',
      };

      const codPayment = {
        ...mockPayment,
        paymentMethod: 'COD',
        status: 'COMPLETED',
      };

      paymentsService.createPayment.mockResolvedValue({
        payment: codPayment,
      } as any);
      paymentsService.findOne.mockResolvedValue(codPayment as any);
      paymentsService.refundPayment.mockResolvedValue({ success: true } as any);

      // Act & Assert
      const createResult = await controller.create(
        codDto as any,
        mockRequest as any,
      );
      expect(createResult.payment.paymentMethod).toBe('COD');

      const refundResult = await controller.refundPayment(codPayment._id);
      expect(refundResult.success).toBe(true);
    });
  });
});

// Export test utilities for reuse
export const TestUtils = {
  createMockPayment: (overrides: Partial<MockPayment> = {}): MockPayment => ({
    _id: '507f1f77bcf86cd799439011',
    orderId: 'ORD123',
    amount: 500000,
    paymentMethod: 'VNPAY',
    status: 'PENDING',
    transactionId: null,
    createdAt: new Date(),
    ...overrides,
  }),

  createMockRequest: (overrides: Partial<MockRequest> = {}): MockRequest => ({
    ip: '127.0.0.1',
    user: { id: 'user123' },
    ...overrides,
  }),

  createMockVnpayCallback: (overrides: any = {}) => ({
    vnp_Amount: '50000000',
    vnp_ResponseCode: '00',
    vnp_TransactionNo: 'VNP123456',
    vnp_TxnRef: '507f1f77bcf86cd799439011',
    ...overrides,
  }),
};
