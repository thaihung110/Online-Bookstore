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
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { QueryBookDto } from './dto/query-book.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Book } from './schemas/book.schema';

@ApiTags('books')
@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Create a new book' })
  @ApiResponse({
    status: 201,
    description: 'The book has been successfully created.',
    type: Book,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  create(@Body() createBookDto: CreateBookDto) {
    return this.booksService.create(createBookDto);
  }

  @Get('genres')
  @ApiOperation({ summary: 'Get all unique book genres' })
  @ApiResponse({
    status: 200,
    description: 'List of all genres.',
    type: [String],
  })
  async getAllGenres() {
    return this.booksService.getAllGenres();
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured books' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of featured books to return',
    type: Number,
    example: 6,
  })
  @ApiResponse({
    status: 200,
    description: 'List of featured books.',
    type: [Book],
  })
  async getFeatured(@Query('limit') limit?: string) {
    try {
      console.log(`Getting featured books with limit: ${limit}`);
      const limitNum = limit ? parseInt(limit, 10) : 6;
      console.log(`Parsed limit: ${limitNum}`);
      const books = await this.booksService.findFeatured(limitNum);
      console.log(`Found ${books.length} featured books`);
      return books;
    } catch (error) {
      console.error('Error getting featured books:', error);
      throw error;
    }
  }

  @Get()
  @ApiOperation({
    summary: 'Get all books with advanced filtering, searching and sorting',
  })
  @ApiResponse({ status: 200, description: 'List of books.', type: [Book] })
  findAll(@Query() queryDto: QueryBookDto) {
    console.log(
      'BooksController: Received query params:',
      JSON.stringify(queryDto),
    );

    // Check specifically for genres query param
    if (queryDto.genres) {
      console.log(
        'BooksController: Received genres filter:',
        Array.isArray(queryDto.genres) ? queryDto.genres : [queryDto.genres],
      );
    }

    return this.booksService.findAll(queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a book by ID' })
  @ApiParam({ name: 'id', description: 'The ID of the book', type: String })
  @ApiResponse({ status: 200, description: 'The found book.', type: Book })
  @ApiResponse({ status: 404, description: 'Book not found.' })
  findOne(@Param('id') id: string) {
    // Mongoose IDs are strings, ParseUUIDPipe is for UUIDs.
    return this.booksService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put(':id')
  @ApiOperation({ summary: 'Update a book by ID' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the book to update',
    type: String,
  })
  @ApiResponse({ status: 200, description: 'The updated book.', type: Book })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Book not found.' })
  update(@Param('id') id: string, @Body() updateBookDto: UpdateBookDto) {
    return this.booksService.update(id, updateBookDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a book by ID' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the book to delete',
    type: String,
  })
  @ApiResponse({ status: 200, description: 'Book successfully deleted.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Book not found.' })
  remove(@Param('id') id: string) {
    return this.booksService.remove(id);
  }
}
