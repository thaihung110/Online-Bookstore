import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class VNPayCallbackDTO {
  @ApiProperty({
    description: 'Mã tham chiếu giao dịch (Payment ID)',
    example: '64f8c1234567890abcdef123',
  })
  @IsNotEmpty()
  @IsString()
  vnp_TxnRef: string;

  @ApiProperty({
    description: 'Số tiền thanh toán (đã nhân 100, VND)',
    example: '10000000',
  })
  @IsNotEmpty()
  @IsString()
  vnp_Amount: string;

  @ApiProperty({
    description: 'Mã ngân hàng thực hiện thanh toán',
    example: 'NCB',
    required: false,
  })
  @IsOptional()
  @IsString()
  vnp_BankCode?: string;

  @ApiProperty({
    description: 'Mã giao dịch tại VNPay',
    example: '14308544',
    required: false,
  })
  @IsOptional()
  @IsString()
  vnp_TransactionNo?: string;

  @ApiProperty({
    description: 'Mã phản hồi từ VNPay (00: thành công)',
    example: '00',
  })
  @IsNotEmpty()
  @IsString()
  vnp_ResponseCode: string;

  @ApiProperty({
    description: 'Chữ ký điện tử để xác thực',
    example: 'abcd1234...',
  })
  @IsNotEmpty()
  @IsString()
  vnp_SecureHash: string;

  @ApiProperty({
    description: 'Thời gian thanh toán (YYYYMMDDHHmmss)',
    example: '20231201143045',
    required: false,
  })
  @IsOptional()
  @IsString()
  vnp_PayDate?: string;

  @ApiProperty({
    description: 'Nội dung thanh toán',
    example: 'Thanh toan don hang ORD001',
    required: false,
  })
  @IsOptional()
  @IsString()
  vnp_OrderInfo?: string;

  @ApiProperty({
    description: 'Loại thẻ/tài khoản thanh toán',
    example: 'ATM',
    required: false,
  })
  @IsOptional()
  @IsString()
  vnp_CardType?: string;

  @ApiProperty({
    description: 'Mã giao dịch tại ngân hàng',
    example: 'VNP14308544',
    required: false,
  })
  @IsOptional()
  @IsString()
  vnp_BankTranNo?: string;

  @ApiProperty({
    description: 'Mã Terminal ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  vnp_TmnCode?: string;

  @ApiProperty({
    description: 'Phiên bản API VNPay',
    example: '2.1.0',
    required: false,
  })
  @IsOptional()
  @IsString()
  vnp_Version?: string;

  @ApiProperty({
    description: 'Loại command',
    example: 'pay',
    required: false,
  })
  @IsOptional()
  @IsString()
  vnp_Command?: string;

  @ApiProperty({
    description: 'Mã locale (vn/en)',
    example: 'vn',
    required: false,
  })
  @IsOptional()
  @IsString()
  vnp_Locale?: string;

  @ApiProperty({
    description: 'Ngày tạo giao dịch (YYYYMMDDHHmmss)',
    example: '20231201143000',
    required: false,
  })
  @IsOptional()
  @IsString()
  vnp_CreateDate?: string;

  @ApiProperty({
    description: 'Địa chỉ IP của khách hàng',
    example: '127.0.0.1',
    required: false,
  })
  @IsOptional()
  @IsString()
  vnp_IpAddr?: string;

  @ApiProperty({
    description:
      'Trạng thái giao dịch (00: thành công, 01: chưa hoàn tất, 02: lỗi)',
    example: '00',
    required: false,
  })
  @IsOptional()
  @IsString()
  vnp_TransactionStatus?: string;

  @ApiProperty({
    description: 'Loại tiền tệ',
    example: 'VND',
    required: false,
  })
  @IsOptional()
  @IsString()
  vnp_CurrCode?: string;

  @ApiProperty({
    description: 'Loại đơn hàng',
    example: 'other',
    required: false,
  })
  @IsOptional()
  @IsString()
  vnp_OrderType?: string;

  @ApiProperty({
    description: 'Thời gian hết hạn thanh toán',
    example: '20231202143000',
    required: false,
  })
  @IsOptional()
  @IsString()
  vnp_ExpireDate?: string;
}
