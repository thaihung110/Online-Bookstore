import React from 'react';
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
  Stack,
  useTheme,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PaymentIcon from '@mui/icons-material/Payment';
import MainLayout from '../layouts/MainLayout';

// Props for the generic product detail layout
interface ProductDetailLayoutProps {
  // Data
  product: any | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  onGoBack: () => void;
  onAddToCart: () => Promise<boolean>;
  onBuyNow: () => Promise<boolean>;
  
  // Display helpers
  coverImage: string;
  pricing: {
    currentPrice: number;
    originalPrice: number;
    hasDiscount: boolean;
    discountRate: number;
  };
  ratingInfo: {
    hasRating: boolean;
    rating: number;
    totalRatings: number;
  };
  formatPrice: (price: number) => string;
  addToCartLabel: string;
  isActionDisabled: boolean;
  
  // Product-specific content (OCP - open for extension)
  productSpecificContent?: React.ReactNode;
  productDetailsContent?: React.ReactNode;
}

// Generic product detail layout component - follows OCP
export const ProductDetailLayout: React.FC<ProductDetailLayoutProps> = ({
  product,
  isLoading,
  error,
  onGoBack,
  onAddToCart,
  onBuyNow,
  coverImage,
  pricing,
  ratingInfo,
  formatPrice,
  addToCartLabel,
  isActionDisabled,
  productSpecificContent,
  productDetailsContent,
}) => {
  const theme = useTheme();

  // Loading state
  if (isLoading) {
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

  // Error state
  if (error || !product) {
    return (
      <MainLayout>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ my: 4 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={onGoBack}
              sx={{ mb: 2 }}
            >
              Back to Results
            </Button>
            <Alert severity="error" sx={{ mt: 2 }}>
              {error || "Sorry, the product you are looking for could not be found."}
            </Alert>
          </Box>
        </Container>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={onGoBack}
          sx={{ mb: 2, alignSelf: "flex-start" }}
        >
          Back to Results
        </Button>

        <Paper elevation={3} sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
          <Box
            sx={{ display: "flex", flexWrap: "wrap", gap: { xs: 3, md: 5 } }}
          >
            {/* Product Image and Actions */}
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
                  alt={product.title}
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
                    onClick={onAddToCart}
                    disabled={isActionDisabled}
                  >
                    {addToCartLabel}
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    fullWidth
                    size="large"
                    startIcon={<PaymentIcon />}
                    onClick={onBuyNow}
                    disabled={isActionDisabled}
                  >
                    Buy Now
                  </Button>
                </Stack>
              </Box>
            </Box>

            {/* Product Information */}
            <Box sx={{ width: { xs: "100%", md: "65%" } }}>
              <Typography
                variant="h3"
                component="h1"
                gutterBottom
                sx={{ fontWeight: 700, lineHeight: 1.2 }}
              >
                {product.title}
              </Typography>

              {/* Product-specific content (extensible) */}
              {productSpecificContent}

              {/* Rating and Price Section */}
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                alignItems={{ xs: "stretch", sm: "center" }}
                sx={{ my: 3 }}
              >
                {/* Rating */}
                {ratingInfo.hasRating && (
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
                          value={ratingInfo.rating}
                          precision={0.5}
                          readOnly
                          size="medium"
                        />
                        <Typography
                          variant="h6"
                          sx={{ ml: 1, color: "text.primary", fontWeight: 600 }}
                        >
                          {formatPrice(ratingInfo.rating)}
                        </Typography>
                      </Box>
                      {ratingInfo.totalRatings > 0 && (
                        <Typography
                          variant="body2"
                          sx={{ color: "text.secondary" }}
                        >
                          Based on {ratingInfo.totalRatings} {ratingInfo.totalRatings === 1 ? 'review' : 'reviews'}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                )}

                {/* Divider */}
                {ratingInfo.hasRating && (
                  <Divider 
                    orientation="vertical" 
                    flexItem 
                    sx={{ display: { xs: "none", sm: "block" } }}
                  />
                )}

                {/* Pricing */}
                <Box
                  sx={{
                    p: 2,
                    backgroundColor: pricing.hasDiscount ? "error.50" : "success.50",
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: pricing.hasDiscount ? "error.200" : "success.200",
                    minWidth: { sm: 200 },
                  }}
                >
                  {pricing.hasDiscount ? (
                    <Stack direction="column" spacing={1} alignItems="flex-start">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography
                          variant="h4"
                          color="error.main"
                          sx={{ fontWeight: "bold" }}
                        >
                          ${formatPrice(pricing.currentPrice)}
                        </Typography>
                        <Chip
                          label={`-${pricing.discountRate}%`}
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
                        Original: ${formatPrice(pricing.originalPrice)}
                      </Typography>
                    </Stack>
                  ) : (
                    <Typography
                      variant="h4"
                      color="success.main"
                      sx={{ fontWeight: "bold" }}
                    >
                      ${formatPrice(pricing.currentPrice)}
                    </Typography>
                  )}
                </Box>
              </Stack>

              <Divider sx={{ my: 3 }} />

              {/* Description */}
              <Typography
                variant="h6"
                gutterBottom
                sx={{ fontWeight: "medium" }}
              >
                Product Description
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
                {product.description || "No description available."}
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Product Details */}
              <Typography
                variant="h6"
                gutterBottom
                sx={{ fontWeight: "medium" }}
              >
                Product Details
              </Typography>
              
              {/* Product-specific details (extensible) */}
              {productDetailsContent}
            </Box>
          </Box>
        </Paper>
      </Container>
    </MainLayout>
  );
};

export default ProductDetailLayout;