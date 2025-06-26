import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type TransactionDocument = Transaction & Document;

export enum TransactionType {
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND',
  PARTIAL_REFUND = 'PARTIAL_REFUND',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export enum PaymentGateway {
  VNPAY = 'VNPAY',
  BANK = 'BANK',
}

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Transaction {
  @ApiProperty({ description: 'ID của payment tương ứng' })
  @Prop({ required: true })
  paymentId: string;

  @ApiProperty({ description: 'Mã giao dịch từ payment gateway' })
  @Prop({ required: true })
  transactionId: string;

  @ApiProperty({ description: 'Số tiền giao dịch (VND)' })
  @Prop({ required: true, min: 0 })
  amount: number;

  @ApiProperty({ enum: TransactionType, description: 'Loại giao dịch' })
  @Prop({ required: true, enum: TransactionType })
  type: TransactionType;

  @ApiProperty({ enum: TransactionStatus, description: 'Trạng thái giao dịch' })
  @Prop({
    required: true,
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @ApiProperty({
    enum: PaymentGateway,
    description: 'Cổng thanh toán',
    required: false,
  })
  @Prop({ enum: PaymentGateway })
  gateway?: PaymentGateway;

  @ApiProperty({ description: 'Response từ payment gateway', required: false })
  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  gatewayResponse?: Record<string, any>;

  // Virtual fields
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

// Virtual field for ID
TransactionSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Ensure virtual fields are included in JSON
TransactionSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

// Add indexes for performance
TransactionSchema.index({ paymentId: 1 });
TransactionSchema.index({ transactionId: 1 });
TransactionSchema.index({ type: 1 });
TransactionSchema.index({ status: 1 });
TransactionSchema.index({ createdAt: -1 });
TransactionSchema.index({ paymentId: 1, type: 1 });
TransactionSchema.index({ gateway: 1 });
