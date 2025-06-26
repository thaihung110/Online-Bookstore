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
import { DVDsService } from './dvds.service';
import { CreateDVDDto } from './dto/create-dvd.dto';
import { UpdateDVDDto } from './dto/update-dvd.dto';
import { QueryDVDDto } from './dto/query-dvd.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DVD } from './schemas/dvd.schema';

@ApiTags('dvds')
@Controller('dvds')
export class DVDsController {
  constructor(private readonly dvdsService: DVDsService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Create a new DVD' })
  @ApiResponse({
    status: 201,
    description:
      'The DVD has been successfully created. All prices are in USD.',
    type: DVD,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  create(@Body() createDVDDto: CreateDVDDto) {
    return this.dvdsService.create(createDVDDto);
  }

  @Get('film-types')
  @ApiOperation({ summary: 'Get all unique DVD film types/genres' })
  @ApiResponse({
    status: 200,
    description: 'List of all film types.',
    type: [String],
  })
  async getAllFilmTypes() {
    return this.dvdsService.getAllFilmTypes();
  }

  @Get('disc-types')
  @ApiOperation({ summary: 'Get all unique DVD disc types' })
  @ApiResponse({
    status: 200,
    description: 'List of all disc types.',
    type: [String],
  })
  async getAllDiscTypes() {
    return this.dvdsService.getAllDiscTypes();
  }

  @Get('featured')
  @ApiOperation({
    summary: 'Get featured DVDs (DVDs with highest discount rates)',
    description:
      'Returns DVDs with the highest discount rates that are currently in stock. All prices are in USD.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of featured DVDs to return',
    type: Number,
    example: 6,
  })
  @ApiResponse({
    status: 200,
    description: 'List of featured DVDs sorted by discount rate.',
    type: [DVD],
  })
  async getFeatured(@Query('limit') limit?: string) {
    try {
      console.log(`Getting featured DVDs with limit: ${limit}`);
      const limitNum = limit ? parseInt(limit, 10) : 6;
      console.log(`Parsed limit: ${limitNum}`);
      const dvds = await this.dvdsService.findFeatured(limitNum);
      console.log(`Found ${dvds.length} featured DVDs`);
      return dvds;
    } catch (error) {
      console.error('Error getting featured DVDs:', error);
      throw error;
    }
  }

  @Get()
  @ApiOperation({
    summary: 'Get all DVDs with advanced filtering, searching and sorting',
    description:
      'All prices in request and response are in USD.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of DVDs with prices in USD.',
    type: [DVD],
  })
  findAll(@Query() queryDto: QueryDVDDto) {
    console.log(
      'DVDsController: Received query params:',
      JSON.stringify(queryDto),
    );

    if (queryDto.filmTypes) {
      console.log(
        'DVDsController: Received film types filter:',
        Array.isArray(queryDto.filmTypes) ? queryDto.filmTypes : [queryDto.filmTypes],
      );
    }

    if (queryDto.discTypes) {
      console.log(
        'DVDsController: Received disc types filter:',
        Array.isArray(queryDto.discTypes) ? queryDto.discTypes : [queryDto.discTypes],
      );
    }

    return this.dvdsService.findAll(queryDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a DVD by ID',
    description: 'Returns DVD details with prices in USD',
  })
  @ApiParam({ name: 'id', description: 'The ID of the DVD', type: String })
  @ApiResponse({
    status: 200,
    description: 'The found DVD with prices in USD.',
    type: DVD,
  })
  @ApiResponse({ status: 404, description: 'DVD not found.' })
  findOne(@Param('id') id: string) {
    return this.dvdsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put(':id')
  @ApiOperation({
    summary: 'Update a DVD by ID',
    description: 'Prices should be provided in USD',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the DVD to update',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'The updated DVD with prices in USD.',
    type: DVD,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'DVD not found.' })
  update(@Param('id') id: string, @Body() updateDVDDto: UpdateDVDDto) {
    return this.dvdsService.update(id, updateDVDDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a DVD by ID' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the DVD to delete',
    type: String,
  })
  @ApiResponse({ status: 200, description: 'DVD successfully deleted.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'DVD not found.' })
  remove(@Param('id') id: string) {
    return this.dvdsService.remove(id);
  }
}