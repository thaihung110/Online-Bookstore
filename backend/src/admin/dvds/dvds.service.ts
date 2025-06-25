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
import { ProductActivityLogService } from '../activity-log/activity-log.service';
import { ProductActivityLog,ProductActivityLogDocument } from '../activity-log/schemas/product-activity-log.schema';

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
    protected readonly productActivityLogService: ProductActivityLogService,
  ) {
    super(dvdModel, configService, uploadService,productActivityLogService);
  }


  async findAllCD(filters: DVDFilters): Promise<DVDListResponse> {
      const {
        page = 1,
        limit = 10,
        search,
        minPrice,
        maxPrice,
        inStock,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        director,
        title,
        releaseDateStart,
        releaseDateEnd,
      } = filters;
  
      const query: any = {};

      // choose only available product
      query.available = true; // Ensure we only fetch available products
  
      // Apply filters
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
        ];
      }
  
      query.productType = 'CD'; // Ensure we only fetch CDs
  
      if (minPrice !== undefined || maxPrice !== undefined) {
        query.price = {};
        if (minPrice !== undefined) {
          query.price.$gte = minPrice;
        }
        if (maxPrice !== undefined) {
          query.price.$lte = maxPrice;
        }
      }
  
      if (inStock !== undefined) {
        query.stock = inStock ? { $gt: 0 } : { $lte: 0 };
      }
  
      // DVD-specific filters
      if (director) {
        query.director = { $regex: director, $options: 'i' };
      }
      if (title) {
        query.title = { $regex: title, $options: 'i' };
      }
      if (releaseDateStart) {
        query.releaseDate = { $gte: new Date(releaseDateStart) };
      }
      if (releaseDateEnd) {
        query.releaseDate = { ...query.releaseDate, $lte: new Date(releaseDateEnd) };
      }
      // Ensure we only fetch DVDs
      query.productType = 'DVD'; // Ensure we only fetch DVDs

      // Count total documents
      const total = await this.productModel.countDocuments(query);
  
      // Build sort object
      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
  
      // Fetch paginated products
      const products = await this.productModel
        .find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();
  
      // Process products with async image URL processing
      const processedProducts = await Promise.all(
        products.map(product => this.processProductData(product))
      );
  
      return {
        dvds: processedProducts,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };

    }
}
