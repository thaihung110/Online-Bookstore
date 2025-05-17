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

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ required: true, default: 0, min: 0 })
  stock: number;

  @Prop({ required: true })
  isbn: string;

  @Prop({ required: true })
  publisher: string;

  @Prop({ required: true })
  publicationYear: number;

  @Prop({ type: [String], index: true })
  genres: string[];

  @Prop()
  coverImage: string;

  @Prop({ default: false })
  isAvailableForPreOrder: boolean;

  @Prop({ type: Date, default: null })
  preOrderReleaseDate: Date;

  @Prop({ default: 0 })
  discountPercentage: number;

  @Prop({ default: false })
  isFeatured: boolean;

  @Prop({ default: 0 })
  ratings: number;

  @Prop({ default: 0 })
  totalRatings: number;
}

export const BookSchema = SchemaFactory.createForClass(Book);

// Add virtual for average rating
BookSchema.virtual('averageRating').get(function () {
  if (this.totalRatings === 0) return 0;
  return this.ratings / this.totalRatings;
});

// Add virtual for availability
BookSchema.virtual('isInStock').get(function () {
  return this.stock > 0;
});
