import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type BookDocument = Book & Document;

@Schema({ timestamps: true })
export class Book {
  @Prop({ required: true, trim: true, index: true })
  title: string;

  @Prop({ required: true, trim: true, index: true })
  author: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ required: true, type: Number })
  originalPrice: number;

  @Prop({ type: Number, default: 0, min: 0, max: 100 })
  discountRate: number;

  @Prop({ type: Number })
  price: number;

  @Prop({ required: true, type: Number, default: 0 })
  stock: number;

  @Prop({ required: true })
  isbn: string;

  @Prop({ required: true })
  publisher: string;

  @Prop({ required: true, type: Number })
  publicationYear: number;

  @Prop({ type: Number, min: 1 })
  pageCount: number;

  @Prop({ type: [String], index: true })
  genres: string[];

  @Prop({ default: 'English' })
  language: string;

  @Prop()
  coverImage: string;

  @Prop({ type: [Number], default: [] })
  embedding: number[];

  @Prop({ default: false })
  isAvailableForPreOrder: boolean;

  @Prop({ type: Date, default: null })
  preOrderReleaseDate: Date;

  @Prop({ default: false })
  isFeatured: boolean;

  @Prop({ default: 0 })
  ratings: number;

  @Prop({ default: 0 })
  totalRatings: number;
}

export const BookSchema = SchemaFactory.createForClass(Book);



// Calculate price from originalPrice and discountRate
BookSchema.pre('save', function (next) {
  if (this.originalPrice !== undefined) {
    const discountRate = this.discountRate || 0;
    this.price = this.originalPrice * (1 - discountRate / 100);
  }
  next();
});

// Add virtual for average rating
BookSchema.virtual('averageRating').get(function () {
  if (this.totalRatings === 0) return 0;
  return this.ratings / this.totalRatings;
});

// Add virtual for availability
BookSchema.virtual('isInStock').get(function () {
  return this.stock > 0;
});
