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
import { AdminBooksService } from './admin-books.service';
import { CreateBookDto } from '../../books/dto/create-book.dto';
import { UpdateBookDto } from '../../books/dto/update-book.dto';
import { Book } from '../../books/schemas/book.schema';
import { UploadService } from '../../upload/upload.service';
import {
  UploadPresignedUrlDto,
  UploadPresignedUrlResponseDto
} from '../../upload/dto/upload-presigned-url.dto';

@ApiTags('admin-books')
@Controller('admin/books')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class AdminBooksController {
  constructor(
    private readonly adminBooksService: AdminBooksService,
    private readonly uploadService: UploadService,
  ) {}

  @Post('upload-presigned-url')
  @ApiOperation({ summary: 'Generate presigned URL for book cover upload' })
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

  @Get()
  @ApiOperation({ summary: 'Get all books with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'author', required: false, type: String })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiQuery({ name: 'inStock', required: false, type: Boolean })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    type: String,
    enum: ['asc', 'desc'],
  })
  @ApiResponse({
    status: 200,
    description: 'Returns all books with pagination',
  })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('author') author?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('inStock') inStock?: boolean,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.adminBooksService.findAll({
      page,
      limit,
      search,
      category,
      author,
      minPrice,
      maxPrice,
      inStock,
      sortBy,
      sortOrder,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a book by ID' })
  @ApiParam({ name: 'id', description: 'Book ID' })
  @ApiResponse({ status: 200, description: 'Returns a book by ID', type: Book })
  @ApiResponse({ status: 404, description: 'Book not found' })
  async findById(@Param('id') id: string): Promise<Book> {
    return this.adminBooksService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new book' })
  @ApiResponse({
    status: 201,
    description: 'Book created successfully',
    type: Book,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(@Body() createBookDto: CreateBookDto): Promise<Book> {
    return this.adminBooksService.create(createBookDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a book' })
  @ApiParam({ name: 'id', description: 'Book ID' })
  @ApiResponse({
    status: 200,
    description: 'Book updated successfully',
    type: Book,
  })
  @ApiResponse({ status: 404, description: 'Book not found' })
  async update(
    @Param('id') id: string,
    @Body() updateBookDto: UpdateBookDto,
  ): Promise<Book> {
    return this.adminBooksService.update(id, updateBookDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a book' })
  @ApiParam({ name: 'id', description: 'Book ID' })
  @ApiResponse({ status: 200, description: 'Book deleted successfully' })
  @ApiResponse({ status: 404, description: 'Book not found' })
  async delete(@Param('id') id: string): Promise<void> {
    return this.adminBooksService.delete(id);
  }
}
