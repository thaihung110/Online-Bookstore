import { Injectable } from '@nestjs/common';
import { IProductDataProcessor, IBaseProduct, IPricingData } from '../interfaces/base-product.interface';
import { UploadService } from '../../upload/upload.service';

// Base data processor implementing SRP - only handles data transformation
@Injectable()
export abstract class BaseProductDataProcessor<T extends IBaseProduct> 
  implements IProductDataProcessor<T> {
  
  constructor(protected readonly uploadService: UploadService) {}

  async processProductData(rawData: any): Promise<T> {
    if (!rawData) return null;
    
    const productObj = rawData.toObject ? rawData.toObject() : { ...rawData };

    // Process common product data
    const processedData = await this.processBaseData(productObj);
    
    // Apply product-specific processing
    return await this.processSpecificData(processedData);
  }

  // Process base product data (SRP - single responsibility for base processing)
  protected async processBaseData(productObj: any): Promise<any> {
    // Process image URL using UploadService
    const coverImage = await this.uploadService.processImageUrl(productObj.coverImage);

    // Process pricing data
    const pricingData = this.processPricingData(productObj);

    return {
      ...productObj,
      coverImage,
      ...pricingData,
    };
  }

  // Separate pricing calculation logic (SRP)
  protected processPricingData(productObj: any): IPricingData {
    const originalPrice = productObj.originalPrice || 0;
    const discountRate = productObj.discountRate || 0;
    const price = productObj.price || (originalPrice * (1 - discountRate / 100));

    return {
      originalPrice,
      discountRate,
      price,
    };
  }

  // Abstract method for product-specific processing (OCP)
  protected abstract processSpecificData(baseData: any): Promise<T>;
}

// Book-specific data processor
@Injectable()
export class BookDataProcessor extends BaseProductDataProcessor<any> {
  protected async processSpecificData(baseData: any): Promise<any> {
    // Add book-specific processing if needed
    return {
      ...baseData,
      productType: 'BOOK',
      // Ensure book-specific fields are properly formatted
      author: baseData.author?.trim() || '',
      isbn: baseData.isbn?.trim() || '',
      genres: Array.isArray(baseData.genres) ? baseData.genres : [],
      publisher: baseData.publisher?.trim() || '',
      publicationYear: baseData.publicationYear || null,
      language: baseData.language || 'English',
      pageCount: baseData.pageCount || null,
    };
  }
}

// CD-specific data processor
@Injectable()
export class CDDataProcessor extends BaseProductDataProcessor<any> {
  protected async processSpecificData(baseData: any): Promise<any> {
    return {
      ...baseData,
      productType: 'CD',
      // Ensure CD-specific fields are properly formatted
      artist: baseData.artist?.trim() || '',
      albumTitle: baseData.albumTitle?.trim() || '',
      trackList: baseData.trackList?.trim() || '',
      category: baseData.category?.trim() || '',
      releaseddate: baseData.releaseddate || null,
    };
  }
}

// DVD-specific data processor
@Injectable()
export class DVDDataProcessor extends BaseProductDataProcessor<any> {
  protected async processSpecificData(baseData: any): Promise<any> {
    return {
      ...baseData,
      productType: 'DVD',
      // Ensure DVD-specific fields are properly formatted
      director: baseData.director?.trim() || '',
      studio: baseData.studio?.trim() || '',
      runtime: baseData.runtime || null,
      filmType: baseData.filmType?.trim() || '',
      discType: baseData.discType?.trim() || '',
      cast: baseData.cast?.trim() || '',
      releaseddate: baseData.releaseddate || null,
    };
  }
}