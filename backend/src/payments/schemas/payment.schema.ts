import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type PaymentDocument = Payment & Document;

export enum PaymentMethod {
  COD = 'COD',
  VNPAY = 'VNPAY',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Payment {
  @ApiProperty({ example: '123', description: 'ID của đơn hàng' })
  @Prop({ required: true })
  orderId: string;

  @ApiProperty({ enum: PaymentMethod, description: 'Phương thức thanh toán' })
  @Prop({ required: true, enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @ApiProperty({ example: 100000, description: 'Số tiền thanh toán' })
  @Prop({ required: true })
  amount: number;

  @ApiProperty({ enum: PaymentStatus, description: 'Trạng thái thanh toán' })
  @Prop({ required: true, enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @ApiProperty({ description: 'Họ và tên người nhận' })
  @Prop({ required: true })
  fullName: string;

  @ApiProperty({ description: 'Thành phố/Tỉnh' })
  @Prop({ required: true })
  city: string;

  @ApiProperty({ description: 'Địa chỉ cụ thể' })
  @Prop({ required: true })
  address: string;

  @ApiProperty({ description: 'Số điện thoại' })
  @Prop({ required: true })
  phone: string;

  @ApiProperty({ description: 'Mã giao dịch từ cổng thanh toán' })
  @Prop()
  transactionId?: string;

  @ApiProperty({ description: 'Mã ngân hàng' })
  @Prop()
  bankCode?: string;

  @ApiProperty({ description: 'Số giao dịch ngân hàng' })
  @Prop()
  bankTransactionNo?: string;

  @ApiProperty({ description: 'Loại thẻ' })
  @Prop()
  cardType?: string;

  @ApiProperty({ description: 'Thời gian thanh toán' })
  @Prop()
  paymentDate?: Date;

  @ApiProperty({ description: 'Mã phản hồi' })
  @Prop()
  responseCode?: string;

  @ApiProperty({ description: 'Thông tin phụ' })
  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Thời gian hoàn thành thanh toán' })
  @Prop()
  completedAt?: Date;

  @ApiProperty({ description: 'Thời gian hoàn tiền' })
  @Prop()
  refundedAt?: Date;

  id: string; // Virtual field
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

PaymentSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Ensure virtual id field is included in JSON
PaymentSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});
