import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Req,
  HttpStatus,
  HttpCode,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentsService } from './payments.service';
import { PaymentLoggingService } from './services/payment-logging.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { VNPayCallbackDTO } from './dto/vnpay-callback.dto';
import { Payment, PaymentDocument } from './schemas/payment.schema';
import { Transaction } from './schemas/transaction.schema';
import { PaymentLog } from './schemas/payment-log.schema';
import { VNPayIpnResponse } from './interfaces/vnpay-response.interface';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly paymentLoggingService: PaymentLoggingService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Tạo thanh toán mới',
    description:
      'Tạo yêu cầu thanh toán mới. Với VNPay sẽ trả về URL redirect, với COD chỉ tạo record.',
  })
  @ApiResponse({
    status: 201,
    description: 'Tạo thanh toán thành công',
    schema: {
      type: 'object',
      properties: {
        payment: {
          $ref: '#/components/schemas/Payment',
          description: 'Thông tin thanh toán vừa tạo',
        },
        redirectUrl: {
          type: 'string',
          description:
            'URL redirect tới VNPay (chỉ có khi paymentMethod là VNPAY)',
          example: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu không hợp lệ',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Số tiền thanh toán không hợp lệ' },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  async create(
    @Body() createPaymentDto: CreatePaymentDto,
    @Req() req: Request,
  ) {
    const ipAddr = req.ip || req.socket.remoteAddress || '127.0.0.1';
    return this.paymentsService.createPayment(createPaymentDto, ipAddr);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy danh sách thanh toán' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách thanh toán',
    type: [Payment],
  })
  async findAll(): Promise<PaymentDocument[]> {
    return this.paymentsService.findAll();
  }

  @Get('vnpay/callback')
  @ApiOperation({
    summary: 'Xử lý callback từ VNPay',
    description:
      'Xử lý kết quả thanh toán từ VNPay sau khi người dùng hoàn tất thanh toán. ' +
      'URL này được VNPay gọi để redirect user về website sau khi thanh toán.',
  })
  @ApiResponse({
    status: 200,
    description: 'Xử lý callback thành công - Payment được cập nhật',
    type: Payment,
  })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu callback không hợp lệ hoặc thanh toán thất bại',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Thanh toán thất bại' },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy thanh toán tương ứng',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Không tìm thấy thanh toán' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  handleVnpayCallback(@Query() query: any, @Req() req: Request) {
    // Log raw callback data for debugging
    console.log('=== VNPay Callback Raw Data ===');
    console.log('Query params:', JSON.stringify(query, null, 2));
    console.log('Full URL:', req.url);
    console.log('Response Code:', query.vnp_ResponseCode);
    console.log('Transaction Status:', query.vnp_TransactionStatus);
    console.log('Bank Code:', query.vnp_BankCode);
    console.log(
      'Payment Method:',
      query.vnp_PayDate ? 'Card Payment' : 'Unknown',
    );
    console.log('================================');

    return this.paymentsService.handleVnpayCallback(query);
  }

  @Get('vnpay/ipn')
  @ApiOperation({
    summary: 'Xử lý IPN từ VNPay',
    description:
      'Xử lý thông báo thanh toán tự động từ VNPay (Server-to-Server). ' +
      'VNPay gọi endpoint này để thông báo kết quả thanh toán cho hệ thống.',
  })
  @ApiResponse({
    status: 200,
    description: 'Xử lý IPN thành công',
    schema: {
      type: 'object',
      properties: {
        RspCode: {
          type: 'string',
          enum: ['00', '01', '02', '04', '99'],
          example: '00',
          description:
            'Mã phản hồi: 00=thành công, 01=giao dịch không tồn tại, 02=giao dịch đã xử lý, 04=số tiền không hợp lệ, 99=lỗi khác',
        },
        Message: {
          type: 'string',
          example: 'Xác nhận thanh toán thành công',
          description: 'Thông báo kết quả xử lý',
        },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  handleVnpayIpn(
    @Query() query: any,
    @Req() req: Request,
  ): Promise<VNPayIpnResponse> {
    // Log raw IPN data for debugging
    console.log('=== VNPay IPN Raw Data ===');
    console.log('Query params:', JSON.stringify(query, null, 2));
    console.log('Full URL:', req.url);
    console.log('==========================');

    return this.paymentsService.handleVnpayIpn(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin thanh toán theo ID' })
  @ApiParam({ name: 'id', description: 'ID của payment' })
  @ApiResponse({
    status: 200,
    description: 'Thông tin thanh toán',
    type: Payment,
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy thanh toán',
  })
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }

  @Post(':id/process')
  @ApiOperation({
    summary: 'Xử lý thanh toán',
    description:
      'Khởi tạo quá trình thanh toán cho payment đã tạo. ' +
      'Với VNPay sẽ tạo URL redirect, với COD sẽ đánh dấu là đang chờ xử lý.',
  })
  @ApiParam({ name: 'id', description: 'ID của payment cần xử lý' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Thanh toán đã được xử lý thành công',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        redirectUrl: {
          type: 'string',
          description: 'URL redirect (chỉ có với VNPay)',
          example: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Payment không ở trạng thái PENDING hoặc có lỗi khác',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy payment',
  })
  async processPayment(
    @Param('id') id: string,
  ): Promise<{ redirectUrl?: string; success: boolean }> {
    return this.paymentsService.processPayment(id);
  }

  @Post(':id/refund')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Yêu cầu hoàn tiền',
    description:
      'Tạo yêu cầu hoàn tiền cho một thanh toán đã hoàn thành. ' +
      'Với VNPay sẽ gọi API hoàn tiền, với COD chỉ đánh dấu là đã hoàn tiền.',
  })
  @ApiParam({ name: 'id', description: 'ID của payment cần hoàn tiền' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Yêu cầu hoàn tiền đã được xử lý thành công',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: true,
          description: 'Trạng thái xử lý hoàn tiền',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Không thể hoàn tiền cho thanh toán này (chưa completed hoặc đã refunded)',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy payment',
  })
  async refundPayment(@Param('id') id: string): Promise<{ success: boolean }> {
    const payment = await this.paymentsService.findOne(id);
    return this.paymentsService.refundPayment(payment);
  }

  @Get(':id/transactions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Lấy danh sách giao dịch của một thanh toán',
    description:
      'Lấy tất cả các transaction liên quan đến payment (bao gồm payment, refund, etc.)',
  })
  @ApiParam({ name: 'id', description: 'ID của payment' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Danh sách giao dịch',
    type: [Transaction],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy payment',
  })
  async getTransactions(@Param('id') id: string): Promise<Transaction[]> {
    return this.paymentsService.getTransactions(id);
  }

  @Get(':id/logs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Lấy logs của một thanh toán',
    description:
      'Lấy tất cả các log entries liên quan đến payment để debug và audit.',
  })
  @ApiParam({ name: 'id', description: 'ID của payment' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng logs tối đa (default: 50)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Danh sách logs',
    type: [PaymentLog],
  })
  async getPaymentLogs(
    @Param('id') id: string,
    @Query('limit') limit?: number,
  ): Promise<PaymentLog[]> {
    return this.paymentLoggingService.getPaymentLogs(id, limit || 50);
  }

  @Get('order/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Lấy thanh toán theo Order ID',
    description: 'Tìm payment bằng mã đơn hàng',
  })
  @ApiParam({ name: 'orderId', description: 'Mã đơn hàng' })
  @ApiResponse({
    status: 200,
    description: 'Thông tin thanh toán',
    type: Payment,
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy thanh toán với mã đơn hàng này',
  })
  findByOrderId(@Param('orderId') orderId: string) {
    return this.paymentsService.findByOrderId(orderId);
  }

  @Get('order/:orderId/logs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Lấy logs theo Order ID',
    description: 'Lấy tất cả logs liên quan đến một đơn hàng',
  })
  @ApiParam({ name: 'orderId', description: 'Mã đơn hàng' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng logs tối đa (default: 50)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Danh sách logs',
    type: [PaymentLog],
  })
  async getLogsByOrderId(
    @Param('orderId') orderId: string,
    @Query('limit') limit?: number,
  ): Promise<PaymentLog[]> {
    return this.paymentLoggingService.getLogsByOrderId(orderId, limit || 50);
  }
}
