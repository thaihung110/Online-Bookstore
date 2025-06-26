import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ 
  timestamps: true, 
  collection: 'products'
})
export class Product {
  @Prop({ required: true, enum: ['product', 'BOOK', 'CD', 'DVD'], default: 'product' })
  productType: string;
  
  @Prop({ required: true, trim: true, index: true })
  title: string;

  @Prop({ required: true, type: Number })
  originalPrice: number;

  @Prop({ type: Number })
  price: number;

  @Prop({ required: true, type: Number, default: 0 })
  stock: number;

  @Prop()
  coverImage: string;

  @Prop({ type: Date, default: Date.now, required: true })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now, required: true })
  updatedAt: Date;

  @Prop({ type: Boolean, default: true })
  isAvailable: boolean;

  @Prop({ type: Boolean, default: true })
  isAvailableRush: boolean
}

export const ProductSchema = SchemaFactory.createForClass(Product);



// // Calculate price from originalPrice and discountRate
// BookSchema.pre('save', function (next) {
//   if (this.originalPrice !== undefined) {
//     const discountRate = this.discountRate || 0;
//     this.price = this.originalPrice * (1 - discountRate / 100);
//   }
//   next();
// });

// // Add virtual for average rating
// BookSchema.virtual('averageRating').get(function () {
//   if (this.totalRatings === 0) return 0;
//   return this.ratings / this.totalRatings;
// });

// // Add virtual for availability
// BookSchema.virtual('isInStock').get(function () {
//   return this.stock > 0;
// });
