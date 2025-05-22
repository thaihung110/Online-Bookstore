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
import { Payment } from './schemas/payment.schema';
import { Transaction } from './schemas/transaction.schema';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Tạo thanh toán mới' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Thanh toán đã được tạo thành công',
    type: Payment,
  })
  async createPayment(
    @Body() createPaymentDto: CreatePaymentDto,
  ): Promise<Payment> {
    return this.paymentsService.createPayment(createPaymentDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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

  @Post('callback/vnpay')
  @ApiOperation({ summary: 'Xử lý callback từ VNPay' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Callback đã được xử lý thành công',
  })
  @HttpCode(HttpStatus.OK)
  async vnpayCallback(@Req() request: Request): Promise<Payment> {
    return this.paymentsService.handleCallback('VNPAY', request.query);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin thanh toán theo ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Thông tin thanh toán',
    type: Payment,
  })
  async getPayment(@Param('id') id: string): Promise<Payment> {
    return this.paymentsService.findOne(id);
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
