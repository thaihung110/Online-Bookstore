import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { DVD, DVDDocument } from '../../dvds/schemas/dvd.schema';
import { UploadService } from '../../upload/upload.service';
import { 
  AdminProductsService,
  ProductFilters,
  ProductListResponse
} from '../products/products.service';
import { CreateDVDDto } from './dto/create-dvd.dto';
// import { UpdateDVDDto } from './dto/update-dvd.dto';

// DVD-specific filters
export interface DVDFilters extends ProductFilters {
    director?: string;
    title?: string;
    releaseDateStart?: Date;
    releaseDateEnd?: Date;

}

export interface DVDListResponse {
    dvds: DVD[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

@Injectable()
export class AdminDVDsService extends AdminProductsService<DVD, DVDDocument> {
  protected readonly logger = new Logger(AdminDVDsService.name);

  constructor(
    @InjectModel(DVD.name) protected dvdModel: Model<DVDDocument>,
    protected readonly configService: ConfigService,
    protected readonly uploadService: UploadService,
  ) {
    super(dvdModel, configService, uploadService);
  }
}
