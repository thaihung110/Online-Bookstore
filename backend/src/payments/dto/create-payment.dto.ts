import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsEnum,
  IsObject,
  ValidateNested,
  IsOptional,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '../schemas/payment.schema';

// DTO cho thông tin VNPay
export class VNPayDetailsDto {
  @ApiProperty({ description: 'URL callback sau khi thanh toán' })
  @IsString()
  @IsOptional()
  returnUrl?: string;
}

// DTO chung cho việc tạo thanh toán
export class CreatePaymentDto {
  @ApiProperty({
    example: 'ORD001',
    description: 'Mã đơn hàng duy nhất',
  })
  @IsNotEmpty()
  @IsString()
  orderId: string;

  @ApiProperty({
    example: 100000,
    description: 'Số tiền thanh toán (VND)',
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1000) // Minimum 1,000 VND
  amount: number;

  @ApiProperty({
    enum: PaymentMethod,
    description: 'Phương thức thanh toán',
    example: PaymentMethod.VNPAY,
  })
  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({
    description: 'Mô tả thanh toán',
    required: false,
    example: 'Thanh toán đơn hàng #ORD001',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Dữ liệu bổ sung (thông tin khách hàng, shipping, etc.)',
    required: false,
    example: {
      customerInfo: {
        fullName: 'Nguyen Van A',
        phone: '0901234567',
        email: 'test@example.com',
      },
      shippingInfo: {
        address: '123 ABC Street',
        city: 'Ho Chi Minh',
        district: 'District 1',
      },
      vnpayInfo: {
        bankCode: 'NCB',
        orderType: 'billpayment',
      },
    },
  })
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Chi tiết thanh toán cho VNPAY',
    required: false,
  })
  @ValidateIf((o) => o.paymentMethod === 'VNPAY')
  @ValidateNested()
  @Type(() => VNPayDetailsDto)
  @IsObject()
  @IsOptional()
  vnpayDetails?: VNPayDetailsDto;
}
