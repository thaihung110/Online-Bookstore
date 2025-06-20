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
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { VNPayCallbackDTO } from './dto/vnpay-callback.dto';
import { Payment, PaymentDocument } from './schemas/payment.schema';
import { Transaction } from './schemas/transaction.schema';
import { VNPayIpnResponse } from './interfaces/vnpay-response.interface';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo thanh toán mới' })
  @ApiResponse({
    status: 201,
    description: 'Tạo thanh toán thành công',
    type: Payment,
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
  @ApiResponse({ status: 200, description: 'Danh sách thanh toán' })
  async findAll(): Promise<PaymentDocument[]> {
    return this.paymentsService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin thanh toán theo ID' })
  @ApiResponse({ status: 200, description: 'Thông tin thanh toán' })
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }

  @Get('vnpay/callback')
  @ApiOperation({
    summary: 'Xử lý callback từ VNPay',
    description:
      'Xử lý kết quả thanh toán từ VNPay sau khi người dùng hoàn tất thanh toán',
  })
  @ApiResponse({
    status: 200,
    description: 'Xử lý callback thành công',
    type: Payment,
  })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu không hợp lệ hoặc thanh toán thất bại',
  })
  handleVnpayCallback(@Query() query: VNPayCallbackDTO) {
    return this.paymentsService.handleVnpayCallback(query);
  }

  @Get('vnpay/ipn')
  @ApiOperation({
    summary: 'Xử lý IPN từ VNPay',
    description: 'Xử lý thông báo thanh toán tự động từ VNPay',
  })
  @ApiResponse({
    status: 200,
    description: 'Xử lý IPN thành công',
    schema: {
      type: 'object',
      properties: {
        RspCode: {
          type: 'string',
          example: '00',
          description: 'Mã phản hồi (00: thành công)',
        },
        Message: {
          type: 'string',
          example: 'Xác nhận thanh toán thành công',
          description: 'Thông báo kết quả',
        },
      },
    },
  })
  handleVnpayIpn(@Query() query: VNPayCallbackDTO): Promise<VNPayIpnResponse> {
    return this.paymentsService.handleVnpayIpn(query);
  }

  @Post(':id/process')
  @ApiOperation({ summary: 'Xử lý thanh toán' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Thanh toán đã được xử lý thành công',
  })
  async processPayment(
    @Param('id') id: string,
  ): Promise<{ redirectUrl?: string; success: boolean }> {
    return this.paymentsService.processPayment(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(':id/refund')
  @ApiOperation({
    summary: 'Yêu cầu hoàn tiền',
    description: 'Tạo yêu cầu hoàn tiền cho một thanh toán đã hoàn thành',
  })
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
    description: 'Không thể hoàn tiền cho thanh toán này',
  })
  async refundPayment(@Param('id') id: string): Promise<{ success: boolean }> {
    const payment = await this.paymentsService.findOne(id);
    return this.paymentsService.refundPayment(payment);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':id/transactions')
  @ApiOperation({ summary: 'Lấy danh sách giao dịch của một thanh toán' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Danh sách giao dịch',
    type: [Transaction],
  })
  async getTransactions(@Param('id') id: string): Promise<Transaction[]> {
    return this.paymentsService.getTransactions(id);
  }
}
