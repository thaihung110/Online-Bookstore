import React, { useEffect, useState } from "react";
import {
  Container,
  Grid,
  Typography,
  Box,
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

import MainLayout from "../components/layouts/MainLayout";
import { useBookStore } from "../store/bookStore";
import { useCartStore } from "../store/cartStore";
import { useWishlistStore } from "../store/wishlistStore";

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
      addItem(currentBook);
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

  // Placeholder image if no cover is available
  const coverImage =
    currentBook.coverImage ||
    "https://via.placeholder.com/400x600?text=No+Image+Available";

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
          <Grid container spacing={{ xs: 3, md: 5 }}>
            <Grid size={{ xs: 12, md: 4 }}>
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
            </Grid>

            <Grid size={{ xs: 12, md: 8 }}>
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

              {currentBook.category && currentBook.category.length > 0 && (
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
                  {currentBook.category.map((cat) => (
                    <Chip
                      key={cat}
                      label={cat}
                      component={RouterLink}
                      to={`/books?category=${encodeURIComponent(cat)}`}
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
                      {currentBook.rating.toFixed(1)}/5
                    </Typography>
                  </Box>
                )}
                {currentBook.rating !== undefined &&
                currentBook.rating > 0 &&
                currentBook.price ? (
                  <Divider orientation="vertical" flexItem />
                ) : null}
                <Typography
                  variant="h4"
                  color="primary.main"
                  sx={{ fontWeight: "bold" }}
                >
                  ${currentBook.price.toFixed(2)}
                </Typography>
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
              <Grid
                container
                spacing={1}
                sx={{ maxWidth: { xs: "100%", sm: 600 } }}
              >
                {[
                  { label: "Publisher", value: currentBook.publisher },
                  {
                    label: "Published Date",
                    value: currentBook.publishedDate
                      ? new Date(currentBook.publishedDate).toLocaleDateString()
                      : "N/A",
                  },
                  { label: "ISBN-13", value: currentBook.isbn },
                  { label: "Pages", value: currentBook.pageCount },
                ].map((detail) =>
                  detail.value ? (
                    <React.Fragment key={detail.label}>
                      <Grid size={{ xs: 5, sm: 3 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontWeight: "medium" }}
                        >
                          {detail.label}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 7, sm: 9 }}>
                        <Typography variant="body2">
                          {String(detail.value)}
                        </Typography>
                      </Grid>
                    </React.Fragment>
                  ) : null
                )}
              </Grid>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </MainLayout>
  );
};

export default BookDetailPage;
