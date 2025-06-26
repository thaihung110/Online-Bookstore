import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { Product } from './schemas/product.schema';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all available products' })
  @ApiResponse({
    status: 200,
    description: 'Products retrieved successfully.',
    type: [Product],
  })
  async findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiParam({
    name: 'id',
    description: 'Product ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Product retrieved successfully.',
    type: Product,
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found.',
  })
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }
}
