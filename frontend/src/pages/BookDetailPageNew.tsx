import React from 'react';
import {
  Typography,
  Box,
  Chip,
  Link as MuiLink,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useBookStore } from '../store/bookStore';
import { useProductDetail } from '../hooks/useProductDetail';
import { useProductActions } from '../hooks/useProductActions';
import ProductDetailLayout from '../components/product/ProductDetailLayout';
import { Book } from '../api/books';

// New SOLID-compliant BookDetailPage
const BookDetailPageNew: React.FC = () => {
  // Use custom hooks for separation of concerns (SRP)
  const bookStore = useBookStore();
  
  // Create compatible store interface
  const productStore = {
    currentProduct: bookStore.currentBook,
    isLoading: bookStore.isLoading,
    error: bookStore.error,
    fetchProductById: bookStore.fetchBookById,
    clearCurrentProduct: bookStore.clearCurrentProduct,
  };
  
  const productDetail = useProductDetail<Book>(productStore);
  const productActions = useProductActions(productDetail.product);

  const { product } = productDetail;

  // Book-specific content component (OCP - extensible)
  const BookSpecificContent = () => {
    if (!product) return null;

    return (
      <>
        <Typography variant="h5" color="text.secondary" sx={{ mb: 1 }}>
          By:{" "}
          <MuiLink
            component={RouterLink}
            to={`/books?author=${encodeURIComponent(product.author)}`}
            underline="hover"
            color="inherit"
          >
            {product.author}
          </MuiLink>
        </Typography>

        {product.genres && product.genres.length > 0 && (
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
              {product.genres.map((genre) => (
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
      </>
    );
  };

  // Book-specific details component (OCP - extensible)
  const BookDetailsContent = () => {
    if (!product) return null;

    const details = [
      { label: "Publisher", value: product.publisher },
      {
        label: "Publication Year",
        value: product.publicationYear?.toString(),
      },
      { label: "Language", value: product.language || "English" },
      { label: "ISBN", value: product.isbn },
      { label: "Pages", value: product.pageCount?.toString() || "N/A" },
    ];

    return (
      <Box sx={{ maxWidth: { xs: "100%", sm: 600 } }}>
        {details.map((detail) =>
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
    );
  };

  // Render using generic layout component
  return (
    <ProductDetailLayout
      // Data
      product={productDetail.product}
      isLoading={productDetail.isLoading}
      error={productDetail.error}
      
      // Actions
      onGoBack={productDetail.handleGoBack}
      onAddToCart={productActions.handleAddToCart}
      onBuyNow={productActions.handleBuyNow}
      
      // Display helpers
      coverImage={productDetail.getCoverImage(product) || ''}
      pricing={productDetail.getPricing(product)}
      ratingInfo={productDetail.getRatingInfo(product)}
      formatPrice={productDetail.formatPrice}
      addToCartLabel={productActions.getAddToCartLabel()}
      isActionDisabled={productActions.isActionDisabled}
      
      // Book-specific content (extensible through composition)
      productSpecificContent={<BookSpecificContent />}
      productDetailsContent={<BookDetailsContent />}
    />
  );
};

export default BookDetailPageNew;