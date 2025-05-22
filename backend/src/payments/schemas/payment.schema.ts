import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: MongooseSchema.Types.ObjectId, auto: true })
  id: string; // MongoDB document ID

  @Prop({ required: true })
  orderId: string;

  @Prop({ required: true, enum: ['VNPAY', 'BANK_CARD'] })
  paymentMethod: string;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({
    required: true,
    enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'],
    default: 'PENDING',
  })
  status: string;

  @Prop()
  transactionId: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  paymentDetails: Record<string, any>;

  @Prop()
  completedAt: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

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
