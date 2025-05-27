import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VNPayCallbackDTO {
  @ApiProperty({ description: 'Mã đơn hàng' })
  @IsNotEmpty()
  @IsString()
  vnp_TxnRef: string;

  @ApiProperty({ description: 'Số tiền thanh toán' })
  @IsNotEmpty()
  @IsString()
  vnp_Amount: string;

  @ApiProperty({ description: 'Mã ngân hàng' })
  @IsString()
  vnp_BankCode: string;

  @ApiProperty({ description: 'Mã giao dịch tại VNPay' })
  @IsString()
  vnp_TransactionNo: string;

  @ApiProperty({ description: 'Mã phản hồi từ VNPay' })
  @IsNotEmpty()
  @IsString()
  vnp_ResponseCode: string;

  @ApiProperty({ description: 'Chữ ký điện tử' })
  @IsNotEmpty()
  @IsString()
  vnp_SecureHash: string;

  @ApiProperty({ description: 'Thời gian thanh toán' })
  @IsString()
  vnp_PayDate: string;

  @ApiProperty({ description: 'Nội dung thanh toán' })
  @IsString()
  vnp_OrderInfo: string;

  @IsString()
  vnp_CardType?: string;

  @IsString()
  vnp_BankTranNo?: string;
}
