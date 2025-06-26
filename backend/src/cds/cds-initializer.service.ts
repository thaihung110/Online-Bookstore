import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CD, CDDocument } from './schemas/cd.schema';

@Injectable()
export class CDsInitializerService implements OnModuleInit {
  private readonly logger = new Logger(CDsInitializerService.name);

  constructor(@InjectModel(CD.name) private cdModel: Model<CDDocument>) {}

  async onModuleInit() {
    // Lấy thông tin về collection
    const collectionName = this.cdModel.collection.collectionName;
    
    // Log thông tin collection để kiểm tra
    this.logger.log(`CD model được map tới collection: ${collectionName}`);
    
    // Kiểm tra số lượng records trong collection
    const count = await this.cdModel.countDocuments().exec();
    this.logger.log(`Có ${count} CD trong collection`);
  }
}
