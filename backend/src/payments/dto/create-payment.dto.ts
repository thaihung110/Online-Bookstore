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

// DTO cho thông tin thẻ ngân hàng
export class BankCardDetailsDto {
  @ApiProperty({ description: 'Số thẻ ngân hàng' })
  @IsString()
  @IsNotEmpty()
  cardNumber: string;

  @ApiProperty({ description: 'Tên chủ thẻ' })
  @IsString()
  @IsNotEmpty()
  cardholderName: string;

  @ApiProperty({ description: 'Ngày hết hạn (MM/YY)' })
  @IsString()
  @IsNotEmpty()
  expiryDate: string;

  @ApiProperty({ description: 'Mã bảo mật CVV' })
  @IsString()
  @IsNotEmpty()
  cvv: string;
}

// DTO cho thông tin VNPay
export class VNPayDetailsDto {
  @ApiProperty({ description: 'URL callback sau khi thanh toán' })
  @IsString()
  @IsOptional()
  returnUrl?: string;
}

// DTO chung cho việc tạo thanh toán
export class CreatePaymentDto {
  @ApiProperty({ description: 'ID của đơn hàng cần thanh toán' })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({
    description: 'Phương thức thanh toán',
    enum: ['VNPAY', 'BANK_CARD'],
  })
  @IsEnum(['VNPAY', 'BANK_CARD'])
  @IsNotEmpty()
  paymentMethod: string;

  @ApiProperty({ description: 'Số tiền thanh toán' })
  @IsNumber()
  @Min(1000) // Số tiền tối thiểu là 1000 VND
  amount: number;

  @ApiProperty({ description: 'Chi tiết thanh toán cho Bank Card' })
  @ValidateIf((o) => o.paymentMethod === 'BANK_CARD')
  @ValidateNested()
  @Type(() => BankCardDetailsDto)
  @IsObject()
  bankCardDetails?: BankCardDetailsDto;

  @ApiProperty({ description: 'Chi tiết thanh toán cho VNPAY' })
  @ValidateIf((o) => o.paymentMethod === 'VNPAY')
  @ValidateNested()
  @Type(() => VNPayDetailsDto)
  @IsObject()
  vnpayDetails?: VNPayDetailsDto;
}
