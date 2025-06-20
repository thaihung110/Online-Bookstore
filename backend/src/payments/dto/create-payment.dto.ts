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
  @ApiProperty({ example: '123', description: 'ID của đơn hàng' })
  @IsNotEmpty()
  @IsString()
  orderId: string;

  @ApiProperty({ enum: PaymentMethod, description: 'Phương thức thanh toán' })
  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ example: 100000, description: 'Số tiền thanh toán' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ description: 'Họ và tên người nhận' })
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @ApiProperty({ description: 'Thành phố/Tỉnh' })
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiProperty({ description: 'Địa chỉ cụ thể' })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({ description: 'Số điện thoại' })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({ description: 'Chi tiết thanh toán cho VNPAY' })
  @ValidateIf((o) => o.paymentMethod === 'VNPAY')
  @ValidateNested()
  @Type(() => VNPayDetailsDto)
  @IsObject()
  vnpayDetails?: VNPayDetailsDto;
}
