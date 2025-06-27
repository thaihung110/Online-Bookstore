import React, { useEffect, useState } from "react";
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  Rating,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  Stack,
  Link as MuiLink,
} from "@mui/material";
import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";

import PaymentIcon from "@mui/icons-material/Payment";

import MainLayout from "../components/layouts/MainLayout";
import { useBookStore } from "../store/bookStore";
import { useCartStore } from "../store/cartStore";

import { buyNow } from "../utils/checkout";
import { Book } from "../api/books";

const BookDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();

  const {
    currentBook,
    fetchBookById,
    isLoading: bookLoading,
    error: bookError,
  } = useBookStore();
  const { addItem, isInCart } = useCartStore();


  useEffect(() => {
    if (id) {
      fetchBookById(id);
    }
    // Scroll to top when component mounts or ID changes
    window.scrollTo(0, 0);
  }, [id, fetchBookById]);

  const handleAddToCart = () => {
    if (currentBook) {
      const bookId = currentBook._id || currentBook.id; // Use MongoDB _id for backend
      console.log('[BookDetailPage] Adding to cart with bookId:', bookId, 'book:', currentBook);
      addItem(bookId, 1);
    }
  };

  // Adapter cho buyNow
  const addItemAdapter = (book: Book, quantity: number = 1) => {
    const bookId = book._id || book.id; // Use MongoDB _id for backend
    console.log('[BookDetailPage] Buy now with bookId:', bookId, 'book:', book);
    return addItem(bookId, quantity);
  };

  const handleBuyNow = async () => {
    if (currentBook) {
      try {
        // Nếu chưa có trong cart thì thêm vào
        const frontendId = currentBook.id; // Use frontend id for isInCart check
        if (!isInCart(frontendId)) {
          await addItemAdapter(currentBook, 1);
        }
        // Luôn set localStorage trước khi chuyển trang
        const selected = { [frontendId]: true };
        localStorage.setItem("cart-selected-items", JSON.stringify(selected));
        localStorage.setItem("cart-buynow-id", frontendId);
        navigate("/cart");
      } catch (error) {
        console.error("Error during buy now process:", error);
      }
    }
  };



  const handleGoBack = () => {
    navigate(-1);
  };

  if (bookLoading) {
    return (
      <MainLayout>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "calc(100vh - 200px)",
            }}
          >
            <CircularProgress size={60} />
          </Box>
        </Container>
      </MainLayout>
    );
  }

  if (bookError || !currentBook) {
    return (
      <MainLayout>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ my: 4 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={handleGoBack}
              sx={{ mb: 2 }}
            >
              Back to Results
            </Button>
            <Alert severity="error" sx={{ mt: 2 }}>
              {bookError ||
                "Sorry, the book you are looking for could not be found."}
            </Alert>
          </Box>
        </Container>
      </MainLayout>
    );
  }

  // Log thông tin sách để debug
  console.log("Book detail data:", currentBook);

  // Placeholder image if no cover is available
  const coverImage =
    currentBook.coverImage ||
    "https://via.placeholder.com/400x600?text=No+Image+Available";

  // Kiểm tra xem sách có đang giảm giá không với xử lý an toàn
  const hasDiscountRate =
    currentBook.discountRate !== undefined && currentBook.discountRate !== null;
  const isOnSale = hasDiscountRate && currentBook.discountRate > 0;

  // Đảm bảo có originalPrice hoặc fallback về price
  const originalPrice =
    currentBook.originalPrice !== undefined
      ? currentBook.originalPrice
      : currentBook.price;

  // Debug: Log giá trị đầu vào
  console.log(
    "BookDetailPage:",
    currentBook.title,
    "price:",
    currentBook.price,
    "originalPrice:",
    originalPrice
  );
  // Không chuyển đổi giá nữa, chỉ hiển thị trực tiếp
  const priceUsd = currentBook.price;
  const originalPriceUsd = originalPrice;

  // Helper safe format
  const safeToFixed = (val: any, digits = 2) =>
    typeof val === "number" && !isNaN(val) ? val.toFixed(digits) : "N/A";

  return (
    <MainLayout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleGoBack}
          sx={{ mb: 2, alignSelf: "flex-start" }}
        >
          Back to Results
        </Button>

        <Paper elevation={3} sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
          <Box
            sx={{ display: "flex", flexWrap: "wrap", gap: { xs: 3, md: 5 } }}
          >
            <Box sx={{ width: { xs: "100%", md: "30%" } }}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  position: "sticky",
                  top: 100,
                }}
              >
                <Box
                  component="img"
                  src={coverImage}
                  alt={currentBook.title}
                  sx={{
                    width: "100%",
                    maxWidth: 320,
                    height: "auto",
                    objectFit: "contain",
                    borderRadius: 2,
                    boxShadow: theme.shadows[4],
                    mb: 3,
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                />
                <Stack spacing={1.5} sx={{ width: "100%", maxWidth: 300 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="large"
                    startIcon={<ShoppingCartIcon />}
                    onClick={handleAddToCart}
                    disabled={isInCart(currentBook.id)}
                  >
                    {isInCart(currentBook.id)
                      ? "Already in Cart"
                      : "Add to Cart"}
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    fullWidth
                    size="large"
                    startIcon={<PaymentIcon />}
                    onClick={handleBuyNow}
                  >
                    Buy Now
                  </Button>

                </Stack>
              </Box>
            </Box>

            <Box sx={{ width: { xs: "100%", md: "65%" } }}>
              <Typography
                variant="h3"
                component="h1"
                gutterBottom
                sx={{ fontWeight: 700, lineHeight: 1.2 }}
              >
                {currentBook.title}
              </Typography>
              <Typography variant="h5" color="text.secondary" sx={{ mb: 1 }}>
                By:{" "}
                <MuiLink
                  component={RouterLink}
                  to={`/books?author=${encodeURIComponent(currentBook.author)}`}
                  underline="hover"
                  color="inherit"
                >
                  {currentBook.author}
                </MuiLink>
              </Typography>

              {currentBook.genres && currentBook.genres.length > 0 && (
                <Box
                  sx={{
                    mb: 3,
                    p: 2,
                    backgroundColor: "grey.50",
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: "grey.200",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    color="text.primary"
                    sx={{ mb: 1, fontWeight: 600 }}
                  >
                    Genres
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 0.75,
                    }}
                  >
                    {currentBook.genres.map((genre) => (
                      <Chip
                        key={genre}
                        label={genre}
                        component={RouterLink}
                        to={`/books?genres=${encodeURIComponent(genre)}`}
                        clickable
                        color="primary"
                        variant="outlined"
                        size="small"
                        sx={{ fontWeight: 500 }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                alignItems={{ xs: "stretch", sm: "center" }}
                sx={{ my: 3 }}
              >
                {currentBook.rating !== undefined &&
                  currentBook.rating !== null &&
                  !isNaN(currentBook.rating) &&
                  currentBook.rating > 0 && (
                    <Box 
                      sx={{ 
                        display: "flex", 
                        alignItems: "center",
                        p: 2,
                        backgroundColor: "primary.50",
                        borderRadius: 1,
                        border: "1px solid",
                        borderColor: "primary.200",
                      }}
                    >
                      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                        <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                          <Rating
                            value={currentBook.rating}
                            precision={0.5}
                            readOnly
                            size="medium"
                          />
                          <Typography
                            variant="h6"
                            sx={{ ml: 1, color: "text.primary", fontWeight: 600 }}
                          >
                            {safeToFixed(currentBook.rating, 1)}
                          </Typography>
                        </Box>
                        {currentBook.totalRatings && currentBook.totalRatings > 0 && (
                          <Typography
                            variant="body2"
                            sx={{ color: "text.secondary" }}
                          >
                            Based on {currentBook.totalRatings} {currentBook.totalRatings === 1 ? 'review' : 'reviews'}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  )}
                {currentBook.rating !== undefined &&
                currentBook.rating !== null &&
                !isNaN(currentBook.rating) &&
                currentBook.price ? (
                  <Divider 
                    orientation="vertical" 
                    flexItem 
                    sx={{ display: { xs: "none", sm: "block" } }}
                  />
                ) : null}

                {/* Hiển thị giá và discount */}
                <Box
                  sx={{
                    p: 2,
                    backgroundColor: isOnSale ? "error.50" : "success.50",
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: isOnSale ? "error.200" : "success.200",
                    minWidth: { sm: 200 },
                  }}
                >
                  {isOnSale ? (
                    <Stack direction="column" spacing={1} alignItems="flex-start">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography
                          variant="h4"
                          color="error.main"
                          sx={{ fontWeight: "bold" }}
                        >
                          ${safeToFixed(priceUsd, 2)}
                        </Typography>

                        <Chip
                          label={`-${currentBook.discountRate}%`}
                          color="error"
                          size="small"
                          sx={{ fontWeight: "bold" }}
                        />
                      </Stack>
                      
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          textDecoration: "line-through",
                          fontWeight: "medium",
                        }}
                      >
                        Original: ${safeToFixed(originalPriceUsd, 2)}
                      </Typography>
                    </Stack>
                  ) : (
                    <Typography
                      variant="h4"
                      color="success.main"
                      sx={{ fontWeight: "bold" }}
                    >
                      ${safeToFixed(priceUsd, 2)}
                    </Typography>
                  )}
                </Box>
              </Stack>

              <Divider sx={{ my: 3 }} />

              <Typography
                variant="h6"
                gutterBottom
                sx={{ fontWeight: "medium" }}
              >
                Book Description
              </Typography>
              <Box
                sx={{
                  maxHeight: 300,
                  overflowY: "auto",
                  pr: 1,
                  mb: 3,
                  typography: "body1",
                  lineHeight: 1.75,
                  whiteSpace: "pre-wrap",
                }}
              >
                {currentBook.description || "No description available."}
              </Box>

              <Divider sx={{ my: 3 }} />

              <Typography
                variant="h6"
                gutterBottom
                sx={{ fontWeight: "medium" }}
              >
                Product Details
              </Typography>
              <Box sx={{ maxWidth: { xs: "100%", sm: 600 } }}>
                {[
                  { label: "Publisher", value: currentBook.publisher },
                  {
                    label: "Published Date",
                    value: currentBook.publishedDate
                      ? new Date(currentBook.publishedDate).toLocaleDateString()
                      : `${currentBook.publicationYear}`,
                  },
                  { label: "Language", value: currentBook.language || "English" },
                  { label: "ISBN-13", value: currentBook.isbn },
                  { label: "Pages", value: currentBook.pageCount || "N/A" },
                ].map((detail) =>
                  detail.value ? (
                    <Box
                      key={detail.label}
                      sx={{
                        display: "flex",
                        mb: 1,
                        "& > :first-of-type": {
                          width: { xs: "40%", sm: "30%" },
                          color: "text.secondary",
                          fontWeight: "medium",
                        },
                      }}
                    >
                      <Typography variant="body2">{detail.label}</Typography>
                      <Typography variant="body2">
                        {String(detail.value)}
                      </Typography>
                    </Box>
                  ) : null
                )}
              </Box>
            </Box>
          </Box>
        </Paper>
      </Container>
    </MainLayout>
  );
};

export default BookDetailPage;
