import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type OrderDocument = Order & Document;

// Order item schema
export class OrderItem {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    refPath: 'items.productType',
    required: true,
  })
  product: MongooseSchema.Types.ObjectId;

  @Prop({
    type: String,
    enum: ['product', 'BOOK', 'CD', 'DVD'],
    default: 'product',
  })
  productType: string;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ type: Number, min: 0, max: 100, default: 0 })
  discount: number;

  @Prop()
  title: string; // Store the product title at the time of purchase

  @Prop()
  author: string; // Store the product author at the time of purchase (for books)
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

  @Prop({ required: true })
  email: string;
}

// Payment information schema - chỉ vnpay và cash
export class PaymentInfo {
  @Prop({
    required: true,
    enum: ['VNPAY', 'COD'], // Updated to match MongoDB validation
  })
  method: string;

  @Prop()
  paymentId: string; // Reference to payments collection

  @Prop({ default: false })
  isPaid: boolean;

  @Prop()
  paidAt: Date;
}

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Order {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  user: MongooseSchema.Types.ObjectId;

  @Prop({
    unique: true,
    sparse: true,
  })
  orderNumber: string; // Human-readable order number

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
      'RECEIVED', // Đã thanh toán hoặc COD
      'PENDING', // Chưa thanh toán (vnpay/momo/zalopay)
      'CANCELED', // Tự động hủy sau 24h hoặc admin hủy
      'CONFIRMED', // Admin xác nhận
      'PREPARED', // Admin chuẩn bị hàng
      'SHIPPED', // Admin giao hàng
      'DELIVERED', // Đã giao thành công
      'REFUNDED', // Đã hoàn tiền
    ],
    default: 'PENDING',
    index: true,
  })
  status: string;

  @Prop()
  trackingNumber: string;

  @Prop()
  receivedAt: Date;

  @Prop()
  confirmedAt: Date;

  @Prop()
  preparedAt: Date;

  @Prop()
  shippedAt: Date;

  @Prop()
  deliveredAt: Date;

  @Prop()
  cancelledAt: Date;

  @Prop()
  refundedAt: Date;

  @Prop()
  pendingExpiry: Date; // Thời gian hết hạn cho PENDING orders (24h)

  @Prop({ default: false })
  isGift: boolean;

  @Prop()
  giftMessage: string;

  @Prop({ min: 0, default: 0 })
  loyaltyPointsEarned: number;

  @Prop({ type: [String], default: [] })
  notes: string[];

  // Virtual fields
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// Virtual field for ID
OrderSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Ensure virtual fields are included in JSON
OrderSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

// Pre-save middleware to generate order number
OrderSchema.pre('save', async function (next) {
  try {
    if (this.isNew && !this.orderNumber) {
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const count = await (this.constructor as any).countDocuments({
        createdAt: {
          $gte: new Date(year, new Date().getMonth(), 1),
          $lt: new Date(year, new Date().getMonth() + 1, 1),
        },
      });
      this.orderNumber = `ORD-${year}${month}-${String(count + 1).padStart(4, '0')}`;
    }

    // Ensure all required fields are properly set for validation
    if (!this.status) {
      this.status = 'PENDING';
    }

    // Ensure paymentInfo is properly structured
    if (this.paymentInfo) {
      // Only validate method - do NOT touch isPaid or paidAt fields
      if (
        !this.paymentInfo.method ||
        !['VNPAY', 'COD'].includes(this.paymentInfo.method)
      ) {
        throw new Error('Payment method must be either "VNPAY" or "COD"');
      }
    }

    // Ensure numeric fields are properly set
    if (typeof this.subtotal !== 'number' || this.subtotal < 0) {
      this.subtotal = 0;
    }
    if (typeof this.tax !== 'number' || this.tax < 0) {
      this.tax = 0;
    }
    if (typeof this.shippingCost !== 'number' || this.shippingCost < 0) {
      this.shippingCost = 0;
    }
    if (typeof this.discount !== 'number' || this.discount < 0) {
      this.discount = 0;
    }
    if (typeof this.total !== 'number' || this.total < 0) {
      this.total = 0;
    }
    if (
      typeof this.loyaltyPointsEarned !== 'number' ||
      this.loyaltyPointsEarned < 0
    ) {
      this.loyaltyPointsEarned = 0;
    }

    // Ensure boolean fields are proper booleans
    if (typeof this.isGift !== 'boolean') {
      this.isGift = false;
    }

    // Ensure arrays are properly set
    if (!Array.isArray(this.notes)) {
      this.notes = [];
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Indexes for performance
OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ orderNumber: 1 }, { unique: true, sparse: true });
OrderSchema.index({ 'paymentInfo.paymentId': 1 });
OrderSchema.index({ trackingNumber: 1 });
OrderSchema.index({ isGift: 1 });
OrderSchema.index({ 'paymentInfo.method': 1 });
OrderSchema.index({ total: -1 });
