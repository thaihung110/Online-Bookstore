import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type PaymentLogDocument = PaymentLog & Document;

export enum PaymentLogType {
  PAYMENT_CREATED = 'PAYMENT_CREATED',
  VNPAY_REQUEST = 'VNPAY_REQUEST',
  VNPAY_RESPONSE = 'VNPAY_RESPONSE',
  VNPAY_CALLBACK = 'VNPAY_CALLBACK',
  VNPAY_IPN = 'VNPAY_IPN',
  REFUND_REQUEST = 'REFUND_REQUEST',
  REFUND_RESPONSE = 'REFUND_RESPONSE',
  PAYMENT_ERROR = 'PAYMENT_ERROR',
}

export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
}

@Schema({
  timestamps: false, // We'll use custom timestamp field
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class PaymentLog {
  @ApiProperty({ description: 'ID của payment tương ứng', required: false })
  @Prop()
  paymentId?: string;

  @ApiProperty({ description: 'Mã đơn hàng', required: false })
  @Prop()
  orderId?: string;

  @ApiProperty({ enum: PaymentLogType, description: 'Loại log' })
  @Prop({ required: true, enum: PaymentLogType })
  type: PaymentLogType;

  @ApiProperty({ description: 'Thông điệp log', required: false })
  @Prop()
  message?: string;

  @ApiProperty({ description: 'Dữ liệu chi tiết', required: false })
  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  data?: Record<string, any>;

  @ApiProperty({ enum: LogLevel, description: 'Mức độ log' })
  @Prop({ enum: LogLevel, default: LogLevel.INFO })
  level: LogLevel;

  @ApiProperty({ description: 'Thời gian log' })
  @Prop({ required: true, default: Date.now })
  timestamp: Date;

  @ApiProperty({ description: 'Nguồn tạo log (service name)', required: false })
  @Prop()
  source?: string;

  // Virtual fields
  id: string;
}

export const PaymentLogSchema = SchemaFactory.createForClass(PaymentLog);

// Virtual field for ID
PaymentLogSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Ensure virtual fields are included in JSON
PaymentLogSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

// Add indexes for performance
PaymentLogSchema.index({ paymentId: 1 });
PaymentLogSchema.index({ orderId: 1 });
PaymentLogSchema.index({ type: 1 });
PaymentLogSchema.index({ level: 1 });
PaymentLogSchema.index({ timestamp: -1 });
PaymentLogSchema.index({ paymentId: 1, timestamp: -1 });

// TTL Index - Automatically delete logs after 90 days (7776000 seconds)
PaymentLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });
