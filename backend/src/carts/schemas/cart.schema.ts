import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type CartDocument = Cart & Document;

// Cart item schema
export class CartItem {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Book', required: true })
  book: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, min: 1, default: 1 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  priceAtAdd: number; // Giá tại thời điểm thêm vào giỏ

  @Prop({ type: Boolean, default: true })
  isTicked: boolean;
}

@Schema({ timestamps: true })
export class Cart {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  })
  user: MongooseSchema.Types.ObjectId;

  @Prop({ type: [CartItem], default: [] })
  items: CartItem[];

  @Prop({ type: String, default: null })
  appliedCouponCode: string;

  @Prop({ type: String, default: null })
  appliedGiftCardCode: string;

  @Prop({ type: Number, min: 0, default: 0 })
  loyaltyPointsToUse: number;

  @Prop({ type: Number, default: 0 })
  subtotal: number; // Tổng giá trước khuyến mãi

  @Prop({ type: Number, default: 0 })
  discount: number; // Tổng giảm giá
}

export const CartSchema = SchemaFactory.createForClass(Cart);

// Cart expiration - remove carts that haven't been updated in 30 days
CartSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });
