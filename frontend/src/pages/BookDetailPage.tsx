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
import BookmarkIcon from "@mui/icons-material/Bookmark";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import PaymentIcon from "@mui/icons-material/Payment";

import MainLayout from "../components/layouts/MainLayout";
import { useBookStore } from "../store/bookStore";
import { useCartStore } from "../store/cartStore";
import { useWishlistStore } from "../store/wishlistStore";
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
  const {
    addItemToWishlist,
    removeItemFromWishlist,
    isItemInWishlist,
    isLoading: wishlistLoading,
  } = useWishlistStore();

  useEffect(() => {
    if (id) {
      fetchBookById(id);
    }
    // Scroll to top when component mounts or ID changes
    window.scrollTo(0, 0);
  }, [id, fetchBookById]);

  const handleAddToCart = () => {
    if (currentBook) {
      addItem(currentBook.id, 1);
    }
  };

  // Adapter cho buyNow
  const addItemAdapter = (book: Book, quantity: number = 1) =>
    addItem(book.id, quantity);

  const handleBuyNow = async () => {
    if (currentBook) {
      try {
        // Nếu chưa có trong cart thì thêm vào
        if (!isInCart(currentBook.id)) {
          await addItemAdapter(currentBook, 1);
        }
        // Luôn set localStorage trước khi chuyển trang
        const selected = { [currentBook.id]: true };
        localStorage.setItem("cart-selected-items", JSON.stringify(selected));
        localStorage.setItem("cart-buynow-id", currentBook.id);
        navigate("/cart");
      } catch (error) {
        console.error("Error during buy now process:", error);
      }
    }
  };

  const handleToggleWishlist = async () => {
    if (currentBook) {
      try {
        if (isItemInWishlist(currentBook.id)) {
          await removeItemFromWishlist(currentBook.id);
        } else {
          await addItemToWishlist(currentBook);
        }
      } catch (err) {
        console.error("Failed to toggle wishlist item:", err);
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
                  <Button
                    variant="outlined"
                    color="secondary"
                    fullWidth
                    size="large"
                    startIcon={
                      isItemInWishlist(currentBook.id) ? (
                        <BookmarkIcon />
                      ) : (
                        <BookmarkBorderIcon />
                      )
                    }
                    onClick={handleToggleWishlist}
                    disabled={wishlistLoading || !currentBook}
                  >
                    {wishlistLoading
                      ? "Updating..."
                      : isItemInWishlist(currentBook.id)
                      ? "Remove from Wishlist"
                      : "Add to Wishlist"}
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
                    mb: 2,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 0.75,
                    alignItems: "center",
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mr: 0.5 }}
                  >
                    Categories:
                  </Typography>
                  {currentBook.genres.map((genre) => (
                    <Chip
                      key={genre}
                      label={genre}
                      component={RouterLink}
                      to={`/books?genres=${encodeURIComponent(genre)}`}
                      clickable
                      color="info"
                      variant="outlined"
                      size="small"
                    />
                  ))}
                </Box>
              )}

              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                sx={{ my: 2 }}
              >
                {currentBook.rating !== undefined && currentBook.rating > 0 && (
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Rating
                      value={currentBook.rating}
                      precision={0.5}
                      readOnly
                    />
                    <Typography
                      variant="body1"
                      sx={{ ml: 1, color: "text.secondary" }}
                    >
                      {(currentBook.rating || 0).toFixed(1)}/5
                    </Typography>
                  </Box>
                )}
                {currentBook.rating !== undefined &&
                currentBook.rating > 0 &&
                currentBook.price ? (
                  <Divider orientation="vertical" flexItem />
                ) : null}

                {/* Hiển thị giá và discount */}
                <Box>
                  {isOnSale ? (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography
                        variant="h4"
                        color="error.main"
                        sx={{ fontWeight: "bold" }}
                      >
                        ${(priceUsd || 0).toFixed(2)}
                      </Typography>

                      <Chip
                        label={`-${currentBook.discountRate}%`}
                        color="error"
                        size="small"
                        sx={{ fontWeight: "bold" }}
                      />

                      <Typography
                        variant="h6"
                        color="text.secondary"
                        sx={{
                          textDecoration: "line-through",
                          fontWeight: "medium",
                        }}
                      >
                        ${(originalPriceUsd || 0).toFixed(2)}
                      </Typography>
                    </Stack>
                  ) : (
                    <Typography
                      variant="h4"
                      color="primary.main"
                      sx={{ fontWeight: "bold" }}
                    >
                      ${(priceUsd || 0).toFixed(2)}
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
