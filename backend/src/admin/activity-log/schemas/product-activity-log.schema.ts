import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../../users/schemas/user.schema';;
import { Product } from '../../../products/schemas/product.schema';;

export type ProductActivityLogDocument = ProductActivityLog & Document;

export enum ProductActivityType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  BULK_DELETE = 'bulk_delete'
}

@Schema({ collection: 'admin_activity_log'})
export class ProductActivityLog {
  @Prop({ 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'Product',
    required: true 
  })
  productId: MongooseSchema.Types.ObjectId;

  @Prop({ 
    type: String, 
    required: true,
    enum: Object.values(ProductActivityType)
  })
  action: ProductActivityType;

  @Prop({ type: Object })
  details: Record<string, any>;

  @Prop({ type: Date, default: Date.now })
  timestamp: Date;
}

export const ProductActivityLogSchema = SchemaFactory.createForClass(ProductActivityLog);