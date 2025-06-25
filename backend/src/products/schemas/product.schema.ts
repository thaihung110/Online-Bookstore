import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ 
  timestamps: true, 
  discriminatorKey: 'productType',
  collection: 'AN_test'
})
export class Product {
  // @Prop({ required: true, enum: ['product', 'book', 'cd', 'dvd'], default: 'product' })
  // productType: string;
  
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

    // createAt
    @Prop({ type: Date, default: Date.now, required: true })
    createdAt: Date;

    // updateAt
    @Prop({ type: Date, default: Date.now, required: true })
    updatedAt: Date;

    // isAvailable
  @Prop({ type: Boolean, default: true })
  isAvailable: boolean;
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
