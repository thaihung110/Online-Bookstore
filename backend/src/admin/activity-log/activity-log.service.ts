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


  // dem so luong activity log theo userId trong mo ngay nhat dinh
  async countActivityByUserIdAndDate(userId: string, date: Date): Promise<number> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.productActivityLogModel.countDocuments({
      userId,
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    }).exec();
  }

  // dem so louong san pham da xoa trong ngay cua mot User
  async countDeletedProductsByUserIdAndDate(userId: string, date: Date): Promise<number> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.productActivityLogModel.countDocuments({
      userId,
      action: ProductActivityType.DELETE,
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    }).exec();
  }
}