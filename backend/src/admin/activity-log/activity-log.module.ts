import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { 
  ProductActivityLog, 
  ProductActivityLogSchema 
} from './schemas/product-activity-log.schema';
import { ProductActivityLogService } from './activity-log.service';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProductActivityLog.name, schema: ProductActivityLogSchema }
    ])
  ],
  providers: [ProductActivityLogService],
  exports: [ProductActivityLogService]
})
export class ActivityLogsModule {}