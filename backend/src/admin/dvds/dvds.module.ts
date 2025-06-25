import { Module } from '@nestjs/common';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DvdsController } from './dvds.controller';
import { AdminDVDsService } from './dvds.service';
import { DVD, DVDSchema } from '../../dvds/schemas/dvd.schema';
import { Product, ProductSchema } from '../../products/schemas/product.schema';
import { UploadModule } from '../../upload/upload.module';
import { UploadService } from '../../upload/upload.service';
import { ActivityLogsModule } from '../activity-log/activity-log.module';
import { ProductActivityLogService } from '../activity-log/activity-log.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { 
        name: Product.name, 
        schema: ProductSchema
      },
      {
        name: DVD.name, 
        schema: DVDSchema,
        collection: 'AN_test',
      }
    ]),
    UploadModule,
    ConfigModule,
    ActivityLogsModule
  ],
  controllers: [DvdsController],
  providers: [
    {
      provide: AdminDVDsService,
      useFactory: (dvdModel, configService, uploadService,productActivityLogService) => {
        return new AdminDVDsService(dvdModel, configService, uploadService,productActivityLogService);
      },
      inject: [
        getModelToken(DVD.name),
        ConfigService,
        UploadService,
        ProductActivityLogService
      ]
    }
  ]
})
export class DvdsModule {}
