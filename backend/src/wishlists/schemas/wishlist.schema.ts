import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Book } from '../../books/schemas/book.schema';

export type WishlistDocument = Wishlist & Document;

@Schema({ timestamps: true })
export class WishlistItem {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Book', required: true })
  bookId: Types.ObjectId | string;

  @Prop({ default: Date.now })
  addedAt: Date;
}

export const WishlistItemSchema = SchemaFactory.createForClass(WishlistItem);

@Schema({ timestamps: true })
export class Wishlist {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  })
  userId: Types.ObjectId | string;

  @Prop({ type: [WishlistItemSchema], default: [] })
  items: WishlistItem[];
}

export const WishlistSchema = SchemaFactory.createForClass(Wishlist);
