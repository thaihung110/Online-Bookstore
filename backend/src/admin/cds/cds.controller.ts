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
import { CreateCDDto } from './dto/create-cd.dto';
import { UpdateCDDto } from './dto/update-cd.dto';
import { CD } from '../../cds/schemas/cd.schema';
import { UploadService } from '../../upload/upload.service';
import {
  UploadPresignedUrlDto,
  UploadPresignedUrlResponseDto
} from '../../upload/dto/upload-presigned-url.dto';

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
  async create(@Body() createCDDto: CreateCDDto): Promise<CD> {
    return this.adminCDsService.create(createCDDto);
  }
}
