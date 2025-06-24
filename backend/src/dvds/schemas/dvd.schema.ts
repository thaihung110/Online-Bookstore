import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Product, ProductDocument } from '../../products/schemas/product.schema';

export type DVDDocument = DVD & ProductDocument;

@Schema()  // No need to specify collection - it will use the parent schema's collection
export class DVD extends Product {
    @Prop({type: String,  required: true })
    disctype: string;

    // director: string;
    @Prop({ required: true, type: String })
    director: string;

    @Prop({ required: true, type: Number })
    runtime: number; // Thời lượng phim tính theo phút

    // studio: string; // Hãng sản xuất
    @Prop({ required: true, type: String })
    studio: string;

    // subtitle
    @Prop({required: true,  type: String, default: 'Multiple' })
    subtitles: string; // Các ngôn ngữ phụ đề có sẵn

    // releaseddate
    @Prop({ required: true, type: Date })
    releaseddate: Date; // Ngày phát hành

    // filmtype
    @Prop({ required: true, type: String })
    filmtype: string; // Thể loại phim: Action, Comedy, Drama, etc.
}

export const DVDSchema = SchemaFactory.createForClass(DVD);

