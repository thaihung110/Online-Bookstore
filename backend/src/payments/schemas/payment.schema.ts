import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type PaymentDocument = Payment & Document;

export enum PaymentMethod {
  CASH = 'COD', // Changed to match MongoDB validation
  VNPAY = 'VNPAY',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Payment {
  @ApiProperty({ example: 'ORD001', description: 'Mã đơn hàng' })
  @Prop({ required: true, unique: true })
  orderId: string;

  @ApiProperty({ example: 100000, description: 'Số tiền thanh toán (VND)' })
  @Prop({ required: true, min: 0 })
  amount: number;

  @ApiProperty({ enum: PaymentMethod, description: 'Phương thức thanh toán' })
  @Prop({ required: true, enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @ApiProperty({ enum: PaymentStatus, description: 'Trạng thái thanh toán' })
  @Prop({ required: true, enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @ApiProperty({ description: 'Mô tả thanh toán', required: false })
  @Prop()
  description?: string;

  // VNPay specific fields
  @ApiProperty({ description: 'Mã giao dịch từ VNPay', required: false })
  @Prop()
  transactionId?: string;

  @ApiProperty({ description: 'Mã phản hồi từ VNPay', required: false })
  @Prop()
  responseCode?: string;

  @ApiProperty({ description: 'Mã ngân hàng thanh toán', required: false })
  @Prop()
  bankCode?: string;

  @ApiProperty({ description: 'Số giao dịch ngân hàng', required: false })
  @Prop()
  bankTransactionNo?: string;

  @ApiProperty({ description: 'Loại thẻ/tài khoản', required: false })
  @Prop()
  cardType?: string;

  @ApiProperty({
    description: 'Thời gian thanh toán từ VNPay',
    required: false,
  })
  @Prop()
  paymentDate?: Date;

  // Timestamps
  @ApiProperty({
    description: 'Thời gian hoàn thành thanh toán',
    required: false,
  })
  @Prop()
  completedAt?: Date;

  @ApiProperty({ description: 'Thời gian hoàn tiền', required: false })
  @Prop()
  refundedAt?: Date;

  // Metadata for storing additional information
  @ApiProperty({
    description: 'Dữ liệu bổ sung (VNPay response, customer info, etc.)',
    required: false,
  })
  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  metadata?: Record<string, any>;

  // Virtual fields
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

// Virtual field for ID
PaymentSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Ensure virtual fields are included in JSON
PaymentSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

// Add compound indexes for performance
PaymentSchema.index({ orderId: 1 }, { unique: true });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ paymentMethod: 1 });
PaymentSchema.index({ transactionId: 1 });
PaymentSchema.index({ createdAt: -1 });
PaymentSchema.index({ completedAt: -1 });
PaymentSchema.index({ status: 1, paymentMethod: 1, createdAt: -1 });
PaymentSchema.index({ paymentMethod: 1, transactionId: 1 });
