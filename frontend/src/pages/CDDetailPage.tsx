import React, { useEffect } from "react";
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
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
import AlbumIcon from "@mui/icons-material/Album";

import MainLayout from "../components/layouts/MainLayout";
import { useCDStore } from "../store/cdStore";
import { useCartStore } from "../store/cartStore";

const CDDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();

  const {
    selectedCD,
    fetchCDById,
    isLoading: cdLoading,
    error: cdError,
  } = useCDStore();
  const { addItem, isInCart } = useCartStore();

  useEffect(() => {
    if (id) {
      fetchCDById(id);
    }
    // Scroll to top when component mounts or ID changes
    window.scrollTo(0, 0);
  }, [id, fetchCDById]);

  const handleAddToCart = () => {
    if (selectedCD) {
      const productId = selectedCD._id || selectedCD.id; // Use MongoDB _id for backend
      console.log('[CDDetailPage] Adding to cart with productId:', productId, 'cd:', selectedCD);
      addItem(productId, 1);
    }
  };

  const handleBuyNow = async () => {
    if (selectedCD) {
      try {
        // If not in cart, add it first
        const frontendId = selectedCD.id; // Use frontend id for isInCart check
        if (!isInCart(frontendId)) {
          const productId = selectedCD._id || selectedCD.id;
          await addItem(productId, 1);
        }
        // Set localStorage before navigating to cart
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

  if (cdLoading) {
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

  if (cdError || !selectedCD) {
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
              {cdError ||
                "Sorry, the CD you are looking for could not be found."}
            </Alert>
          </Box>
        </Container>
      </MainLayout>
    );
  }

  // Log CD data for debug
  console.log("CD detail data:", selectedCD);

  // Placeholder image if no cover is available
  const coverImage =
    selectedCD.coverImage ||
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iODAiIGZpbGw9IiNDQ0NDQ0MiLz4KPGNpcmNsZSBjeD0iMTAwIiBjeT0iMTAwIiByPSIxNSIgZmlsbD0iI0Y1RjVGNSIvPgo8dGV4dCB4PSIxMDAiIHk9IjE1MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OTk5OSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIj5ObyBJbWFnZTwvdGV4dD4KPC9zdmc+";

  // Check if CD is on sale
  const hasDiscountRate =
    selectedCD.discountRate !== undefined && selectedCD.discountRate !== null;
  const isOnSale = hasDiscountRate && selectedCD.discountRate > 0;

  // Ensure original price or fallback to price
  const originalPrice =
    selectedCD.originalPrice !== undefined
      ? selectedCD.originalPrice
      : selectedCD.price;

  // Debug: Log price values
  console.log(
    "CDDetailPage:",
    selectedCD.title,
    "price:",
    selectedCD.price,
    "originalPrice:",
    originalPrice
  );

  const priceUsd = selectedCD.price;
  const originalPriceUsd = originalPrice;

  // Helper safe format
  const safeToFixed = (val: any, digits = 2) =>
    typeof val === "number" && !isNaN(val) ? val.toFixed(digits) : "N/A";

  // Format release date
  const formatReleaseDate = (date: string | Date) => {
    try {
      return new Date(date).toLocaleDateString();
    } catch {
      return String(date);
    }
  };

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
                  alt={selectedCD.title}
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
                    disabled={isInCart(selectedCD.id)}
                  >
                    {isInCart(selectedCD.id)
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
                {selectedCD.title}
              </Typography>
              <Typography variant="h5" color="text.secondary" sx={{ mb: 1 }}>
                By:{" "}
                <MuiLink
                  component={RouterLink}
                  to={`/cds?artist=${encodeURIComponent(selectedCD.artist)}`}
                  underline="hover"
                  color="inherit"
                >
                  {selectedCD.artist}
                </MuiLink>
              </Typography>

              <Typography variant="h6" color="text.secondary" sx={{ mb: 2, fontStyle: "italic" }}>
                Album: {selectedCD.albumTitle}
              </Typography>

              {selectedCD.category && (
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
                    Category:
                  </Typography>
                  <Chip
                    label={selectedCD.category}
                    component={RouterLink}
                    to={`/cds?categories=${encodeURIComponent(selectedCD.category)}`}
                    clickable
                    color="info"
                    variant="outlined"
                    size="small"
                    icon={<AlbumIcon />}
                  />
                </Box>
              )}

              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                sx={{ my: 2 }}
              >
                {/* Display price and discount */}
                <Box>
                  {isOnSale ? (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography
                        variant="h4"
                        color="error.main"
                        sx={{ fontWeight: "bold" }}
                      >
                        ${safeToFixed(priceUsd, 2)}
                      </Typography>

                      <Chip
                        label={`-${selectedCD.discountRate}%`}
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
                        ${safeToFixed(originalPriceUsd, 2)}
                      </Typography>
                    </Stack>
                  ) : (
                    <Typography
                      variant="h4"
                      color="primary.main"
                      sx={{ fontWeight: "bold" }}
                    >
                      ${safeToFixed(priceUsd, 2)}
                    </Typography>
                  )}
                </Box>
              </Stack>

              {/* Rush delivery indicator */}
              {selectedCD.isAvailableRush && (
                <Box sx={{ mt: 2, mb: 1 }}>
                  <Chip
                    label="🚀 Rush Delivery Available - 2 Hour Delivery in Hanoi"
                    color="warning"
                    variant="outlined"
                    sx={{
                      fontWeight: "bold",
                      fontSize: "0.9rem",
                      py: 1,
                      px: 2,
                    }}
                  />
                </Box>
              )}

              <Divider sx={{ my: 3 }} />

              <Typography
                variant="h6"
                gutterBottom
                sx={{ fontWeight: "medium" }}
              >
                Album Description
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
                {selectedCD.description || "No description available."}
              </Box>

              <Divider sx={{ my: 3 }} />

              <Typography
                variant="h6"
                gutterBottom
                sx={{ fontWeight: "medium" }}
              >
                Track List
              </Typography>
              <Box
                sx={{
                  maxHeight: 200,
                  overflowY: "auto",
                  pr: 1,
                  mb: 3,
                  typography: "body1",
                  lineHeight: 1.75,
                  whiteSpace: "pre-wrap",
                  bgcolor: "grey.50",
                  p: 2,
                  borderRadius: 1,
                }}
              >
                {selectedCD.trackList || "Track list not available."}
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
                  { label: "Artist", value: selectedCD.artist },
                  { label: "Album Title", value: selectedCD.albumTitle },
                  { label: "Category", value: selectedCD.category },
                  {
                    label: "Release Date",
                    value: selectedCD.releaseddate ? formatReleaseDate(selectedCD.releaseddate) : "N/A",
                  },
                  { label: "Stock", value: selectedCD.stock || "N/A" },
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

export default CDDetailPage;