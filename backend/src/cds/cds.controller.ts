import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CDsService } from './cds.service';
import { CreateCDDto } from './dto/create-cd.dto';
import { UpdateCDDto } from './dto/update-cd.dto';
import { QueryCDDto } from './dto/query-cd.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CD } from './schemas/cd.schema';

@ApiTags('cds')
@Controller('cds')
export class CDsController {
  constructor(private readonly cdsService: CDsService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Create a new CD' })
  @ApiResponse({
    status: 201,
    description:
      'The CD has been successfully created. All prices are in USD.',
    type: CD,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  create(@Body() createCDDto: CreateCDDto) {
    return this.cdsService.create(createCDDto);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all unique CD categories' })
  @ApiResponse({
    status: 200,
    description: 'List of all categories.',
    type: [String],
  })
  async getAllCategories() {
    return this.cdsService.getAllCategories();
  }

  @Get('featured')
  @ApiOperation({
    summary: 'Get featured CDs (CDs with highest discount rates)',
    description:
      'Returns CDs with the highest discount rates that are currently in stock. All prices are in USD.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of featured CDs to return',
    type: Number,
    example: 6,
  })
  @ApiResponse({
    status: 200,
    description: 'List of featured CDs sorted by discount rate.',
    type: [CD],
  })
  async getFeatured(@Query('limit') limit?: string) {
    try {
      console.log(`Getting featured CDs with limit: ${limit}`);
      const limitNum = limit ? parseInt(limit, 10) : 6;
      console.log(`Parsed limit: ${limitNum}`);
      const cds = await this.cdsService.findFeatured(limitNum);
      console.log(`Found ${cds.length} featured CDs`);
      return cds;
    } catch (error) {
      console.error('Error getting featured CDs:', error);
      throw error;
    }
  }

  @Get()
  @ApiOperation({
    summary: 'Get all CDs with advanced filtering, searching and sorting',
    description:
      'All prices in request and response are in USD.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of CDs with prices in USD.',
    type: [CD],
  })
  findAll(@Query() queryDto: QueryCDDto) {
    console.log(
      'CDsController: Received query params:',
      JSON.stringify(queryDto),
    );

    if (queryDto.categories) {
      console.log(
        'CDsController: Received categories filter:',
        Array.isArray(queryDto.categories) ? queryDto.categories : [queryDto.categories],
      );
    }

    return this.cdsService.findAll(queryDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a CD by ID',
    description: 'Returns CD details with prices in USD',
  })
  @ApiParam({ name: 'id', description: 'The ID of the CD', type: String })
  @ApiResponse({
    status: 200,
    description: 'The found CD with prices in USD.',
    type: CD,
  })
  @ApiResponse({ status: 404, description: 'CD not found.' })
  findOne(@Param('id') id: string) {
    return this.cdsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put(':id')
  @ApiOperation({
    summary: 'Update a CD by ID',
    description: 'Prices should be provided in USD',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the CD to update',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'The updated CD with prices in USD.',
    type: CD,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'CD not found.' })
  update(@Param('id') id: string, @Body() updateCDDto: UpdateCDDto) {
    return this.cdsService.update(id, updateCDDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a CD by ID' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the CD to delete',
    type: String,
  })
  @ApiResponse({ status: 200, description: 'CD successfully deleted.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'CD not found.' })
  remove(@Param('id') id: string) {
    return this.cdsService.remove(id);
  }
}