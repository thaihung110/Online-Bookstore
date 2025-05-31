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
import { Book, getFeaturedBooks, getAllGenres } from "../api/books";

const FEATURED_GENRE_IMAGES: Record<string, string> = {
  Fiction:
    "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=80", // Old books on a wooden shelf
  "Non-Fiction":
    "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80", // Stack of books on white table
  "Science Fiction":
    "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80", // Futuristic city/space
  Mystery:
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80", // Foggy forest, mystery
  Romance:
    "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=400&q=80", // Book with heart-shaped pages
  Biography:
    "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=400&q=80", // Person reading book
  Fantasy:
    "https://images.unsplash.com/photo-1503676382389-4809596d5290?auto=format&fit=crop&w=400&q=80", // Book with magical lights
};

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

  useEffect(() => {
    const loadFeaturedBooks = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const books = await getFeaturedBooks(6); // Get 6 featured books
        setFeaturedBooks(books);
      } catch (err) {
        setError("Failed to load featured books");
        console.error(err);
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

      {/* Featured Books Section */}
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
            Featured Books
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

      {/* Categories Section */}
      <Box sx={{ bgcolor: "background.paper", py: 8, mb: 4 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
            <BookIcon color="primary" sx={{ fontSize: 32, mr: 2 }} />
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
              Browse by Category
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
          {loadingGenres ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexWrap: "wrap", mx: -1 }}>
              {featuredGenres.map((genre) => {
                // Lấy ảnh minh hoạ: ưu tiên mapping, nếu không có thì tạo link Unsplash theo tên genre
                const img =
                  FEATURED_GENRE_IMAGES[genre] ||
                  `https://source.unsplash.com/random/400x300/?${encodeURIComponent(
                    genre
                  )},book`;
                return (
                  <Box
                    key={genre}
                    sx={{
                      width: { xs: "50%", sm: "33.33%", md: "16.66%" },
                      p: 1,
                    }}
                  >
                    <Card
                      component={RouterLink}
                      to={`/books?genres=${encodeURIComponent(genre)}`}
                      sx={{
                        height: 150,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-end",
                        position: "relative",
                        textDecoration: "none",
                        borderRadius: 2,
                        overflow: "hidden",
                        transition: "transform 0.3s",
                        "&:hover": {
                          transform: "scale(1.03)",
                        },
                      }}
                    >
                      <CardMedia
                        component="img"
                        image={img}
                        alt={genre}
                        sx={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                      <Box
                        sx={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          background:
                            "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0) 100%)",
                        }}
                      />
                      <CardContent
                        sx={{ position: "relative", color: "white", p: 2 }}
                      >
                        <Typography variant="h6" component="div">
                          {genre}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Box>
                );
              })}
            </Box>
          )}
        </Container>
      </Box>

      {/* Newsletter Section */}
      <Container maxWidth="md" sx={{ mb: 8, px: { xs: 2, md: 3 } }}>
        <Paper
          sx={{
            p: { xs: 3, md: 6 },
            backgroundColor: "primary.main",
            color: "white",
            borderRadius: 2,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: 0,
              right: 0,
              width: { xs: "100px", md: "200px" },
              height: { xs: "100px", md: "200px" },
              background: "rgba(255,255,255,0.1)",
              borderRadius: "50%",
              transform: "translate(30%, -30%)",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: { xs: "80px", md: "150px" },
              height: { xs: "80px", md: "150px" },
              background: "rgba(255,255,255,0.1)",
              borderRadius: "50%",
              transform: "translate(-30%, 30%)",
            }}
          />
          <Box
            sx={{
              position: "relative",
              zIndex: 1,
              textAlign: "center",
              maxWidth: "600px",
              mx: "auto",
            }}
          >
            <Typography variant="h4" gutterBottom fontWeight={600}>
              Stay Updated
            </Typography>
            <Typography variant="body1" paragraph sx={{ mb: 4, opacity: 0.9 }}>
              Subscribe to our newsletter and be the first to know about new
              releases, special promotions, and exclusive content.
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              size="large"
              fullWidth
              sx={{ py: 1.5 }}
            >
              Subscribe Now
            </Button>
          </Box>
        </Paper>
      </Container>
    </MainLayout>
  );
};

export default HomePage;
