import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { 
  ProductActivityLog, 
  ProductActivityLogDocument,
  ProductActivityType
} from './schemas/product-activity-log.schema';

@Injectable()
export class ProductActivityLogService {
  constructor(
    @InjectModel(ProductActivityLog.name)
    private productActivityLogModel: Model<ProductActivityLogDocument>
  ) {}

  async logActivity(
    userId: string,
    productId: string,
    action: ProductActivityType,
    timestamp: Date
  ): Promise<ProductActivityLog> {
    const activityLog = new this.productActivityLogModel({
      userId,
      productId,
      action,
      timestamp
    });
    return activityLog.save();
  }

  async findActivityByProductId(productId: string): Promise<ProductActivityLog[]> {
    return this.productActivityLogModel
      .find({ productId })
      .populate('userId', 'email name role')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findActivityByUserId(userId: string): Promise<ProductActivityLog[]> {
    return this.productActivityLogModel
      .find({ userId })
      .populate('productId', 'title productType')
      .sort({ createdAt: -1 })
      .exec();
  }
}