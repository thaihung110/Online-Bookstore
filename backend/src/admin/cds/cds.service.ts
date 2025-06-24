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
  ) {
    super(cdModel, configService, uploadService);
  }


  // CD-specific create method
//   async create(createCDDto: CreateCDDto): Promise<CD> {    
//     this.logger.log(`Creating new CD: ${createCDDto.title} by ${createCDDto.artist}`);
    
    
//     // Có thể thêm logic xử lý đặc biệt cho CD nếu cần
    
//     // Call the parent class create method
//     return await super.create(createCDDto);
//   }
//   // Method to support CD-specific filters, but maintain base class contract
//   async findAllCDs(filters: CDFilters): Promise<CDListResponse> {
//     const {
//       artist,
//       albumTitle,
//       releasedDateStart,
//       releasedDateEnd,
//       ...baseFilters
//     } = filters;
    
//     const query: any = {};

//     // Apply CD-specific filters
//     if (artist) {
//       query.artist = { $regex: artist, $options: 'i' };
//     }

//     if (albumTitle) {
//       query.albumTitle = { $regex: albumTitle, $options: 'i' };
//     }

//     if (releasedDateStart || releasedDateEnd) {
//       query.releaseddate = {};
//       if (releasedDateStart) {
//         query.releaseddate.$gte = releasedDateStart;
//       }
//       if (releasedDateEnd) {
//         query.releaseddate.$lte = releasedDateEnd;
//       }
//     }

//     // Get base results using parent class method with combined filters
//     const baseResult = await super.findAll({
//       ...baseFilters,
//       ...query
//     });

//     // Return CD-specific response format
//     return {
//       cds: baseResult.products as CD[],
//       total: baseResult.total,
//       page: baseResult.page,
//       limit: baseResult.limit,
//       totalPages: baseResult.totalPages,
//     };
//   }

//   // CD-specific update method
//   async update(id: string, updateCDDto: UpdateCDDto): Promise<CD> {
//     // Any CD-specific validation logic here

//     // Call the parent class update method
//     return await super.update(id, updateCDDto);
//   }
}
