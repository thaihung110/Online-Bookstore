import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Model, Document } from 'mongoose';
import { 
  IProductService, 
  IBaseProduct, 
  IBaseProductDocument, 
  IProductDataProcessor,
  IBaseProductQuery 
} from '../interfaces/base-product.interface';

// Generic base service implementing common product operations
// Follows OCP (open for extension, closed for modification) and DIP (depends on abstractions)
@Injectable()
export abstract class BaseProductService<T, TDocument extends Document> {
  
  protected readonly logger = new Logger(this.constructor.name);

  constructor(
    protected readonly model: Model<TDocument>,
    protected readonly dataProcessor: IProductDataProcessor<any>,
    protected readonly productType: string,
  ) {}

  // Common findOne implementation - no duplication across services
  async findOne(id: string): Promise<T> {
    this.logger.log(`Finding ${this.productType} with ID: ${id}`);
    
    try {
      const product = await this.model.findOne({ 
        _id: id, 
        productType: this.productType 
      }).exec();

      if (!product) {
        throw new NotFoundException(`${this.productType} with ID "${id}" not found`);
      }

      this.logger.log(`Found ${this.productType}: ${product._id}`);
      return await this.dataProcessor.processProductData(product);
    } catch (error) {
      this.logger.error(`Error finding ${this.productType}:`, error);
      throw error;
    }
  }

  // Common findAll implementation with generic filtering
  async findAll(query: IBaseProductQuery): Promise<{ 
    products: T[]; 
    total: number; 
    page: number; 
    limit: number; 
  }> {
    this.logger.log(`Finding ${this.productType}s with filters: ${JSON.stringify(query)}`);

    try {
      // Build base filter
      const filter: any = { productType: this.productType };

      // Apply common filters
      this.applyCommonFilters(filter, query);
      
      // Apply product-specific filters (OCP - extensible)
      this.applySpecificFilters(filter, query);

      // Pagination
      const page = query.page || 1;
      const limit = query.limit || 10;
      const skip = (page - 1) * limit;

      // Sorting
      const sort = this.buildSortQuery(query);

      this.logger.log(`Applying filter: ${JSON.stringify(filter)}`);
      this.logger.log(`Sorting by: ${JSON.stringify(sort)}`);

      // Execute query
      const [products, total] = await Promise.all([
        this.model.find(filter).sort(sort).skip(skip).limit(limit).exec(),
        this.model.countDocuments(filter).exec(),
      ]);

      this.logger.log(`Found ${products.length} ${this.productType}s out of ${total} total matches`);

      // Process products through data processor
      const processedProducts = await Promise.all(
        products.map(product => this.dataProcessor.processProductData(product))
      );

      return {
        products: processedProducts,
        total,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error(`Error finding ${this.productType}s:`, error.message, error.stack);
      throw error;
    }
  }

  // Common findFeatured implementation
  async findFeatured(limit: number = 6): Promise<T[]> {
    this.logger.log(`Finding featured ${this.productType}s with limit: ${limit}`);
    
    try {
      // Ensure limit is within valid range
      const safeLimit = Math.min(Math.max(1, limit), 20);
      if (safeLimit !== limit) {
        this.logger.warn(`Adjusted limit from ${limit} to ${safeLimit}`);
      }

      // Get products with highest discount rate and in stock
      const products = await this.model
        .find({
          productType: this.productType,
          discountRate: { $gt: 0 }, // Only discounted products
          stock: { $gt: 0 }, // Only in stock
        })
        .sort({ discountRate: -1 }) // Sort by discount rate descending
        .limit(safeLimit)
        .exec();

      this.logger.log(`Found ${products.length} featured ${this.productType}s`);

      // Process products through data processor
      return await Promise.all(
        products.map(product => this.dataProcessor.processProductData(product))
      );
    } catch (error) {
      this.logger.error(`Error finding featured ${this.productType}s:`, error.message, error.stack);
      throw error;
    }
  }

  // Common create implementation
  async create(createDto: any): Promise<T> {
    // Set productType explicitly
    const productData = { ...createDto, productType: this.productType };
    
    const newProduct = new this.model(productData);
    const savedProduct = await newProduct.save();
    return await this.dataProcessor.processProductData(savedProduct);
  }

  // Common update implementation
  async update(id: string, updateDto: any): Promise<T> {
    const productToUpdate = await this.model.findOne({ 
      _id: id, 
      productType: this.productType 
    }).exec();
    
    if (!productToUpdate) {
      throw new NotFoundException(`${this.productType} with ID "${id}" not found`);
    }

    // Update the product with new data
    Object.assign(productToUpdate, updateDto);
    const updatedProduct = await productToUpdate.save();
    return await this.dataProcessor.processProductData(updatedProduct);
  }

  // Common remove implementation
  async remove(id: string): Promise<{ deleted: boolean; message?: string }> {
    const result = await this.model.deleteOne({ 
      _id: id, 
      productType: this.productType 
    }).exec();
    
    if (result.deletedCount === 0) {
      throw new NotFoundException(`${this.productType} with ID "${id}" not found`);
    }
    
    return { deleted: true };
  }

  // Protected method to apply common filters (SRP)
  protected applyCommonFilters(filter: any, query: IBaseProductQuery): void {
    // Search term
    if (query.search) {
      filter['$or'] = this.buildSearchQuery(query.search);
    }

    // Price range filter
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      filter.price = {};
      if (query.minPrice !== undefined) {
        filter.price.$gte = query.minPrice;
      }
      if (query.maxPrice !== undefined) {
        filter.price.$lte = query.maxPrice;
      }
    }

    // In stock filter
    if (query.inStock) {
      filter.stock = { $gt: 0 };
    }

    // On sale filter
    if (query.onSale) {
      filter.discountRate = { $gt: 0 };
    }
  }

  // Abstract methods for product-specific implementations (OCP)
  protected abstract applySpecificFilters(filter: any, query: any): void;
  protected abstract buildSearchQuery(searchTerm: string): any[];
  protected abstract buildSortQuery(query: any): any;
}