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

export interface ProductFilters {
  page: number;
  limit: number;
  search?: string;
  category?: string;
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

  // Create a new product
  async create(createProductDto: CreateProductDto): Promise<T> {
    // Handle coverImageUrl field - use it as coverImage if coverImage is not provided
    const productData = { ...createProductDto };
    if (!productData.coverImage && productData.coverImageUrl) {
      productData.coverImage = productData.coverImageUrl;
    }

    // Remove coverImageUrl from the data as it's not part of the schema
    delete productData.coverImageUrl;

    if(productData.price / productData.originalPrice < 0.3 || productData.price / productData.originalPrice > 1.5) {
        throw new BadRequestException('Price must be between 30% and 150% of the original price');
    }


    const newProduct = new this.productModel(productData);
    const savedProduct = await newProduct.save();
    return await this.processProductData(savedProduct) as T;
  }

  // Find a product by ID
//   async findById(id: string): Promise<T> {
//     const product = await this.productModel.findById(id).exec();
//     if (!product) {
//       throw new NotFoundException(`Product with ID ${id} not found`);
//     }
//     return await this.processProductData(product) as T;
//   }

//   // Find all products with filtering
//   async findAll(filters: ProductFilters): Promise<ProductListResponse> {
//     const {
//       page = 1,
//       limit = 10,
//       search,
//       category,
//       minPrice,
//       maxPrice,
//       inStock,
//       sortBy = 'createdAt',
//       sortOrder = 'desc',
//     } = filters;

//     const query: any = {};

//     // Apply filters
//     if (search) {
//       query.$or = [
//         { title: { $regex: search, $options: 'i' } },
//       ];
//     }

//     if (category) {
//       query.category = category;
//     }

//     if (minPrice !== undefined || maxPrice !== undefined) {
//       query.price = {};
//       if (minPrice !== undefined) {
//         query.price.$gte = minPrice;
//       }
//       if (maxPrice !== undefined) {
//         query.price.$lte = maxPrice;
//       }
//     }

//     if (inStock !== undefined) {
//       query.stock = inStock ? { $gt: 0 } : { $lte: 0 };
//     }

//     // Count total documents
//     const total = await this.productModel.countDocuments(query);

//     // Build sort object
//     const sort: any = {};
//     sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

//     // Fetch paginated products
//     const products = await this.productModel
//       .find(query)
//       .sort(sort)
//       .skip((page - 1) * limit)
//       .limit(limit)
//       .exec();

//     // Process products with async image URL processing
//     const processedProducts = await Promise.all(
//       products.map(product => this.processProductData(product))
//     );

//     return {
//       products: processedProducts,
//       total,
//       page,
//       limit,
//       totalPages: Math.ceil(total / limit),
//     };
//   }

//   // Update a product
//   async update(id: string, updateProductDto: UpdateProductDto): Promise<T> {
//     // Check if product exists
//     await this.findById(id);

//     // Handle coverImageUrl field - use it as coverImage if coverImage is not provided
//     const updateData = { ...updateProductDto };
//     if (!updateData.coverImage && updateData.coverImageUrl) {
//       updateData.coverImage = updateData.coverImageUrl;
//     }

//     // Remove coverImageUrl from the data as it's not part of the schema
//     delete updateData.coverImageUrl;

//     // Use findById + save to trigger pre-save hooks
//     const productToUpdate = await this.productModel.findById(id).exec();
//     if (!productToUpdate) {
//       throw new NotFoundException(`Product with ID ${id} not found`);
//     }

//     // Update the product with new data
//     Object.assign(productToUpdate, updateData);
//     const updatedProduct = await productToUpdate.save();

//     return await this.processProductData(updatedProduct) as T;
//   }

//   // Delete a product
//   async delete(id: string): Promise<void> {
//     // Check if product exists
//     await this.findById(id);

//     const result = await this.productModel.deleteOne({ _id: id }).exec();
//     if (result.deletedCount === 0) {
//       throw new NotFoundException(`Product with ID ${id} not found`);
//     }
//   }
}
