import { Module } from '@nestjs/common';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DvdsController } from './dvds.controller';
import { AdminDVDsService } from './dvds.service';
import { DVD, DVDSchema } from '../../dvds/schemas/dvd.schema';
import { Product, ProductSchema } from '../../products/schemas/product.schema';
import { UploadModule } from '../../upload/upload.module';
import { UploadService } from '../../upload/upload.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { 
        name: Product.name, 
        schema: ProductSchema,
        discriminators: [
          { name: DVD.name, schema: DVDSchema }
        ]
      }
    ]),
    UploadModule,
    ConfigModule
  ],
  controllers: [DvdsController],
  providers: [
    {
      provide: AdminDVDsService,
      useFactory: (dvdModel, configService, uploadService) => {
        return new AdminDVDsService(dvdModel, configService, uploadService);
      },
      inject: [
        getModelToken(DVD.name),
        ConfigService,
        UploadService
      ]
    }
  ]
})
export class DvdsModule {}
