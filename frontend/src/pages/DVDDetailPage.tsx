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
import MovieIcon from "@mui/icons-material/Movie";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import BusinessIcon from "@mui/icons-material/Business";

import MainLayout from "../components/layouts/MainLayout";
import { useDVDStore } from "../store/dvdStore";
import { useCartStore } from "../store/cartStore";

const DVDDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();

  const {
    selectedDVD,
    fetchDVDById,
    isLoading: dvdLoading,
    error: dvdError,
  } = useDVDStore();
  const { addItem, isInCart } = useCartStore();

  useEffect(() => {
    if (id) {
      fetchDVDById(id);
    }
    // Scroll to top when component mounts or ID changes
    window.scrollTo(0, 0);
  }, [id, fetchDVDById]);

  const handleAddToCart = () => {
    if (selectedDVD) {
      const productId = selectedDVD._id || selectedDVD.id; // Use MongoDB _id for backend
      console.log('[DVDDetailPage] Adding to cart with productId:', productId, 'dvd:', selectedDVD);
      addItem(productId, 1);
    }
  };

  const handleBuyNow = async () => {
    if (selectedDVD) {
      try {
        // If not in cart, add it first
        const frontendId = selectedDVD.id; // Use frontend id for isInCart check
        if (!isInCart(frontendId)) {
          const productId = selectedDVD._id || selectedDVD.id;
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

  if (dvdLoading) {
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

  if (dvdError || !selectedDVD) {
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
              {dvdError ||
                "Sorry, the DVD you are looking for could not be found."}
            </Alert>
          </Box>
        </Container>
      </MainLayout>
    );
  }

  // Log DVD data for debug
  console.log("DVD detail data:", selectedDVD);

  // Placeholder image if no cover is available
  const coverImage =
    selectedDVD.coverImage ||
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI4MCIgdmlld0JveD0iMCAwIDIwMCAyODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjgwIiBmaWxsPSIjRjVGNUY1Ii8+CjxyZWN0IHg9IjIwIiB5PSIyMCIgd2lkdGg9IjE2MCIgaGVpZ2h0PSIyNDAiIGZpbGw9IiNDQ0NDQ0MiIHJ4PSI0Ii8+Cjx0cmlhbmdsZSBjeD0iMTAwIiBjeT0iMTQwIiByPSIzMCIgZmlsbD0iIzk5OTk5OSIvPgo8cGF0aCBkPSJNODUgMTI1TDEyNSAxNDBMODUgMTU1VjEyNVoiIGZpbGw9IiM5OTk5OTkiLz4KPHR5cGUgeD0iMTAwIiB5PSIyMDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5OTk5OTkiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiI+Tm8gSW1hZ2U8L3RleHQ+Cjwvc3ZnPg==";

  // Check if DVD is on sale
  const hasDiscountRate =
    selectedDVD.discountRate !== undefined && selectedDVD.discountRate !== null;
  const isOnSale = hasDiscountRate && selectedDVD.discountRate > 0;

  // Ensure original price or fallback to price
  const originalPrice =
    selectedDVD.originalPrice !== undefined
      ? selectedDVD.originalPrice
      : selectedDVD.price;

  // Debug: Log price values
  console.log(
    "DVDDetailPage:",
    selectedDVD.title,
    "price:",
    selectedDVD.price,
    "originalPrice:",
    originalPrice
  );

  const priceUsd = selectedDVD.price;
  const originalPriceUsd = originalPrice;

  // Helper safe format
  const safeToFixed = (val: any, digits = 2) =>
    typeof val === "number" && !isNaN(val) ? val.toFixed(digits) : "N/A";

  // Format runtime
  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

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
                  alt={selectedDVD.title}
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
                    disabled={isInCart(selectedDVD.id)}
                  >
                    {isInCart(selectedDVD.id)
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
                {selectedDVD.title}
              </Typography>
              <Typography variant="h5" color="text.secondary" sx={{ mb: 1 }}>
                Directed by:{" "}
                <MuiLink
                  component={RouterLink}
                  to={`/dvds?director=${encodeURIComponent(selectedDVD.director)}`}
                  underline="hover"
                  color="inherit"
                >
                  {selectedDVD.director}
                </MuiLink>
              </Typography>

              <Typography variant="h6" color="text.secondary" sx={{ mb: 2, fontStyle: "italic" }}>
                <BusinessIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                Studio: {selectedDVD.studio}
              </Typography>

              <Box
                sx={{
                  mb: 2,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 0.75,
                  alignItems: "center",
                }}
              >
                <Chip
                  label={selectedDVD.filmtype}
                  component={RouterLink}
                  to={`/dvds?filmTypes=${encodeURIComponent(selectedDVD.filmtype)}`}
                  clickable
                  color="info"
                  variant="outlined"
                  size="small"
                  icon={<MovieIcon />}
                />
                <Chip
                  label={selectedDVD.disctype}
                  component={RouterLink}
                  to={`/dvds?discTypes=${encodeURIComponent(selectedDVD.disctype)}`}
                  clickable
                  color="secondary"
                  variant="filled"
                  size="small"
                />
                <Chip
                  label={formatRuntime(selectedDVD.runtime)}
                  color="default"
                  variant="outlined"
                  size="small"
                  icon={<AccessTimeIcon />}
                />
              </Box>

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
                        label={`-${selectedDVD.discountRate}%`}
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

              <Divider sx={{ my: 3 }} />

              <Typography
                variant="h6"
                gutterBottom
                sx={{ fontWeight: "medium" }}
              >
                Movie Description
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
                {selectedDVD.description || "No description available."}
              </Box>

              <Divider sx={{ my: 3 }} />

              <Typography
                variant="h6"
                gutterBottom
                sx={{ fontWeight: "medium" }}
              >
                Movie Details
              </Typography>
              <Box sx={{ maxWidth: { xs: "100%", sm: 600 } }}>
                {[
                  { label: "Director", value: selectedDVD.director },
                  { label: "Studio", value: selectedDVD.studio },
                  { label: "Film Type", value: selectedDVD.filmtype },
                  { label: "Disc Type", value: selectedDVD.disctype },
                  { label: "Runtime", value: formatRuntime(selectedDVD.runtime) },
                  { label: "Subtitles", value: selectedDVD.subtitles },
                  {
                    label: "Release Date",
                    value: selectedDVD.releaseddate ? formatReleaseDate(selectedDVD.releaseddate) : "N/A",
                  },
                  { label: "Stock", value: selectedDVD.stock || "N/A" },
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

export default DVDDetailPage;