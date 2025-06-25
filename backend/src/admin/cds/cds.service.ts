import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { CD, CDDocument } from '../../cds/schemas/cd.schema';
import { UploadService } from '../../upload/upload.service';
import { 
  AdminProductsService,
  ProductFilters,
  ProductListResponse
} from '../products/products.service';
import { ProductActivityLogService } from '../activity-log/activity-log.service';
import { CreateCDDto } from './dto/create-cd.dto';
import { UpdateCDDto } from './dto/update-cd.dto';

// CD-specific filters
export interface CDFilters extends ProductFilters {
  artist?: string;
  albumTitle?: string;
  releasedDateStart?: Date;
  releasedDateEnd?: Date;
}

export interface CDListResponse {
  cds: CD[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class AdminCDsService extends AdminProductsService<CD, CDDocument> {
  protected readonly logger = new Logger(AdminCDsService.name);

  constructor(
    @InjectModel(CD.name) protected cdModel: Model<CDDocument>,
    protected readonly configService: ConfigService,
    protected readonly uploadService: UploadService,
    protected readonly productActivityLogService: ProductActivityLogService,
  ) {
    super(cdModel, configService, uploadService, productActivityLogService);
  }



  async findAllCD(filters: CDFilters): Promise<CDListResponse> {
    const {
      page = 1,
      limit = 10,
      search,
      minPrice,
      maxPrice,
      inStock,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      artist,
      albumTitle,
      releasedDateStart,
      releasedDateEnd,
    } = filters;

    const query: any = {};

    query.isAvailable = true; // Ensure we only fetch available CDs

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

    // CD-specific filters
    if (artist) {
      query.artist = { $regex: artist, $options: 'i' };
    }
    if (albumTitle) {
      query.albumTitle = { $regex: albumTitle, $options: 'i' };
    }
    if (releasedDateStart || releasedDateEnd) {
      query.releaseddate = {};
      if (releasedDateStart) {
        query.releaseddate.$gte = releasedDateStart;
      }
      if (releasedDateEnd) {
        query.releaseddate.$lte = releasedDateEnd;
      }
    }

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
      cds: processedProducts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }







  // CD-specific create method
//   async create(createCDDto: CreateCDDto): Promise<CD> {    
//     this.logger.log(`Creating new CD: ${createCDDto.title} by ${createCDDto.artist}`);
    
    
//     // Có thể thêm logic xử lý đặc biệt cho CD nếu cần
    
//     // Call the parent class create method
//     return await super.create(createCDDto);
//   }
//   // Method to support CD-specific filters, but maintain base class contract
  // async findAllCDs(filters: CDFilters): Promise<CDListResponse> {
  //   const {
  //     artist,
  //     albumTitle,
  //     releasedDateStart,
  //     releasedDateEnd,
  //     ...baseFilters
  //   } = filters;
    
  //   const query: any = {};

  //   // Apply CD-specific filters
  //   if (artist) {
  //     query.artist = { $regex: artist, $options: 'i' };
  //   }

  //   if (albumTitle) {
  //     query.albumTitle = { $regex: albumTitle, $options: 'i' };
  //   }

  //   if (releasedDateStart || releasedDateEnd) {
  //     query.releaseddate = {};
  //     if (releasedDateStart) {
  //       query.releaseddate.$gte = releasedDateStart;
  //     }
  //     if (releasedDateEnd) {
  //       query.releaseddate.$lte = releasedDateEnd;
  //     }
  //   }

  //   // Get base results using parent class method with combined filters
  //   const baseResult = await super.findAll({
  //     ...baseFilters,
  //     ...query
  //   });

  //   // Return CD-specific response format
  //   return {
  //     cds: baseResult.products as CD[],
  //     total: baseResult.total,
  //     page: baseResult.page,
  //     limit: baseResult.limit,
  //     totalPages: baseResult.totalPages,
  //   };
  // }

//   // CD-specific update method
//   async update(id: string, updateCDDto: UpdateCDDto): Promise<CD> {
//     // Any CD-specific validation logic here

//     // Call the parent class update method
//     return await super.update(id, updateCDDto);
//   }
}
