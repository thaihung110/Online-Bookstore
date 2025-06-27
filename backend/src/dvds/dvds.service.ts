import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DVD, DVDDocument } from './schemas/dvd.schema';
import { CreateDVDDto } from './dto/create-dvd.dto';
import { UpdateDVDDto } from './dto/update-dvd.dto';
import { QueryDVDDto, DVDSortField, DVDSortOrder } from './dto/query-dvd.dto';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class DVDsService {
  private readonly logger = new Logger(DVDsService.name);

  constructor(
    @InjectModel(DVD.name) private dvdModel: Model<DVDDocument>,
    private readonly uploadService: UploadService,
  ) {}

  // Helper method to process DVD data (prices and image URLs)
  private async processDVDData(dvd: any): Promise<any> {
    if (!dvd) return null;
    const dvdObj = dvd.toObject ? dvd.toObject() : { ...dvd };

    // Process image URL using UploadService
    const coverImage = await this.uploadService.processImageUrl(dvdObj.coverImage);

    // Ensure price values are valid numbers
    const originalPrice = dvdObj.originalPrice || 0;
    const discountRate = dvdObj.discountRate || 0;
    const price = dvdObj.price || (originalPrice * (1 - discountRate / 100));

    return {
      ...dvdObj,
      coverImage,
      originalPrice,
      discountRate,
      price,
    };
  }

  async create(createDVDDto: CreateDVDDto): Promise<DVD> {
    // Handle coverImageUrl field - use it as coverImage if coverImage is not provided
    const dvdData = { ...createDVDDto };
    if (!dvdData.coverImage && dvdData.coverImageUrl) {
      dvdData.coverImage = dvdData.coverImageUrl;
    }

    // Remove coverImageUrl from the data as it's not part of the schema
    delete dvdData.coverImageUrl;

    // Set productType explicitly
    const dvdWithType = { ...dvdData, productType: 'DVD' };

    const newDVD = new this.dvdModel(dvdWithType);
    const savedDVD = await newDVD.save();
    return await this.processDVDData(savedDVD);
  }

  async findAll(
    queryDto: QueryDVDDto,
  ): Promise<{ dvds: DVD[]; total: number; page: number; limit: number }> {
    this.logger.log(`Finding DVDs with filters: ${JSON.stringify(queryDto)}`);

    try {
      const filter: any = { productType: 'DVD' };

      // Search term (match title, director, or studio)
      if (queryDto.search) {
        filter['$or'] = [
          { title: { $regex: queryDto.search, $options: 'i' } },
          { director: { $regex: queryDto.search, $options: 'i' } },
          { studio: { $regex: queryDto.search, $options: 'i' } },
        ];
      }

      // Director filter (case-insensitive)
      if (queryDto.director) {
        filter.director = { $regex: queryDto.director, $options: 'i' };
      }

      // Studio filter (case-insensitive)
      if (queryDto.studio) {
        filter.studio = { $regex: queryDto.studio, $options: 'i' };
      }

      // Disc types filter (match any of the provided types)
      if (queryDto.discTypes && queryDto.discTypes.length > 0) {
        this.logger.log(
          `DVDsService: Filtering by disc types: ${JSON.stringify(queryDto.discTypes)}`,
        );

        const discTypesArray = Array.isArray(queryDto.discTypes)
          ? queryDto.discTypes
          : [queryDto.discTypes];

        filter.$or = discTypesArray.map((discType) => ({
          disctype: { $regex: new RegExp(`^${discType}$`, 'i') },
        }));
      }

      // Film types filter (match any of the provided genres)
      if (queryDto.filmTypes && queryDto.filmTypes.length > 0) {
        this.logger.log(
          `DVDsService: Filtering by film types: ${JSON.stringify(queryDto.filmTypes)}`,
        );

        const filmTypesArray = Array.isArray(queryDto.filmTypes)
          ? queryDto.filmTypes
          : [queryDto.filmTypes];

        // If we already have $or from discTypes, we need to combine them
        if (filter.$or) {
          filter.$and = [
            { $or: filter.$or },
            { $or: filmTypesArray.map((filmType) => ({
              filmtype: { $regex: new RegExp(`^${filmType}$`, 'i') },
            })) }
          ];
          delete filter.$or;
        } else {
          filter.$or = filmTypesArray.map((filmType) => ({
            filmtype: { $regex: new RegExp(`^${filmType}$`, 'i') },
          }));
        }
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

      // Runtime range filter
      if (queryDto.minRuntime !== undefined || queryDto.maxRuntime !== undefined) {
        filter.runtime = {};
        if (queryDto.minRuntime !== undefined) {
          filter.runtime.$gte = queryDto.minRuntime;
        }
        if (queryDto.maxRuntime !== undefined) {
          filter.runtime.$lte = queryDto.maxRuntime;
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
      const sortBy = queryDto.sortBy || DVDSortField.CREATED_AT;
      const sortOrder = queryDto.sortOrder || DVDSortOrder.DESC;
      const sort: any = {};
      sort[sortBy] = sortOrder === DVDSortOrder.ASC ? 1 : -1;

      this.logger.log(`Applying filter: ${JSON.stringify(filter)}`);
      this.logger.log(`Sorting by: ${JSON.stringify(sort)}`);

      // Execute the query with filters, pagination, and sorting
      const [dvds, total] = await Promise.all([
        this.dvdModel.find(filter).sort(sort).skip(skip).limit(limit).exec(),
        this.dvdModel.countDocuments(filter).exec(),
      ]);

      this.logger.log(
        `Found ${dvds.length} DVDs out of ${total} total matches`,
      );

      // Process image URLs before returning
      const transformedDVDs = await Promise.all(
        dvds.map((dvd) => this.processDVDData(dvd))
      );

      return {
        dvds: transformedDVDs,
        total,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error(`Error finding DVDs: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findFeatured(limit: number = 6): Promise<DVD[]> {
    this.logger.log(`Finding featured DVDs with limit: ${limit}`);
    try {
      // Ensure limit is within valid range
      const safeLimit = Math.min(Math.max(1, limit), 20);
      if (safeLimit !== limit) {
        this.logger.warn(`Adjusted limit from ${limit} to ${safeLimit}`);
      }

      // Get DVDs with highest discount rate and in stock
      const dvds = await this.dvdModel
        .find({
          productType: 'DVD', // Only get DVDs
          discountRate: { $gt: 0 }, // Only discounted DVDs
          stock: { $gt: 0 }, // Only in stock
        })
        .sort({ discountRate: -1 }) // Sort by discount rate descending
        .limit(safeLimit)
        .exec();

      this.logger.log(`Found ${dvds.length} featured DVDs`);

      // Process image URLs before returning
      return await Promise.all(
        dvds.map((dvd) => this.processDVDData(dvd))
      );
    } catch (error) {
      this.logger.error(
        `Error finding featured DVDs: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async findOne(id: string): Promise<DVD> {
    console.log('[DVDs Service] findOne called with ID:', id);
    console.log('[DVDs Service] ID type:', typeof id);
    console.log('[DVDs Service] ID length:', id.length);

    try {
      const dvd = await this.dvdModel.findOne({ _id: id, productType: 'DVD' }).exec();
      console.log('[DVDs Service] MongoDB query result:', dvd ? 'Found' : 'Not found');

      if (!dvd) {
        console.log('[DVDs Service] DVD not found, throwing NotFoundException');
        throw new NotFoundException(`DVD with ID "${id}" not found`);
      }

      console.log('[DVDs Service] Found DVD:', dvd._id, dvd.title);
      const processedDVD = await this.processDVDData(dvd);
      console.log('[DVDs Service] Processed DVD successfully');
      return processedDVD;
    } catch (error) {
      console.error('[DVDs Service] Error in findOne:', error);
      throw error;
    }
  }

  async update(id: string, updateDVDDto: UpdateDVDDto): Promise<DVD> {
    // Handle coverImageUrl field - use it as coverImage if coverImage is not provided
    const updateData = { ...updateDVDDto };
    if (!updateData.coverImage && updateData.coverImageUrl) {
      updateData.coverImage = updateData.coverImageUrl;
    }

    // Remove coverImageUrl from the data as it's not part of the schema
    delete updateData.coverImageUrl;

    // Use findById + save to trigger pre-save hooks
    const dvdToUpdate = await this.dvdModel.findOne({ _id: id, productType: 'DVD' }).exec();
    if (!dvdToUpdate) {
      throw new NotFoundException(`DVD with ID "${id}" not found`);
    }

    // Update the DVD with new data
    Object.assign(dvdToUpdate, updateData);
    const updatedDVD = await dvdToUpdate.save();
    return await this.processDVDData(updatedDVD);
  }

  async remove(id: string): Promise<{ deleted: boolean; message?: string }> {
    const result = await this.dvdModel.deleteOne({ _id: id, productType: 'DVD' }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`DVD with ID "${id}" not found`);
    }
    return { deleted: true };
  }

  async getAllFilmTypes(): Promise<string[]> {
    this.logger.log('Getting all unique DVD film types');
    try {
      const dvdsCount = await this.dvdModel.countDocuments({ productType: 'DVD' });
      this.logger.log(`Total DVDs in collection: ${dvdsCount}`);

      const rawFilmTypes = await this.dvdModel.distinct('filmtype', { productType: 'DVD' }).exec();
      this.logger.log(
        `Found ${rawFilmTypes.length} raw film types: ${JSON.stringify(rawFilmTypes)}`,
      );

      const filmTypeMap = new Map<string, string>();
      const validFilmTypes = rawFilmTypes.filter(
        (filmType) =>
          filmType && typeof filmType === 'string' && filmType.trim().length > 0,
      );

      validFilmTypes.forEach((filmType) => {
        const normalizedFilmType = filmType.trim();
        const lowerFilmType = normalizedFilmType.toLowerCase();

        if (
          !filmTypeMap.has(lowerFilmType) ||
          (!isCapitalized(filmTypeMap.get(lowerFilmType)) &&
            isCapitalized(normalizedFilmType))
        ) {
          filmTypeMap.set(lowerFilmType, normalizedFilmType);
        }
      });

      const filmTypes = Array.from(filmTypeMap.values()).sort();
      this.logger.log(
        `Normalized ${filmTypes.length} unique film types: ${JSON.stringify(filmTypes)}`,
      );

      return filmTypes;
    } catch (error) {
      this.logger.error(`Error getting film types: ${error.message}`, error.stack);
      return [
        'Action',
        'Comedy',
        'Drama',
        'Horror',
        'Sci-Fi',
        'Thriller',
        'Romance',
        'Adventure',
        'Fantasy',
        'Documentary',
        'Animation',
        'Crime',
        'Mystery',
      ];
    }
  }

  async getAllDiscTypes(): Promise<string[]> {
    this.logger.log('Getting all unique DVD disc types');
    try {
      const rawDiscTypes = await this.dvdModel.distinct('disctype', { productType: 'DVD' }).exec();
      this.logger.log(
        `Found ${rawDiscTypes.length} raw disc types: ${JSON.stringify(rawDiscTypes)}`,
      );

      const discTypeMap = new Map<string, string>();
      const validDiscTypes = rawDiscTypes.filter(
        (discType) =>
          discType && typeof discType === 'string' && discType.trim().length > 0,
      );

      validDiscTypes.forEach((discType) => {
        const normalizedDiscType = discType.trim();
        const lowerDiscType = normalizedDiscType.toLowerCase();

        if (
          !discTypeMap.has(lowerDiscType) ||
          (!isCapitalized(discTypeMap.get(lowerDiscType)) &&
            isCapitalized(normalizedDiscType))
        ) {
          discTypeMap.set(lowerDiscType, normalizedDiscType);
        }
      });

      const discTypes = Array.from(discTypeMap.values()).sort();
      this.logger.log(
        `Normalized ${discTypes.length} unique disc types: ${JSON.stringify(discTypes)}`,
      );

      return discTypes;
    } catch (error) {
      this.logger.error(`Error getting disc types: ${error.message}`, error.stack);
      return ['DVD', 'Blu-ray', '4K UHD', 'Blu-ray 3D'];
    }
  }
}

// Helper function to check if string is capitalized
function isCapitalized(str: string | undefined): boolean {
  if (!str) return false;
  return /^[A-Z]/.test(str);
}