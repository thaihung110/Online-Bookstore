import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type TransactionDocument = Transaction & Document;

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ type: MongooseSchema.Types.ObjectId, auto: true })
  id: string; // MongoDB document ID

  @Prop({ required: true })
  paymentId: string;

  @Prop({ required: true })
  transactionId: string;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ required: true, enum: ['PAYMENT', 'REFUND'] })
  type: string;

  @Prop({
    required: true,
    enum: ['PENDING', 'COMPLETED', 'FAILED'],
    default: 'PENDING',
  })
  status: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  gatewayResponse: Record<string, any>;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

// Ensure virtual id field is included in JSON
TransactionSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});
