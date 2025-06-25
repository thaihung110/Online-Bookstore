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
import { AdminCDsService } from './cds.service';
import { AdminCreateCDDto } from './dto/admin-create-cd.dto';
import { AdminUpdateCDDto } from './dto/admin-update-cd.dto';
import { CD } from '../../cds/schemas/cd.schema';
import { UploadService } from '../../upload/upload.service';
import { } from '../../auth/decorators/'
import {
  UploadPresignedUrlDto,
  UploadPresignedUrlResponseDto
} from '../../upload/dto/upload-presigned-url.dto';
import { GetUserId } from '../../auth/decorators/user.decorator';

@ApiTags('admin-cds')
@Controller('admin/cds')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class CdsController {
  constructor(
    private readonly adminCDsService: AdminCDsService,
    private readonly uploadService: UploadService,
  ) {}



  
  @Post('upload-presigned-url')
  @ApiOperation({ summary: 'Generate presigned URL for CD image upload' })
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
  @ApiOperation({ summary: 'Create a new CD' })
  @ApiResponse({
    status: 201,
    description: 'CD created successfully',
    type: CD,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(@GetUserId() userId: string,@Body() createCDDto: AdminCreateCDDto): Promise<CD> {
    return this.adminCDsService.create(userId,createCDDto);
  }


  // find details of a CD
  @Get(':id')
  @ApiOperation({ summary: 'Get a CD by ID' })
  @ApiParam({ name: 'id', description: 'CD ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'CD retrieved successfully',
    type: CD,
  })
  @ApiResponse({ status: 404, description: 'CD not found' })
  async findById(@Param('id') id: string): Promise<CD> {
    return this.adminCDsService.findById(id);
  }


  // viet ham goi update CD
  @Put(':id')
  @ApiOperation({ summary: 'Update a CD by ID' })
  @ApiParam({ name: 'id', description: 'CD ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'CD updated successfully',
    type: CD,
  })
  @ApiResponse({ status: 404, description: 'CD not found' })
  async update(
    @GetUserId() userId: string,
    @Param('id') id: string,
    @Body() updateCDDto: AdminUpdateCDDto,
  ): Promise<CD> {
    return this.adminCDsService.update(userId, id, updateCDDto);
  }


  // findAll CDs with optional filters
  @Get()
  @ApiOperation({ summary: 'Get all CDs with optional filters' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number for pagination' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term for CD title or artist' })
  @ApiQuery({ name: 'artist', required: false, type: String, description: 'Filter by artist' })
  @ApiQuery({ name: 'albumTitle', required: false, type: String, description: 'Filter by album title' })
  @ApiQuery({ name: 'releasedDateStart', required: false, type: Date, description: 'Filter by start date of release' })
  @ApiQuery({ name: 'releasedDateEnd', required: false, type: Date, description: 'Filter by end date of release' })
  @ApiQuery({ name: 'minPrice', required: false, type: Number, description: 'Minimum price filter' })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number, description: 'Maximum price filter' })
  @ApiQuery({ name: 'inStock', required: false, type: Boolean, description: 'Filter by stock availability' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Field to sort by', enum: ['createdAt', 'updatedAt', 'title', 'price'] })
  @ApiQuery({ name: 'sortOrder', required: false, type: String, description: 'Sort order', enum: ['asc', 'desc'] })
  @ApiResponse({
    status: 200,
    description: 'Returns all CDs with pagination and filters',
    type: CD,
    isArray: true,
  })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('artist') artist?: string,
    @Query('albumTitle') albumTitle?: string,
    @Query('releasedDateStart') releasedDateStart?: Date,
    @Query('releasedDateEnd') releasedDateEnd?: Date,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('inStock') inStock?: boolean,
    @Query('sortBy') sortBy: string = 'createdAt',
    @Query('sortOrder') sortOrder: 'asc' | 'desc' = 'desc',
  ) {
    return this.adminCDsService.findAllCD({
      page,
      limit,
      search,
      artist,
      albumTitle,
      releasedDateStart,
      releasedDateEnd,
      minPrice,
      maxPrice,
      inStock,
      sortBy,
      sortOrder,
    });
  }




}
