import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CD, CDDocument } from './schemas/cd.schema';
import { CreateCDDto } from './dto/create-cd.dto';
import { UpdateCDDto } from './dto/update-cd.dto';
import { QueryCDDto, CDSortField, CDSortOrder } from './dto/query-cd.dto';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class CDsService {
  private readonly logger = new Logger(CDsService.name);

  constructor(
    @InjectModel(CD.name) private cdModel: Model<CDDocument>,
    private readonly uploadService: UploadService,
  ) {}

  // Helper method to process CD data (prices and image URLs)
  private async processCDData(cd: any): Promise<any> {
    if (!cd) return null;
    const cdObj = cd.toObject ? cd.toObject() : { ...cd };

    // Process image URL using UploadService
    const coverImage = await this.uploadService.processImageUrl(
      cdObj.coverImage,
    );

    // Ensure price values are valid numbers
    const originalPrice = cdObj.originalPrice || 0;
    const discountRate = cdObj.discountRate || 0;
    const price = cdObj.price || originalPrice * (1 - discountRate / 100);

    return {
      ...cdObj,
      coverImage,
      originalPrice,
      discountRate,
      price,
    };
  }

  async create(createCDDto: CreateCDDto): Promise<CD> {
    // Handle coverImageUrl field - use it as coverImage if coverImage is not provided
    const cdData = { ...createCDDto };
    if (!cdData.coverImage && cdData.coverImageUrl) {
      cdData.coverImage = cdData.coverImageUrl;
    }

    // Remove coverImageUrl from the data as it's not part of the schema
    delete cdData.coverImageUrl;

    // Set productType explicitly
    const cdWithType = { ...cdData, productType: 'CD' };

    const newCD = new this.cdModel(cdWithType);
    const savedCD = await newCD.save();
    return await this.processCDData(savedCD);
  }

  async findAll(
    queryDto: QueryCDDto,
  ): Promise<{ cds: CD[]; total: number; page: number; limit: number }> {
    this.logger.log(`Finding CDs with filters: ${JSON.stringify(queryDto)}`);

    try {
      const filter: any = { productType: 'CD' };

      // Search term (match title, artist, or album title)
      if (queryDto.search) {
        filter['$or'] = [
          { title: { $regex: queryDto.search, $options: 'i' } },
          { artist: { $regex: queryDto.search, $options: 'i' } },
          { albumTitle: { $regex: queryDto.search, $options: 'i' } },
          { trackList: { $regex: queryDto.search, $options: 'i' } },
        ];
      }

      // Artist filter (case-insensitive)
      if (queryDto.artist) {
        filter.artist = { $regex: queryDto.artist, $options: 'i' };
      }

      // Album title filter (case-insensitive)
      if (queryDto.albumTitle) {
        filter.albumTitle = { $regex: queryDto.albumTitle, $options: 'i' };
      }

      // Categories filter (match any of the provided categories)
      if (queryDto.categories && queryDto.categories.length > 0) {
        this.logger.log(
          `CDsService: Filtering by categories: ${JSON.stringify(queryDto.categories)}`,
        );

        const categoriesArray = Array.isArray(queryDto.categories)
          ? queryDto.categories
          : [queryDto.categories];

        filter.$or = categoriesArray.map((category) => ({
          category: { $regex: new RegExp(`^${category}$`, 'i') },
        }));
      }

      // Price range filter (prices are stored in USD)
      if (queryDto.minPrice !== undefined || queryDto.maxPrice !== undefined) {
        filter.price = {};
        if (queryDto.minPrice !== undefined) {
          filter.price.$gte = queryDto.minPrice;
        }
        if (queryDto.maxPrice !== undefined) {
          filter.price.$lte = queryDto.maxPrice;
        }
      }

      // Release year range filter
      if (queryDto.minYear !== undefined || queryDto.maxYear !== undefined) {
        filter.releaseddate = {};
        if (queryDto.minYear !== undefined) {
          filter.releaseddate.$gte = new Date(`${queryDto.minYear}-01-01`);
        }
        if (queryDto.maxYear !== undefined) {
          filter.releaseddate.$lte = new Date(`${queryDto.maxYear}-12-31`);
        }
      }

      // In stock filter (stock > 0)
      if (queryDto.inStock) {
        filter.stock = { $gt: 0 };
      }

      // On sale filter (discountRate > 0)
      if (queryDto.onSale) {
        filter.discountRate = { $gt: 0 };
      }

      // Minimum discount rate filter
      if (queryDto.minDiscountRate !== undefined) {
        filter.discountRate = filter.discountRate || {};
        filter.discountRate.$gte = queryDto.minDiscountRate;
      }

      // Pagination
      const page = queryDto.page || 1;
      const limit = queryDto.limit || 10;
      const skip = (page - 1) * limit;

      // Handle sorting
      const sortBy = queryDto.sortBy || CDSortField.CREATED_AT;
      const sortOrder = queryDto.sortOrder || CDSortOrder.DESC;
      const sort: any = {};
      sort[sortBy] = sortOrder === CDSortOrder.ASC ? 1 : -1;

      this.logger.log(`Applying filter: ${JSON.stringify(filter)}`);
      this.logger.log(`Sorting by: ${JSON.stringify(sort)}`);

      // Execute the query with filters, pagination, and sorting
      const [cds, total] = await Promise.all([
        this.cdModel.find(filter).sort(sort).skip(skip).limit(limit).exec(),
        this.cdModel.countDocuments(filter).exec(),
      ]);

      this.logger.log(`Found ${cds.length} CDs out of ${total} total matches`);

      // Process image URLs before returning
      const transformedCDs = await Promise.all(
        cds.map((cd) => this.processCDData(cd)),
      );

      return {
        cds: transformedCDs,
        total,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error(`Error finding CDs: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findFeatured(limit: number = 6): Promise<CD[]> {
    this.logger.log(`Finding featured CDs with limit: ${limit}`);
    try {
      // Ensure limit is within valid range
      const safeLimit = Math.min(Math.max(1, limit), 20);
      if (safeLimit !== limit) {
        this.logger.warn(`Adjusted limit from ${limit} to ${safeLimit}`);
      }

      // Get CDs with highest discount rate and in stock
      const cds = await this.cdModel
        .find({
          productType: 'CD', // Only get CDs
          discountRate: { $gt: 0 }, // Only discounted CDs
          stock: { $gt: 0 }, // Only in stock
        })
        .sort({ discountRate: -1 }) // Sort by discount rate descending
        .limit(safeLimit)
        .exec();

      this.logger.log(`Found ${cds.length} featured CDs`);

      // Process image URLs before returning
      return await Promise.all(cds.map((cd) => this.processCDData(cd)));
    } catch (error) {
      this.logger.error(
        `Error finding featured CDs: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async findOne(id: string): Promise<CD> {
    console.log('[CDs Service] findOne called with ID:', id);
    console.log('[CDs Service] ID type:', typeof id);
    console.log('[CDs Service] ID length:', id.length);

    try {
      const cd = await this.cdModel
        .findOne({ _id: id, productType: 'CD' })
        .exec();
      console.log(
        '[CDs Service] MongoDB query result:',
        cd ? 'Found' : 'Not found',
      );

      if (!cd) {
        console.log('[CDs Service] CD not found, throwing NotFoundException');
        throw new NotFoundException(`CD with ID "${id}" not found`);
      }

      console.log('[CDs Service] Found CD:', cd._id, cd.title);
      const processedCD = await this.processCDData(cd);
      console.log('[CDs Service] Processed CD successfully');
      return processedCD;
    } catch (error) {
      console.error('[CDs Service] Error in findOne:', error);
      throw error;
    }
  }

  async update(id: string, updateCDDto: UpdateCDDto): Promise<CD> {
    // Handle coverImageUrl field - use it as coverImage if coverImage is not provided
    const updateData = { ...updateCDDto };
    if (!updateData.coverImage && updateData.coverImageUrl) {
      updateData.coverImage = updateData.coverImageUrl;
    }

    // Remove coverImageUrl from the data as it's not part of the schema
    delete updateData.coverImageUrl;

    // Use findById + save to trigger pre-save hooks
    const cdToUpdate = await this.cdModel
      .findOne({ _id: id, productType: 'CD' })
      .exec();
    if (!cdToUpdate) {
      throw new NotFoundException(`CD with ID "${id}" not found`);
    }

    // Update the CD with new data
    Object.assign(cdToUpdate, updateData);
    const updatedCD = await cdToUpdate.save();
    return await this.processCDData(updatedCD);
  }

  async remove(id: string): Promise<{ deleted: boolean; message?: string }> {
    const result = await this.cdModel
      .deleteOne({ _id: id, productType: 'CD' })
      .exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`CD with ID "${id}" not found`);
    }
    return { deleted: true };
  }

  async getAllCategories(): Promise<string[]> {
    this.logger.log('Getting all unique CD categories');
    try {
      const cdsCount = await this.cdModel.countDocuments({ productType: 'CD' });
      this.logger.log(`Total CDs in collection: ${cdsCount}`);

      const rawCategories = await this.cdModel
        .distinct('category', { productType: 'CD' })
        .exec();
      this.logger.log(
        `Found ${rawCategories.length} raw categories: ${JSON.stringify(rawCategories)}`,
      );

      const categoryMap = new Map<string, string>();
      const validCategories = rawCategories.filter(
        (category) =>
          category &&
          typeof category === 'string' &&
          category.trim().length > 0,
      );

      validCategories.forEach((category) => {
        const normalizedCategory = category.trim();
        const lowerCategory = normalizedCategory.toLowerCase();

        if (
          !categoryMap.has(lowerCategory) ||
          (!isCapitalized(categoryMap.get(lowerCategory)) &&
            isCapitalized(normalizedCategory))
        ) {
          categoryMap.set(lowerCategory, normalizedCategory);
        }
      });

      const categories = Array.from(categoryMap.values()).sort();
      this.logger.log(
        `Normalized ${categories.length} unique categories: ${JSON.stringify(categories)}`,
      );

      return categories;
    } catch (error) {
      this.logger.error(
        `Error getting categories: ${error.message}`,
        error.stack,
      );
      return [
        'Pop',
        'Rock',
        'Jazz',
        'Classical',
        'Hip-Hop',
        'Country',
        'Electronic',
        'Blues',
        'Folk',
      ];
    }
  }
}

// Helper function to check if string is capitalized
function isCapitalized(str: string | undefined): boolean {
  if (!str) return false;
  return /^[A-Z]/.test(str);
}
