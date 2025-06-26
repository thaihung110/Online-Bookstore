import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  CircularProgress,
  Card,
  CardMedia,
  CardContent,
  Divider,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import BookIcon from "@mui/icons-material/Book";
import LocalLibraryIcon from "@mui/icons-material/LocalLibrary";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import EmojiObjectsIcon from "@mui/icons-material/EmojiObjects";
import MainLayout from "../components/layouts/MainLayout";
import BookCard from "../components/books/BookCard";
import {
  Book,
  getFeaturedBooks,
  getAllGenres,
  getRecommendedBookIds,
  getBooksByIds,
} from "../api/books";
import { getCurrentUser } from "../api/auth";
import { getRecommendedBooksByUsername } from "../api/books";

const FEATURED_GENRES = [
  "Fiction",
  "Non-Fiction",
  "Science Fiction",
  "Mystery",
  "Romance",
  "Biography",
  "Fantasy",
  "History",
  "Children",
];

const HomePage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  const [featuredBooks, setFeaturedBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [genres, setGenres] = useState<string[]>([]);
  const [loadingGenres, setLoadingGenres] = useState(false);
  const [recommendedBooks, setRecommendedBooks] = useState<Book[]>([]);
  const [loadingRecommended, setLoadingRecommended] = useState(false);
  const [errorRecommended, setErrorRecommended] = useState<string | null>(null);

  useEffect(() => {
    const loadFeaturedBooks = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log('[HomePage] Fetching featured books...');
        const books = await getFeaturedBooks(6); // Get 6 featured products
        console.log('[HomePage] Received featured books:', books);
        console.log('[HomePage] Number of books received:', books.length);
        books.forEach((book, index) => {
          console.log(`[HomePage] Book ${index + 1}:`, {
            id: book.id,
            title: book.title,
            productType: book.productType,
            price: book.price,
            originalPrice: book.originalPrice,
            author: book.author,
            artist: book.artist
          });
        });
        setFeaturedBooks(books);
      } catch (err) {
        console.error('[HomePage] Error loading featured products:', err);
        setError("Failed to load featured products");
      } finally {
        setIsLoading(false);
      }
    };

    loadFeaturedBooks();
  }, []);

  useEffect(() => {
    setLoadingGenres(true);
    getAllGenres()
      .then((allGenres) => {
        setGenres(allGenres);
      })
      .finally(() => setLoadingGenres(false));
  }, []);

  useEffect(() => {
    const fetchRecommendedBooks = async () => {
      setLoadingRecommended(true);
      setErrorRecommended(null);
      try {
        // Lấy username từ API profile
        const user = await getCurrentUser();
        console.log("[DEBUG] Current user from /auth/profile:", user);
        const username = user?.username; // Dùng username thay vì email
        console.log("[DEBUG] Username used for recommend API:", username);
        if (username) {
          const books = await getRecommendedBooksByUsername(username, 6);
          if (books && books.length > 0) {
            setRecommendedBooks(books);
            setLoadingRecommended(false);
            return;
          } else {
            setErrorRecommended("No recommendations found");
          }
        } else {
          setErrorRecommended("You need to login to get recommendations");
        }
      } catch (err) {
        setErrorRecommended("You need to login to get recommendations");
        console.error(err);
      } finally {
        setLoadingRecommended(false);
      }
    };
    fetchRecommendedBooks();
  }, []);

  // Lấy 7 genres nổi bật đầu tiên có trong data
  const featuredGenres = FEATURED_GENRES.filter((g) =>
    genres.includes(g)
  ).slice(0, 6);
  // Nếu chưa đủ 7, bổ sung các genres khác từ data (không trùng lặp)
  if (featuredGenres.length < 6) {
    const extra = genres
      .filter((g) => !featuredGenres.includes(g))
      .slice(0, 6 - featuredGenres.length);
    featuredGenres.push(...extra);
  }

  return (
    <MainLayout>
      {/* Hero Section */}
      <Box
        sx={{
          position: "relative",
          backgroundColor: "primary.dark",
          color: "#fff",
          mb: 8,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          backgroundImage: `linear-gradient(rgba(44, 62, 80, 0.8), rgba(44, 62, 80, 0.8)), url(https://source.unsplash.com/random/?bookstore,library)`,
          minHeight: { xs: "500px", md: "600px" },
          display: "flex",
          alignItems: "center",
          borderRadius: { xs: 0, md: 2 },
          overflow: "hidden",
          boxShadow: { xs: "none", md: "0 4px 20px rgba(0,0,0,0.1)" },
          mx: { xs: 0, md: 4 },
        }}
      >
        <Container
          maxWidth="lg"
          sx={{ position: "relative", py: 8, zIndex: 1 }}
        >
          <Box sx={{ maxWidth: "600px" }}>
            <Typography
              component="h1"
              variant="h2"
              color="inherit"
              gutterBottom
              sx={{
                fontFamily: "'Playfair Display', serif",
                fontWeight: 700,
                fontSize: { xs: "2.5rem", md: "3.5rem" },
                mb: 2,
              }}
            >
              Discover Your Next Favorite Book
            </Typography>
            <Typography
              variant="h5"
              color="inherit"
              paragraph
              sx={{
                fontWeight: 300,
                mb: 4,
                fontSize: { xs: "1.2rem", md: "1.5rem" },
              }}
            >
              Explore our curated collection of bestsellers, new releases, and
              timeless classics
            </Typography>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Button
                component={RouterLink}
                to="/books"
                variant="contained"
                size="large"
                startIcon={<BookIcon />}
                sx={{
                  py: 1.5,
                  px: 4,
                  backgroundColor: "secondary.main",
                  "&:hover": {
                    backgroundColor: "secondary.dark",
                  },
                }}
              >
                Browse Catalog
              </Button>
              <Button
                component={RouterLink}
                to="/books?category=New%20Releases"
                variant="outlined"
                size="large"
                sx={{
                  py: 1.5,
                  px: 4,
                  color: "white",
                  borderColor: "white",
                  "&:hover": {
                    borderColor: "white",
                    backgroundColor: "rgba(255,255,255,0.1)",
                  },
                }}
              >
                New Releases
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Promotion Banners */}
      <Container maxWidth="lg" sx={{ mb: 8, px: { xs: 2, md: 3 } }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", mx: -1.5 }}>
          <Box sx={{ width: { xs: "100%", md: "33.33%" }, p: 1.5 }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                borderRadius: 2,
                border: 1,
                borderColor: "divider",
                transition: "transform 0.3s, box-shadow 0.3s",
                "&:hover": {
                  transform: "translateY(-5px)",
                  boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
                },
              }}
            >
              <AutoStoriesIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h5" gutterBottom fontWeight={600}>
                Free Shipping
              </Typography>
              <Typography variant="body1" color="text.secondary">
                On all orders over $50
              </Typography>
            </Paper>
          </Box>
          <Box sx={{ width: { xs: "100%", md: "33.33%" }, p: 1.5 }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                borderRadius: 2,
                border: 1,
                borderColor: "divider",
                transition: "transform 0.3s, box-shadow 0.3s",
                "&:hover": {
                  transform: "translateY(-5px)",
                  boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
                },
              }}
            >
              <WhatshotIcon color="secondary" sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h5" gutterBottom fontWeight={600}>
                Special Discount
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Save 15% on your first order
              </Typography>
            </Paper>
          </Box>
          <Box sx={{ width: { xs: "100%", md: "33.33%" }, p: 1.5 }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                borderRadius: 2,
                border: 1,
                borderColor: "divider",
                transition: "transform 0.3s, box-shadow 0.3s",
                "&:hover": {
                  transform: "translateY(-5px)",
                  boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
                },
              }}
            >
              <EmojiObjectsIcon
                sx={{ fontSize: 48, mb: 2, color: "#f39c12" }}
              />
              <Typography variant="h5" gutterBottom fontWeight={600}>
                Recommendations
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Personalized book suggestions
              </Typography>
            </Paper>
          </Box>
        </Box>
      </Container>

      {/* Featured Products Section */}
      <Container maxWidth="lg" sx={{ mb: 8, px: { xs: 2, md: 3 } }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
          <LocalLibraryIcon color="primary" sx={{ fontSize: 32, mr: 2 }} />
          <Typography
            component="h2"
            variant="h4"
            gutterBottom
            sx={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 600,
              position: "relative",
              display: "inline-block",
              mb: 0,
            }}
          >
            Featured Products
            <Box
              sx={{
                position: "absolute",
                width: "40%",
                height: "3px",
                bottom: "-8px",
                left: "0",
                backgroundColor: "secondary.main",
              }}
            />
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            component={RouterLink}
            to="/books"
            variant="text"
            color="primary"
            sx={{ fontWeight: 500, display: { xs: "none", sm: "block" } }}
          >
            View All
          </Button>
        </Box>

        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ textAlign: "center", my: 4 }}>
            <Typography color="error">{error}</Typography>
            <Button variant="outlined" sx={{ mt: 2 }}>
              Try Again
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexWrap: "wrap", mx: -1.5 }}>
            {featuredBooks.map((book) => (
              <Box
                key={book.id}
                sx={{ width: { xs: "100%", sm: "50%", md: "33.33%" }, p: 1.5 }}
              >
                <BookCard book={book} />
              </Box>
            ))}
          </Box>
        )}

        <Box
          sx={{
            display: { xs: "flex", sm: "none" },
            justifyContent: "center",
            mt: 4,
          }}
        >
          <Button
            component={RouterLink}
            to="/books"
            variant="outlined"
            size="large"
          >
            View All Books
          </Button>
        </Box>
      </Container>

      {/* Recommended for you Section */}
      <Container maxWidth="lg" sx={{ mb: 8, px: { xs: 2, md: 3 } }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
          <WhatshotIcon color="secondary" sx={{ fontSize: 32, mr: 2 }} />
          <Typography
            component="h2"
            variant="h4"
            gutterBottom
            sx={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 600,
              position: "relative",
              display: "inline-block",
              mb: 0,
            }}
          >
            Recommended for you
            <Box
              sx={{
                position: "absolute",
                width: "40%",
                height: "3px",
                bottom: "-8px",
                left: "0",
                backgroundColor: "secondary.main",
              }}
            />
          </Typography>
        </Box>
        {loadingRecommended ? (
          <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
            <CircularProgress />
          </Box>
        ) : errorRecommended ? (
          <Box sx={{ textAlign: "center", my: 4 }}>
            <Typography color="error">{errorRecommended}</Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexWrap: "wrap", mx: -1.5 }}>
            {recommendedBooks.map((book) => (
              <Box
                key={book.id}
                sx={{ width: { xs: "100%", sm: "50%", md: "33.33%" }, p: 1.5 }}
              >
                <BookCard book={book} />
              </Box>
            ))}
          </Box>
        )}
      </Container>
    </MainLayout>
  );
};

export default HomePage;
