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
import { AdminDVDsService } from './dvds.service';
import { AdminCreateDVDDto } from './dto/admin-create-dvd.dto';
import { AdminUpdateDVDDto } from './dto/admin-update-dvd.dto';
// import { UpdateDVDDto } from './dto/update-dvd.dto';
import { DVD } from '../../dvds/schemas/dvd.schema';
import { UploadService } from '../../upload/upload.service';
import {
  UploadPresignedUrlDto,
  UploadPresignedUrlResponseDto
} from '../../upload/dto/upload-presigned-url.dto';
import { GetUserId } from '../../auth/decorators/user.decorator';

@ApiTags('admin-dvds')
@Controller('admin/dvds')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class DvdsController {
  constructor(
    private readonly adminDVDsService: AdminDVDsService,
    private readonly uploadService: UploadService,
  ) {}

  @Post('upload-presigned-url')
  @ApiOperation({ summary: 'Generate presigned URL for DVD image upload' })
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
  @ApiOperation({ summary: 'Create a new DVD' })
  @ApiResponse({
    status: 201,
    description: 'DVD created successfully',
    type: DVD,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(@GetUserId() userId: string,@Body() createDVDDto: AdminCreateDVDDto): Promise<DVD> {
    return this.adminDVDsService.create(userId, createDVDDto);
    // return;
  }



  // find details of a DVD
  @Get(':id')
  @ApiOperation({ summary: 'Get DVD details by ID' })
  @ApiResponse({
    status: 200,
    description: 'DVD details retrieved successfully',
    type: DVD,
  })
  @ApiParam({ name: 'id', description: 'DVD ID', type: String })
  async findOne(@Param('id') id: string): Promise<DVD> {
    return this.adminDVDsService.findById(id);
  }



  // viet ham goi update DVD
  @Put(':id')

  @ApiOperation({ summary: 'Update a DVD by ID' })
  @ApiParam({ name: 'id', description: 'DVD ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'DVD updated successfully',
    type: DVD,
  })
  @ApiResponse({ status: 404, description: 'DVD not found' })
  async update(
    @Param('id') id: string,
    @GetUserId() userId: string, // Assuming userId is needed for logging or auditing
    @Body() updateDVDDto: AdminUpdateDVDDto, // Assuming CreateDVDDto is used for updates as well
  ): Promise<DVD> {
    return this.adminDVDsService.update(userId, id, updateDVDDto);
  }

  // findAllDVD
  // schema: DVD
  // @ApiProperty({
  //         description: 'The type of product',
  //         example: 'DVD',
  //         default: ProductType.DVD,
  //     })
  //     @IsOptional()
  //     productType: ProductType = ProductType.DVD;
  
  //     @ApiProperty({
  //         description: 'The type of DVD (e.g., Blu-ray, DVD)',
  //         example: 'Blu-ray',
  //     })
  //     @IsString()
  //     @IsNotEmpty()
  //     disctype: string;
      
  //     @ApiProperty({
  //         description: 'The director of the DVD',
  //         example: 'Christopher Nolan',
  //     })
  //     @IsString()
  //     @IsNotEmpty()
  //     director: string;
      
  //     @ApiProperty({
  //         description: 'Runtime of the DVD in minutes',
  //         example: 120,
  //     })
  //     @IsNumber()
  //     @IsNotEmpty()
  //     runtime: number;
      
  //     @ApiProperty({
  //         description: 'The studio that produced the DVD',
  //         example: 'Warner Bros.',
  //     })
  //     @IsString()
  //     @IsNotEmpty()
  //     studio: string;
      
  //     @ApiProperty({
  //         description: 'Available subtitles for the DVD',
  //         example: 'English, Spanish, French',
  //         default: 'Multiple',
  //     })
  //     @IsString()
  //     subtitles: string;
      
  //     @ApiProperty({
  //         description: 'Release date of the DVD',
  //         example: '2023-10-01',
  //     })
  //     @IsDateString()
  //     releaseddate: Date;
      
  //     @ApiProperty({
  //         description: 'Film type or genre of the DVD',
  //         example: 'Action',
  //     })
  //     @IsString()
  //     filmtype: string;
  @Get()
  @ApiOperation({ summary: 'Get all DVDs with optional filters' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number for pagination' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term for CD title or artist' })
  @ApiQuery({ name: 'minPrice', required: false, type: Number, description: 'Minimum price filter' })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number, description: 'Maximum price filter' })
  @ApiQuery({ name: 'inStock', required: false, type: Boolean, description: 'Filter by stock availability' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Field to sort by', enum: ['createdAt', 'updatedAt', 'title', 'price'] })
  @ApiQuery({ name: 'sortOrder', required: false, type: String, description: 'Sort order', enum: ['asc', 'desc'] })
  @ApiResponse({
    status: 200,
    description: 'Returns all DVDs with pagination and filters',
    type: DVD,
    isArray: true,
  })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('inStock') inStock?: boolean,
    @Query('sortBy') sortBy: string = 'createdAt',
    @Query('sortOrder') sortOrder: 'asc' | 'desc' = 'desc',
  ) {
    return this.adminDVDsService.findAllDVD({
      page,
      limit,
      search,
      minPrice,
      maxPrice,
      inStock,
      sortBy,
      sortOrder,
    });
  }



}
