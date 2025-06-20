import {
  Controller,
  Post,
  UseGuards,
  HttpCode,
  HttpStatus,
  Get,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards';
import { Roles } from '../auth/decorators';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Book, BookDocument } from './schemas/book.schema';

@ApiTags('books-admin')
@Controller('books-admin')
export class UpdateBooksController {
  private readonly commonGenres = [
    'Fiction',
    'Non-Fiction',
    'Science Fiction',
    'Fantasy',
    'Mystery',
    'Romance',
    'Thriller',
    'Biography',
    'History',
    'Business',
    'Self-Help',
    'Children',
  ];

  constructor(@InjectModel(Book.name) private bookModel: Model<BookDocument>) {}

  @Post('update-all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiOperation({
    summary: 'Update all books with genres and discount information',
  })
  @ApiResponse({
    status: 200,
    description: 'Books updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        genreUpdatedCount: { type: 'number' },
        discountUpdatedCount: { type: 'number' },
        message: { type: 'string' },
      },
    },
  })
  async updateAllBooks() {
    return await this.performUpdate();
  }

  @Get('dev-update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Development endpoint to update books (no auth required)',
  })
  @ApiResponse({
    status: 200,
    description: 'Books updated successfully',
  })
  async devUpdate() {
    return await this.performUpdate();
  }

  private async performUpdate() {
    try {
      // Update books with missing genres
      const booksWithoutGenres = await this.bookModel
        .find({
          $or: [{ genres: { $exists: false } }, { genres: { $size: 0 } }],
        })
        .exec();

      let genreUpdatedCount = 0;
      for (const book of booksWithoutGenres) {
        const genres = this.getRandomGenres();
        await this.bookModel.updateOne({ _id: book._id }, { $set: { genres } });
        genreUpdatedCount++;
      }

      // Update books with missing discount information
      const booksWithoutDiscount = await this.bookModel
        .find({
          $or: [
            { originalPrice: { $exists: false } },
            { discountRate: { $exists: false } },
          ],
        })
        .exec();

      let discountUpdatedCount = 0;
      for (const book of booksWithoutDiscount) {
        const updates: any = {};

        // Set original price if missing
        if (!book.originalPrice) {
          if (book.price) {
            updates.originalPrice = book.price;
          } else {
            // Generate random price between $5-$50
            const randomPrice = Math.floor(Math.random() * 45) + 5;
            updates.originalPrice = randomPrice;
            updates.price = randomPrice;
          }
        }

        // Set discount rate if missing
        if (book.discountRate === undefined || book.discountRate === null) {
          // Random discount (0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50)
          const randomDiscount = Math.floor(Math.random() * 11) * 5;
          updates.discountRate = randomDiscount;

          // Update the price if there's a discount
          if (randomDiscount > 0) {
            const originalPrice = updates.originalPrice || book.originalPrice;
            updates.price = originalPrice * (1 - randomDiscount / 100);
          }
        }

        if (Object.keys(updates).length > 0) {
          await this.bookModel.updateOne({ _id: book._id }, { $set: updates });
          discountUpdatedCount++;
        }
      }

      return {
        success: true,
        genreUpdatedCount,
        discountUpdatedCount,
        message: 'Books updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private getRandomGenres(): string[] {
    const genreCount = Math.floor(Math.random() * 2) + 1; // 1-2 genres
    const assignedGenres: string[] = [];

    for (let i = 0; i < genreCount; i++) {
      const randomGenre =
        this.commonGenres[Math.floor(Math.random() * this.commonGenres.length)];
      if (!assignedGenres.includes(randomGenre)) {
        assignedGenres.push(randomGenre);
      }
    }

    return assignedGenres;
  }
}
