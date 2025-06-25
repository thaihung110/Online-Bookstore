import { Module } from '@nestjs/common';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CdsController } from './cds.controller';
import { AdminCDsService } from './cds.service';
import { CD, CDSchema } from '../../cds/schemas/cd.schema';
import { Product, ProductSchema } from '../../products/schemas/product.schema';
import { UploadModule } from '../../upload/upload.module';
import { UploadService } from '../../upload/upload.service';
import { ActivityLogsModule } from '../activity-log/activity-log.module';;
import { ProductActivityLogService } from '../activity-log/activity-log.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { 
        name: Product.name, 
        schema: ProductSchema
      },
      {
        name: CD.name, 
        schema: CDSchema,
        collection: 'AN_test' // Specify the collection name if needed
      }
    ]),
    UploadModule,
    ConfigModule,
    ActivityLogsModule
  ],
  controllers: [CdsController],
  providers: [
    {
      provide: AdminCDsService,
      useFactory: (cdModel, configService, uploadService,productActivityLogService) => {
        return new AdminCDsService(cdModel, configService, uploadService,productActivityLogService);
      },
      inject: [
        getModelToken(CD.name),
        ConfigService,
        UploadService,
        ProductActivityLogService
      ]
    }
  ]
})
export class CdsModule {}
