import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Product, ProductDocument } from '../../products/schemas/product.schema';
import { UploadService } from '../../upload/upload.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductActivityLogService } from '../activity-log/activity-log.service';
import { ProductActivityLog,ProductActivityLogDocument,ProductActivityType } from '../activity-log/schemas/product-activity-log.schema';
import { start } from 'repl';

export interface ProductFilters {
  page: number;
  limit: number;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Using the CreateProductDto and UpdateProductDto from ./dto/ folder

@Injectable()
export class AdminProductsService<T extends Product, D extends ProductDocument> {
  protected readonly logger = new Logger(AdminProductsService.name);

  constructor(
    protected readonly productModel: Model<D>,
    protected readonly configService: ConfigService,
    protected readonly uploadService: UploadService,
    protected readonly productActivityLogService: ProductActivityLogService
  ) {}

  // Helper method to process image URLs
  protected async processProductData(product: any): Promise<any> {
    if (!product) return null;
    const productObj = product.toObject ? product.toObject() : { ...product };

    // Process image URL using UploadService
    const coverImage = await this.uploadService.processImageUrl(productObj.coverImage);

    // Ensure price values are valid numbers
    const originalPrice = productObj.originalPrice || 0;
    const price = productObj.price || originalPrice;

    return {
      ...productObj,
      coverImage,
      originalPrice,
      price,
    };
  }


  async findHistory(userId: string) {
    const history = await this.productActivityLogService.findByUserId(userId);
    if (!history || history.length === 0) {
      throw new NotFoundException(`No activity history found for user ID ${userId}`);
    }
    // Process each history item to include product details
    return history;
    
  }

  // Create a new product
  async create(userId: string, createProductDto: CreateProductDto): Promise<T> {
    // Handle coverImageUrl field - use it as coverImage if coverImage is not provided
    const productData = { ...createProductDto, isAvailable: true };
    if (!productData.coverImage && productData.coverImageUrl) {
      productData.coverImage = productData.coverImageUrl;
    }



    // Remove coverImageUrl from the data as it's not part of the schema
    delete productData.coverImageUrl;

    // createAt = updateAT = now
    productData.createdAt = new Date();
    productData.updatedAt = new Date();


    if(productData.price / productData.originalPrice < 0.3 || productData.price / productData.originalPrice > 1.5) {
        throw new BadRequestException('Price must be between 30% and 150% of the original price');
    }
    const newProduct = new this.productModel(productData);
    const savedProduct = await newProduct.save();
    const newProductObj = await this.processProductData(savedProduct) as T; 
    // this.productActivityLogService.logActivity(
    //   userId,
    //   savedProduct._id.toString(),
    //   ProductActivityType.CREATE,
    //   new Date()
    // )

    // goi ham logActivity trong service
    await this.productActivityLogService.logActivity(
      userId,
      savedProduct._id.toString(),
      ProductActivityType.CREATE,
      new Date()
    );

    return newProductObj;
  }



    // Find a product by ID
  async findById(id: string): Promise<T> {
    const product = await this.productModel.findById(id).exec();
    if (!product || product.isAvailable == false) {
      throw new NotFoundException(`Product with ID ${id} not found or is deleted`);
    }
    return await this.processProductData(product) as T;
  }


    // Delete a product
  async delete(userId: string, id: string): Promise<void> {
    // check if product exists
    const existingProduct = await this.productModel
      .findOne({ _id: id, isAvailable: true })
      .exec();
    if (!existingProduct) {
      throw new NotFoundException(`Product with ID ${id} not found or has already been
      deleted`);

    }
    const now = new Date();
    const deletedProductCount = await this.productActivityLogService.countDeletedProductsByUserIdAndDate(userId,now);
    if (deletedProductCount >= 10) {
      throw new BadRequestException('You can only delete up to 30 products per day');
    }
    // set isAvailable = false and update updatedAt to now
    if (!now) {
      throw new BadRequestException('Invalid date');
    }

    const product = await this.productModel
      .findByIdAndUpdate(id, { isAvailable: false, updatedAt: now }, { new: true })
      .exec();
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found or has already been deleted`);
    }
    this.productActivityLogService.logActivity(
      userId,
      product._id.toString(),
      ProductActivityType.DELETE,
      now
    );
    this.logger.log(`Product with ID ${id} deleted successfully`);
    return;
  }


  async getDeleteCountBYUser(userId: string) {
    const now = new Date();
    const deletedProductCount = await this.productActivityLogService.countDeletedProductsByUserIdAndDate(userId, now);
    
    return deletedProductCount;
  }


  // delete multiple products by IDs
  async deleteMany(userId : string,ids: string[]): Promise<void> {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('No product IDs provided for deletion');
    }

    if(ids.length > 10){
      throw new BadRequestException('You can only delete up to 10 products at a time');
    }
    // check if all products exist
    const existingProducts = await this.productModel
      .find({ _id: { $in: ids }, isAvailable: true })
      .exec();
    if (existingProducts.length === 0 || existingProducts.length < ids.length) {
      throw new NotFoundException(`Products with the provided IDs not found or have already been deleted`);
    }
    // set isAvailable = false for all products and update updatedAt to now
    const now = new Date();


    const deletedProductCount = await this.productActivityLogService.countDeletedProductsByUserIdAndDate(userId,now);
    if (deletedProductCount + ids.length > 30) {
      throw new BadRequestException('You can only delete up to 10 products per day');
    }

    const products = await this.productModel
      .updateMany({ _id: { $in: ids } }, { isAvailable: false, updatedAt: now }, { multi: true })
      .exec();
    if (products.modifiedCount === 0) {
      throw new NotFoundException(`No products found with the provided IDs`);
    }

    // Log activity for each deleted product
    for (const id of ids) {
      await this.productActivityLogService.logActivity(
        userId,
        id,
        ProductActivityType.DELETE,
        now
      );
    }


    this.logger.log(`Products with IDs ${ids.join(', ')} deleted successfully`);
    return;
  }


  // find general information of a product
  async findGeneralInfo(id: string): Promise<Partial<T>> {
    const product = await this.productModel
      .findById(id)
      .select('title coverImage price originalPrice productType createdAt updateAt isAvailable')
      .exec();  
    // if (!product || product.isAvailable == false) {
    //   throw new NotFoundException(`Product with ID ${id} not found or is deleted`);
    // }
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    if(product.isAvailable == false){
      throw new NotFoundException(`Product with ID ${id} is not available`);
    }
    return await this.processProductData(product) as Partial<T>;
  }




    // Update a product
  async update(userId: string, id: string, updateProductDto: UpdateProductDto): Promise<T> {
    // Check if product exists
    await this.findById(id);

    // check if id belong to deleted product
    const existingProduct = await this.productModel
      .findOne({ _id: id, isAvailable: false })
      .exec();
    if (existingProduct) {
      throw new NotFoundException(`Product with ID ${id} is not existing or has been deleted`);
    }
    // If price is being updated, check if it's within the allowed range
    if (updateProductDto.price && updateProductDto.originalPrice) {
      const priceRatio = updateProductDto.price / updateProductDto.originalPrice;
      if (priceRatio < 0.3 || priceRatio > 1.5) {
        throw new BadRequestException(
          'Price must be between 30% and 150% of the original price',
        );
      }
    }

    // Handle coverImageUrl field - use it as coverImage if coverImage is not provided
    const updateData = { ...updateProductDto };
    if (!updateData.coverImage && updateData.coverImageUrl) {
      updateData.coverImage = updateData.coverImageUrl;
    }

    // Remove coverImageUrl from the data as it's not part of the schema
    delete updateData.coverImageUrl;

    // updateAt = now
    // lay mui gio viet nam
    updateData.updatedAt = new Date();

    // Use findById + save to trigger pre-save hooks
    const productToUpdate = await this.productModel.findById(id).exec();
    if (!productToUpdate) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }


    var isPriceUpdated = false;
    if(productToUpdate.price !== updateProductDto.price){
      isPriceUpdated = true;
      const countNumberOfUpdates = await this.productActivityLogService.countUpdatedPriceProductsByUserIdAndDate(userId, new Date(), id);
      if (countNumberOfUpdates >= 2) {
        throw new BadRequestException('You can only update the price of a product up to 2 times per day');
      }
    }

    // Update the product with new data
    Object.assign(productToUpdate, updateData);
    const updatedProduct = await productToUpdate.save();

    this.productActivityLogService.logActivity(
      userId,
      updatedProduct._id.toString(),
      // ProductActivityType.UPDATE,
      isPriceUpdated ? ProductActivityType.UPDATE_PRICE : ProductActivityType.UPDATE,
      new Date()
    )

    return await this.processProductData(updatedProduct) as T;
  }


  // Find all products with filtering
  async findAllGeneral(filters: ProductFilters): Promise<ProductListResponse> {
    const {
      page = 1,
      limit = 10,
      search,
      minPrice,
      maxPrice,
      inStock,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const query: any = {};

    // Apply filters
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) {
        query.price.$gte = minPrice;
      }
      if (maxPrice !== undefined) {
        query.price.$lte = maxPrice;
      }
    }
    query.isAvailable = true; // Only fetch available products

    if (inStock !== undefined) {
      // query.stock = inStock ? { $gt: 0 };
      // neu true thi tim gt : 0 neu false thi khong cân thêm và query
      if (inStock) {
        query.stock = { $gt: 0 };
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
      .select('title coverImage price originalPrice productType createdAt updatedAt isAvailable stock')
      .exec();

    // Process products with async image URL processing
    const processedProducts = await Promise.all(
      products.map(product => this.processProductData(product))
    );

    return {
      products: processedProducts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
