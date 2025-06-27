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
import { GetUserId } from '../../auth/decorators/user.decorator';

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
  async create(@GetUserId() userId: string,@Body() createProductDto: CreateProductDto): Promise<Product> {
    return this.adminProductsService.create(userId, createProductDto);
    // return;
  }

  @Get('general-info/:id')
  @ApiOperation({ summary: 'Get general information about a product' })
  @ApiParam({ name: 'id', description: 'Product ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'General product information retrieved successfully',
    type: Product,
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findGeneralInfo(@Param('id') id: string): Promise<Partial<Product>> {
    return this.adminProductsService.findGeneralInfo(id);
  }


    // delete many
  @Delete('many')
  @ApiOperation({ summary: 'Delete multiple products' })
  @ApiResponse({ status: 200, description: 'Products deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Products not found' })
  async deleteMany(@GetUserId() userId: string,@Body('ids') ids: string[]): Promise<void> {
    return this.adminProductsService.deleteMany(userId, ids);
  }



  @Delete('one/:id')
  @ApiOperation({ summary: 'Delete a product' })
  @ApiParam({ name: 'id', description: 'product ID' })
  @ApiResponse({ status: 200, description: 'product deleted successfully' })
  @ApiResponse({ status: 404, description: 'product not found' })
  async delete(@GetUserId() userId: string,@Param('id') id: string): Promise<void> {
    return this.adminProductsService.delete(userId, id);
  }


  @Get('history')
  @ApiOperation({ summary: 'Get product alter history of user' })
  async getHistory(@GetUserId() userId: string) {
    // return {
    //   history: [
    //     {
    //       action: 'create',
    //       timestamp: new Date().toISOString(),
    //       productName: 'Product A',
    //     },
    //     {
    //       action: 'update',
    //       timestamp: new Date().toISOString(),
    //       productName: 'Product B',
    //     },
    //     {
    //       action: 'delete',
    //       timestamp: new Date().toISOString(),
    //       productName: 'Product B',
    //     },

    //     {
    //       action: 'delete',
    //       timestamp: new Date().toISOString(),
    //       productName: 'Product D',
    //     },
    //     {
    //       action: 'delete',
    //       timestamp: new Date().toISOString(),
    //       productName: 'Product E',
    //     },
    //   ]
    // }

    return this.adminProductsService.findHistory(userId);
  }
}
