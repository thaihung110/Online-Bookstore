// MongoDB update script
// Run with: mongo mongodb://localhost:27017/online-bookstore update-books-direct.js

// List of common genres
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

// Function to assign random genres
function getRandomGenres() {
  const genreCount = Math.floor(Math.random() * 2) + 1; // 1-2 genres
  const assignedGenres = [];

  for (let i = 0; i < genreCount; i++) {
    const randomGenre =
      commonGenres[Math.floor(Math.random() * commonGenres.length)];
    if (!assignedGenres.includes(randomGenre)) {
      assignedGenres.push(randomGenre);
    }
  }

  return assignedGenres;
}

// Update books with missing genres
const booksWithoutGenres = db.books.find({
  $or: [{ genres: { $exists: false } }, { genres: { $size: 0 } }],
});

let genreUpdatedCount = 0;
booksWithoutGenres.forEach((book) => {
  db.books.updateOne(
    { _id: book._id },
    { $set: { genres: getRandomGenres() } },
  );
  genreUpdatedCount++;
});

print(`Updated ${genreUpdatedCount} books with missing genres`);

// Update books with missing discount information
let discountUpdatedCount = 0;

// Find books without originalPrice or discountRate
const booksWithoutDiscount = db.books.find({
  $or: [
    { originalPrice: { $exists: false } },
    { discountRate: { $exists: false } },
  ],
});

booksWithoutDiscount.forEach((book) => {
  const updates = {};

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
  if (!book.discountRate) {
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
    db.books.updateOne({ _id: book._id }, { $set: updates });
    discountUpdatedCount++;
  }
});

print(
  `Updated ${discountUpdatedCount} books with missing discount information`,
);
print('Database update completed successfully!');
