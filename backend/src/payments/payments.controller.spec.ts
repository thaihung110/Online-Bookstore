import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentLoggingService } from './services/payment-logging.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

// Mock interfaces to avoid complex TypeScript issues
interface MockPayment {
  _id: string;
  orderId: string;
  amount: number;
  paymentMethod: string;
  status: string;
  transactionId?: string;
  createdAt: Date;
  completedAt?: Date;
}

interface MockRequest {
  ip: string;
  socket?: { remoteAddress: string };
  user?: { id: string };
}

describe('PaymentsController - Pay Order & Refund Use Cases', () => {
  let controller: PaymentsController;
  let paymentsService: jest.Mocked<PaymentsService>;
  let paymentLoggingService: jest.Mocked<PaymentLoggingService>;

  // Mock data
  const mockPayment: MockPayment = {
    _id: '507f1f77bcf86cd799439011',
    orderId: 'ORD123',
    amount: 500000,
    paymentMethod: 'VNPAY',
    status: 'PENDING',
    transactionId: null,
    createdAt: new Date(),
  };

  const mockCompletedPayment: MockPayment = {
    ...mockPayment,
    status: 'COMPLETED',
    transactionId: 'VNP123456',
    completedAt: new Date(),
  };

  const mockRequest: MockRequest = {
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
    user: { id: 'user123' },
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

    const mockPaymentLoggingService = {
      logPaymentFlow: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        {
          provide: PaymentsService,
          useValue: mockPaymentsService,
        },
        {
          provide: PaymentLoggingService,
          useValue: mockPaymentLoggingService,
        },
      ],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
    paymentsService = module.get<PaymentsService>(
      PaymentsService,
    ) as jest.Mocked<PaymentsService>;
    paymentLoggingService = module.get<PaymentLoggingService>(
      PaymentLoggingService,
    ) as jest.Mocked<PaymentLoggingService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Pay Order Use Case', () => {
    describe('create - Create Payment', () => {
      it('should create VNPAY payment successfully with redirect URL', async () => {
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

      it('should create COD payment successfully without redirect URL', async () => {
        // Arrange
        const codPaymentDto = {
          orderId: 'ORD123',
          paymentMethod: 'COD',
          description: 'Test payment',
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
        expect((result as any).redirectUrl).toBeUndefined();
        expect((result as any).payment.paymentMethod).toBe('COD');
      });

      it('should throw BadRequestException for invalid payment data', async () => {
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

    describe('handleVnpayCallback - Process VNPAY Payment Callback', () => {
      const mockCallbackQuery = {
        vnp_Amount: '50000000',
        vnp_BankCode: 'VNBANK',
        vnp_CardType: 'QRCODE',
        vnp_OrderInfo: 'Thanh toan don hang ORD123',
        vnp_PayDate: '20241201120000',
        vnp_ResponseCode: '00',
        vnp_TransactionNo: 'VNP123456',
        vnp_TxnRef: mockPayment._id,
        vnp_SecureHash: 'valid_hash',
      };

      it('should handle successful VNPAY callback', async () => {
        // Arrange
        paymentsService.handleVnpayCallback.mockResolvedValue(
          mockCompletedPayment as any,
        );

        // Act
        const result = await controller.handleVnpayCallback(
          mockCallbackQuery as any,
          mockRequest as any,
        );

        // Assert
        expect(paymentsService.handleVnpayCallback).toHaveBeenCalledWith(
          mockCallbackQuery,
        );
        expect(result.status).toBe('COMPLETED');
        expect(result.transactionId).toBe('VNP123456');
      });

      it('should handle failed VNPAY callback', async () => {
        // Arrange
        const failedQuery = { ...mockCallbackQuery, vnp_ResponseCode: '01' };
        const failedPayment = { ...mockPayment, status: 'FAILED' };

        paymentsService.handleVnpayCallback.mockResolvedValue(
          failedPayment as any,
        );

        // Act
        const result = await controller.handleVnpayCallback(
          failedQuery as any,
          mockRequest as any,
        );

        // Assert
        expect(result.status).toBe('FAILED');
      });

      it('should throw NotFoundException for invalid payment reference', async () => {
        // Arrange
        paymentsService.handleVnpayCallback.mockRejectedValue(
          new NotFoundException('Payment not found'),
        );

        // Act & Assert
        await expect(
          controller.handleVnpayCallback(
            mockCallbackQuery as any,
            mockRequest as any,
          ),
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe('processPayment - Process Payment After Creation', () => {
      it('should process VNPAY payment and return redirect URL', async () => {
        // Arrange
        const expectedResult = {
          success: true,
          redirectUrl: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...',
        };

        paymentsService.processPayment.mockResolvedValue(expectedResult as any);

        // Act
        const result = await controller.processPayment(mockPayment._id);

        // Assert
        expect(paymentsService.processPayment).toHaveBeenCalledWith(
          mockPayment._id,
        );
        expect(result.success).toBe(true);
        expect((result as any).redirectUrl).toBeDefined();
      });

      it('should process COD payment without redirect URL', async () => {
        // Arrange
        const expectedResult = { success: true };

        paymentsService.processPayment.mockResolvedValue(expectedResult as any);

        // Act
        const result = await controller.processPayment(mockPayment._id);

        // Assert
        expect(result.success).toBe(true);
        expect((result as any).redirectUrl).toBeUndefined();
      });
    });
  });

  describe('Refund Use Case', () => {
    describe('refundPayment - Process Refund', () => {
      it('should refund VNPAY payment successfully', async () => {
        // Arrange
        paymentsService.findOne.mockResolvedValue(mockCompletedPayment as any);
        paymentsService.refundPayment.mockResolvedValue({
          success: true,
        } as any);

        // Act
        const result = await controller.refundPayment(mockCompletedPayment._id);

        // Assert
        expect(paymentsService.findOne).toHaveBeenCalledWith(
          mockCompletedPayment._id,
        );
        expect(paymentsService.refundPayment).toHaveBeenCalledWith(
          mockCompletedPayment,
        );
        expect(result.success).toBe(true);
      });

      it('should throw BadRequestException for non-completed payment', async () => {
        // Arrange
        paymentsService.findOne.mockResolvedValue(mockPayment as any);
        paymentsService.refundPayment.mockRejectedValue(
          new BadRequestException('Payment not completed'),
        );

        // Act & Assert
        await expect(controller.refundPayment(mockPayment._id)).rejects.toThrow(
          BadRequestException,
        );
      });

      it('should throw NotFoundException for non-existent payment', async () => {
        // Arrange
        paymentsService.findOne.mockRejectedValue(
          new NotFoundException('Payment not found'),
        );

        // Act & Assert
        await expect(controller.refundPayment('invalid_id')).rejects.toThrow(
          NotFoundException,
        );
      });

      it('should refund COD payment successfully', async () => {
        // Arrange
        const codPayment = {
          ...mockCompletedPayment,
          paymentMethod: 'COD',
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
    });

    describe('findByOrderId - Find Payment by Order ID', () => {
      it('should find payment by order ID successfully', async () => {
        // Arrange
        paymentsService.findByOrderId.mockResolvedValue(
          mockCompletedPayment as any,
        );

        // Act
        const result = await controller.findByOrderId('ORD123');

        // Assert
        expect(paymentsService.findByOrderId).toHaveBeenCalledWith('ORD123');
        expect(result.orderId).toBe('ORD123');
      });

      it('should throw NotFoundException for non-existent order', async () => {
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
    it('should handle complete pay-to-refund flow', async () => {
      // Arrange - Create payment
      const createPaymentDto = {
        orderId: 'ORD123',
        paymentMethod: 'VNPAY',
      };

      paymentsService.createPayment.mockResolvedValue({
        payment: mockPayment,
        redirectUrl: 'vnpay_url',
      } as any);

      // Process payment
      paymentsService.processPayment.mockResolvedValue({
        success: true,
        redirectUrl: 'vnpay_url',
      } as any);

      // Handle callback
      paymentsService.handleVnpayCallback.mockResolvedValue(
        mockCompletedPayment as any,
      );

      // Refund
      paymentsService.findOne.mockResolvedValue(mockCompletedPayment as any);
      paymentsService.refundPayment.mockResolvedValue({ success: true } as any);

      // Act & Assert - Complete flow
      const createResult = await controller.create(
        createPaymentDto as any,
        mockRequest as any,
      );
      expect((createResult as any).payment).toBeDefined();

      const processResult = await controller.processPayment(mockPayment._id);
      expect(processResult.success).toBe(true);

      const callbackResult = await controller.handleVnpayCallback(
        {
          vnp_ResponseCode: '00',
          vnp_TxnRef: mockPayment._id,
        } as any,
        mockRequest as any,
      );
      expect(callbackResult.status).toBe('COMPLETED');

      const refundResult = await controller.refundPayment(
        mockCompletedPayment._id,
      );
      expect(refundResult.success).toBe(true);
    });

    it('should handle COD payment flow', async () => {
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
      expect((createResult as any).payment.paymentMethod).toBe('COD');

      const refundResult = await controller.refundPayment(codPayment._id);
      expect(refundResult.success).toBe(true);
    });

    it('should handle payment error scenarios', async () => {
      // Test various error scenarios
      const errorScenarios = [
        {
          name: 'Invalid order ID',
          error: new BadRequestException('Order not found'),
          expectError: BadRequestException,
        },
        {
          name: 'Payment service unavailable',
          error: new BadRequestException('Service unavailable'),
          expectError: BadRequestException,
        },
        {
          name: 'Invalid payment data',
          error: new BadRequestException('Invalid payment data'),
          expectError: BadRequestException,
        },
      ];

      for (const scenario of errorScenarios) {
        // Reset mocks
        jest.clearAllMocks();

        paymentsService.createPayment.mockRejectedValue(scenario.error);

        await expect(
          controller.create(
            { orderId: 'ORD123', paymentMethod: 'VNPAY' } as any,
            mockRequest as any,
          ),
        ).rejects.toThrow(scenario.expectError);
      }
    });
  });
});
