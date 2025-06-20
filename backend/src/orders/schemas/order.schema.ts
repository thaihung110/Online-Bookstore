import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type OrderDocument = Order & Document;

// Order item schema
export class OrderItem {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Book', required: true })
  book: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ type: Number, min: 0, max: 100, default: 0 })
  discount: number;

  @Prop()
  title: string; // Store the book title at the time of purchase

  @Prop()
  author: string; // Store the book author at the time of purchase
}

// Shipping address schema
export class ShippingAddress {
  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  addressLine1: string;

  @Prop()
  addressLine2: string;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  state: string;

  @Prop({ required: true })
  postalCode: string;

  @Prop({ required: true })
  country: string;

  @Prop()
  phoneNumber: string;
}

// Payment information schema
export class PaymentInfo {
  @Prop({
    required: true,
    enum: ['cod', 'vnpay', 'paypal', 'gift_card', 'loyalty_points'],
  })
  method: string;

  @Prop()
  transactionId: string;

  @Prop({ default: false })
  isPaid: boolean;

  @Prop()
  paidAt: Date;

  @Prop()
  giftCardCode: string;

  @Prop({ min: 0, default: 0 })
  loyaltyPointsUsed: number;
}

@Schema({ timestamps: true })
export class Order {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  user: MongooseSchema.Types.ObjectId;

  @Prop({ type: [OrderItem], required: true })
  items: OrderItem[];

  @Prop({ type: ShippingAddress, required: true })
  shippingAddress: ShippingAddress;

  @Prop({ type: PaymentInfo, required: true })
  paymentInfo: PaymentInfo;

  @Prop({ required: true, min: 0, default: 0 })
  subtotal: number;

  @Prop({ required: true, min: 0, default: 0 })
  tax: number;

  @Prop({ required: true, min: 0, default: 0 })
  shippingCost: number;

  @Prop({ required: true, min: 0, default: 0 })
  discount: number;

  @Prop({ required: true, min: 0, default: 0 })
  total: number;

  @Prop({
    required: true,
    enum: [
      'pending',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
      'refunded',
    ],
    default: 'pending',
    index: true,
  })
  status: string;

  @Prop()
  trackingNumber: string;

  @Prop()
  deliveredAt: Date;

  @Prop()
  cancelledAt: Date;

  @Prop()
  refundedAt: Date;

  @Prop({ default: false })
  isGift: boolean;

  @Prop()
  giftMessage: string;

  @Prop({ min: 0, default: 0 })
  loyaltyPointsEarned: number;

  @Prop({ type: [String], default: [] })
  notes: string[];
}

export const OrderSchema = SchemaFactory.createForClass(Order);
