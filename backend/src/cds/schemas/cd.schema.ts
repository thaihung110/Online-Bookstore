import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Product, ProductDocument } from '../../products/schemas/product.schema';

export type CDDocument = CD & ProductDocument;

@Schema()  // No need to specify collection - it will use the parent schema's collection
export class CD extends Product {
  @Prop({ required: true, trim: true, index: true })
  artist: string;

  // albumtitle
  @Prop({ required: true, trim: true, index: true })
  albumTitle: string; // Tên album

  // tracklist
  @Prop({ required: true, type: String })
  trackList: string;

  // category 
  @Prop({ required: true, type: String })
  category: string; // Thể loại: Pop, Rock, Jazz, Classical, etc.

  // releaseddate 1992-09-21T00:00:00.000+00:00
  @Prop({ required: true, type: Date })
  releaseddate: Date; // Ngày phát hành
}

export const CDSchema = SchemaFactory.createForClass(CD);

// Use post hook to ensure the productType is set correctly
// CDSchema.pre('save', function(next) {
//   if (this.isNew) {
//     this.productType = 'cd';
//   }
//   next();
// });
