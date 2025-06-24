import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { AdminProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from '../../products/schemas/product.schema';
import { UploadService } from '../../upload/upload.service';
import {
  UploadPresignedUrlDto,
  UploadPresignedUrlResponseDto
} from '../../upload/dto/upload-presigned-url.dto';

@ApiTags('admin-products')
@Controller('admin/products')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class ProductsController {  constructor(
    private readonly adminProductsService: AdminProductsService<Product, any>,
    private readonly uploadService: UploadService,
  ) {}

  @Post('upload-presigned-url')
  @ApiOperation({ summary: 'Generate presigned URL for product image upload' })
  @ApiResponse({
    status: 201,
    description: 'Presigned URL generated successfully',
    type: UploadPresignedUrlResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid file type or parameters' })
  async getUploadPresignedUrl(
    @Body() uploadDto: UploadPresignedUrlDto,
  ): Promise<UploadPresignedUrlResponseDto> {
    return this.uploadService.generateUploadPresignedUrl(
      uploadDto.fileName,
      uploadDto.contentType,
    );
  }

  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
    type: Product,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(@Body() createProductDto: CreateProductDto): Promise<Product> {
    return this.adminProductsService.create(createProductDto);
    // return;
  }
}
