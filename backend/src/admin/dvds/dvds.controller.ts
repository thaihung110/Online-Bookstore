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
    @Body() updateDVDDto: AdminCreateDVDDto, // Assuming CreateDVDDto is used for updates as well
  ): Promise<DVD> {
    return this.adminDVDsService.update(userId, id, updateDVDDto);
  }

}
