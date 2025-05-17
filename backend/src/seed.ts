import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb://root:rootpassword@localhost:27017/bookstore?authSource=admin';

// Sample book data
const sampleBooks = [
  {
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    description:
      'A novel of America in the 1920s, exploring themes of decadence, idealism, social upheaval, and excess.',
    price: 12.99,
    stock: 25,
    isbn: '9780743273565',
    publisher: 'Scribner',
    publicationYear: 1925,
    genres: ['Fiction', 'Classic'],
    coverImage:
      'https://m.media-amazon.com/images/I/71FTb9X6wsL._AC_UF1000,1000_QL80_.jpg',
    isAvailableForPreOrder: false,
    discountPercentage: 0,
    isFeatured: true,
    ratings: 450,
    totalRatings: 100,
  },
  {
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    description:
      'The unforgettable novel of a childhood in a sleepy Southern town and the crisis of conscience that rocked it.',
    price: 14.99,
    stock: 30,
    isbn: '9780061120084',
    publisher: 'HarperPerennial Modern Classics',
    publicationYear: 1960,
    genres: ['Fiction', 'Classic'],
    coverImage:
      'https://m.media-amazon.com/images/I/71FxgtFKcQL._AC_UF1000,1000_QL80_.jpg',
    isAvailableForPreOrder: false,
    discountPercentage: 5,
    isFeatured: true,
    ratings: 490,
    totalRatings: 100,
  },
  {
    title: '1984',
    author: 'George Orwell',
    description:
      'A dystopian novel set in a totalitarian society, exploring themes of mass surveillance and government control.',
    price: 10.99,
    stock: 15,
    isbn: '9780451524935',
    publisher: 'Signet Classic',
    publicationYear: 1949,
    genres: ['Fiction', 'Dystopian'],
    coverImage:
      'https://m.media-amazon.com/images/I/71kxa1-0mfL._AC_UF1000,1000_QL80_.jpg',
    isAvailableForPreOrder: false,
    discountPercentage: 0,
    isFeatured: true,
    ratings: 470,
    totalRatings: 100,
  },
  {
    title: 'The Hobbit',
    author: 'J.R.R. Tolkien',
    description:
      'A fantasy novel about the adventures of a hobbit, Bilbo Baggins, who embarks on a quest to reclaim treasure guarded by a dragon.',
    price: 13.99,
    stock: 20,
    isbn: '9780547928227',
    publisher: 'Houghton Mifflin Harcourt',
    publicationYear: 1937,
    genres: ['Fiction', 'Fantasy'],
    coverImage:
      'https://m.media-amazon.com/images/I/710+HcoP38L._AC_UF1000,1000_QL80_.jpg',
    isAvailableForPreOrder: false,
    discountPercentage: 0,
    isFeatured: true,
    ratings: 480,
    totalRatings: 100,
  },
  {
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    description:
      'A romantic novel of manners that satirizes issues of class, marriage, and misconceptions.',
    price: 9.99,
    stock: 18,
    isbn: '9780141439518',
    publisher: 'Penguin Classics',
    publicationYear: 1813,
    genres: ['Fiction', 'Romance', 'Classic'],
    coverImage:
      'https://m.media-amazon.com/images/I/71Q1tPupKjL._AC_UF1000,1000_QL80_.jpg',
    isAvailableForPreOrder: false,
    discountPercentage: 0,
    isFeatured: true,
    ratings: 460,
    totalRatings: 100,
  },
  {
    title: 'The Catcher in the Rye',
    author: 'J.D. Salinger',
    description:
      'A novel about teenage alienation and angst, featuring the iconic character Holden Caulfield.',
    price: 11.99,
    stock: 22,
    isbn: '9780316769488',
    publisher: 'Little, Brown and Company',
    publicationYear: 1951,
    genres: ['Fiction', 'Coming-of-age'],
    coverImage:
      'https://m.media-amazon.com/images/I/81OthjkJBuL._AC_UF1000,1000_QL80_.jpg',
    isAvailableForPreOrder: false,
    discountPercentage: 0,
    isFeatured: false,
    ratings: 435,
    totalRatings: 100,
  },
  {
    title: "Harry Potter and the Sorcerer's Stone",
    author: 'J.K. Rowling',
    description:
      'The first novel in the Harry Potter series, following the life of a young wizard, Harry Potter, and his friends.',
    price: 15.99,
    stock: 35,
    isbn: '9780590353427',
    publisher: 'Scholastic',
    publicationYear: 1997,
    genres: ['Fiction', 'Fantasy', 'Young Adult'],
    coverImage:
      'https://m.media-amazon.com/images/I/81iqZ2HHD-L._AC_UF1000,1000_QL80_.jpg',
    isAvailableForPreOrder: false,
    discountPercentage: 0,
    isFeatured: true,
    ratings: 495,
    totalRatings: 100,
  },
  {
    title: 'The Lord of the Rings',
    author: 'J.R.R. Tolkien',
    description:
      'An epic fantasy novel that follows the quest to destroy the One Ring, a powerful artifact created by the Dark Lord Sauron.',
    price: 29.99,
    stock: 15,
    isbn: '9780618640157',
    publisher: 'Houghton Mifflin Harcourt',
    publicationYear: 1954,
    genres: ['Fiction', 'Fantasy'],
    coverImage:
      'https://m.media-amazon.com/images/I/71jLBXtWJWL._AC_UF1000,1000_QL80_.jpg',
    isAvailableForPreOrder: false,
    discountPercentage: 10,
    isFeatured: false,
    ratings: 485,
    totalRatings: 100,
  },
  {
    title: 'The Da Vinci Code',
    author: 'Dan Brown',
    description:
      'A mystery thriller novel that follows symbologist Robert Langdon as he investigates a murder in the Louvre Museum.',
    price: 16.99,
    stock: 25,
    isbn: '9780307474278',
    publisher: 'Anchor',
    publicationYear: 2003,
    genres: ['Fiction', 'Thriller', 'Mystery'],
    coverImage:
      'https://m.media-amazon.com/images/I/91Q5dCR6cFL._AC_UF1000,1000_QL80_.jpg',
    isAvailableForPreOrder: false,
    discountPercentage: 0,
    isFeatured: false,
    ratings: 430,
    totalRatings: 100,
  },
  {
    title: 'The Alchemist',
    author: 'Paulo Coelho',
    description:
      'A philosophical novel about a young Andalusian shepherd who dreams of finding treasure at the Egyptian pyramids.',
    price: 14.99,
    stock: 28,
    isbn: '9780062315007',
    publisher: 'HarperOne',
    publicationYear: 1988,
    genres: ['Fiction', 'Philosophy', 'Fantasy'],
    coverImage: 'https://m.media-amazon.com/images/I/51Z0nLAfLmL.jpg',
    isAvailableForPreOrder: false,
    discountPercentage: 0,
    isFeatured: true,
    ratings: 475,
    totalRatings: 100,
  },
];

// Function to seed the database
async function seedDatabase() {
  let client;
  try {
    console.log('Connecting to MongoDB...');
    client = new MongoClient(MONGO_URI);
    await client.connect();
    console.log('Connected to MongoDB successfully');

    const db = client.db();
    const booksCollection = db.collection('books');

    // Check if books collection already has data
    const count = await booksCollection.countDocuments();
    if (count > 0) {
      console.log(
        `Books collection already has ${count} documents. Skipping seed.`,
      );
      return;
    }

    // Insert sample books
    console.log('Inserting sample books...');
    const result = await booksCollection.insertMany(sampleBooks);
    console.log(
      `Successfully inserted ${result.insertedCount} books into the database`,
    );
  } catch (error) {
    console.error('Error seeding the database:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('Database connection closed');
    }
  }
}

// Run the seed function
seedDatabase().catch(console.error);
