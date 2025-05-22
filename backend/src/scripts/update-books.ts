import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../app.module';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Book, BookDocument } from '../books/schemas/book.schema';

export class BooksUpdater {
  private readonly logger = new Logger(BooksUpdater.name);

  constructor(@InjectModel(Book.name) private bookModel: Model<BookDocument>) {}

  async updateBooks() {
    try {
      this.logger.log('Starting book database update...');

      // Get all books
      const books = await this.bookModel.find().exec();
      this.logger.log(`Found ${books.length} books to update`);

      // Common genres to ensure proper data
      const commonGenres = [
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

      let updatedCount = 0;

      for (const book of books) {
        let needsUpdate = false;
        const updates: any = {};

        // Ensure each book has genres
        if (!book.genres || book.genres.length === 0) {
          // Assign 1-2 random genres
          const genreCount = Math.floor(Math.random() * 2) + 1;
          const assignedGenres: string[] = [];

          for (let i = 0; i < genreCount; i++) {
            const randomGenre =
              commonGenres[Math.floor(Math.random() * commonGenres.length)];
            if (!assignedGenres.includes(randomGenre)) {
              assignedGenres.push(randomGenre);
            }
          }

          updates.genres = assignedGenres;
          needsUpdate = true;
        }

        // Ensure discount information is set
        if (book.originalPrice === undefined || book.originalPrice === null) {
          // If original price is missing but price exists, set original price equal to price
          if (book.price) {
            updates.originalPrice = book.price;
            needsUpdate = true;
          } else {
            // Generate a random price between $5 and $50
            const randomPrice = Math.floor(Math.random() * 45) + 5;
            updates.originalPrice = randomPrice;
            updates.price = randomPrice;
            needsUpdate = true;
          }
        }

        // Ensure discount rate is set
        if (book.discountRate === undefined || book.discountRate === null) {
          // Set a random discount rate (0% - 50%)
          const randomDiscount = Math.floor(Math.random() * 11) * 5; // 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50
          updates.discountRate = randomDiscount;
          needsUpdate = true;

          // If discount rate is > 0, update the price
          if (randomDiscount > 0 && updates.originalPrice) {
            updates.price = updates.originalPrice * (1 - randomDiscount / 100);
          } else if (randomDiscount > 0 && book.originalPrice) {
            updates.price = book.originalPrice * (1 - randomDiscount / 100);
          }
        }

        // Update the book if changes are needed
        if (needsUpdate) {
          await this.bookModel.updateOne({ _id: book._id }, { $set: updates });
          updatedCount++;
        }
      }

      this.logger.log(`Updated ${updatedCount} books successfully`);
      return { success: true, updatedCount };
    } catch (error) {
      this.logger.error(`Error updating books: ${error.message}`, error.stack);
      return { success: false, error: error.message };
    }
  }
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const booksUpdater = app.get(BooksUpdater);
    const result = await booksUpdater.updateBooks();
    console.log('Update completed:', result);
  } catch (error) {
    console.error('Update failed:', error);
  } finally {
    await app.close();
  }
}

// Run the script if it's being executed directly
if (require.main === module) {
  bootstrap();
}
