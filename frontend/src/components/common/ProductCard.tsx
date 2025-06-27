import React from "react";
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  Rating,
  Chip,
  IconButton,
  Tooltip,
  Stack,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import BookIcon from "@mui/icons-material/Book";
import AlbumIcon from "@mui/icons-material/Album";
import MovieIcon from "@mui/icons-material/Movie";
import { Product, BookProduct, CDProduct, DVDProduct } from "../../api/products";
import { useCartStore } from "../../store/cartStore";

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const { addItem, isInCart } = useCartStore();

  const getProductIcon = () => {
    switch (product.productType) {
      case 'BOOK':
        return <BookIcon fontSize="small" />;
      case 'CD':
        return <AlbumIcon fontSize="small" />;
      case 'DVD':
        return <MovieIcon fontSize="small" />;
      default:
        return <BookIcon fontSize="small" />;
    }
  };

  const getProductTypeColor = () => {
    switch (product.productType) {
      case 'BOOK':
        return 'primary';
      case 'CD':
        return 'secondary';
      case 'DVD':
        return 'success';
      default:
        return 'default';
    }
  };

  const getProductRoute = (): string => {
    switch (product.productType) {
      case 'BOOK':
        return `/books/${product.id}`;
      case 'CD':
        return `/cds/${product.id}`;
      case 'DVD':
        return `/dvds/${product.id}`;
    }
  };

  const getCreatorInfo = () => {
    switch (product.productType) {
      case 'BOOK':
        return (product as BookProduct).author;
      case 'CD':
        return (product as CDProduct).artist;
      case 'DVD':
        return (product as DVDProduct).director;
      default:
        return '';
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onAddToCart) {
      onAddToCart(product);
    } else {
      const productId = product._id || product.id;
      addItem(productId, 1);
    }
  };

  const isOnSale = product.discountRate > 0;
  const isInCartCheck = isInCart(product.id);

  return (
    <Card
      component={RouterLink}
      to={getProductRoute()}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        textDecoration: "none",
        color: "inherit",
        transition: "all 0.3s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: 6,
        },
        position: "relative",
      }}
    >
      {/* Product Type Badge */}
      <Box
        sx={{
          position: "absolute",
          top: 8,
          left: 8,
          zIndex: 1,
        }}
      >
        <Chip
          icon={getProductIcon()}
          label={product.productType}
          size="small"
          color={getProductTypeColor() as any}
          sx={{ fontWeight: 600, fontSize: '0.75rem' }}
        />
      </Box>

      {/* Discount Badge */}
      {isOnSale && (
        <Box
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 1,
          }}
        >
          <Chip
            label={`-${product.discountRate}%`}
            size="small"
            color="error"
            sx={{ fontWeight: 600 }}
          />
        </Box>
      )}

      {/* Product Image */}
      <CardMedia
        component="img"
        sx={{
          height: 240,
          objectFit: "contain",
          p: 1,
          backgroundColor: "grey.50",
        }}
        image={product.coverImage || "https://via.placeholder.com/200x300?text=No+Image"}
        alt={product.title}
      />

      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        {/* Title */}
        <Typography
          variant="h6"
          component="h3"
          sx={{
            fontWeight: 600,
            mb: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            lineHeight: 1.3,
            minHeight: "2.6em",
          }}
        >
          {product.title}
        </Typography>

        {/* Creator (Author/Artist/Director) */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {getCreatorInfo()}
        </Typography>

        {/* Rating */}
        {product.rating && product.rating > 0 && (
          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            <Rating
              value={product.rating}
              precision={0.5}
              readOnly
              size="small"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
              ({product.totalRatings || 0})
            </Typography>
          </Box>
        )}

        {/* Price */}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <Typography
            variant="h6"
            color={isOnSale ? "error.main" : "primary.main"}
            sx={{ fontWeight: 600 }}
          >
            ${product.price.toFixed(2)}
          </Typography>
          {isOnSale && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textDecoration: "line-through" }}
            >
              ${product.originalPrice.toFixed(2)}
            </Typography>
          )}
        </Stack>

        {/* Stock Status */}
        <Typography
          variant="body2"
          color={product.stock > 0 ? "success.main" : "error.main"}
          sx={{ fontSize: "0.75rem", mb: 1 }}
        >
          {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
        </Typography>
      </CardContent>

      {/* Add to Cart Button */}
      <Box sx={{ p: 1, pt: 0 }}>
        <Tooltip title={isInCartCheck ? "Already in cart" : "Add to cart"}>
          <span>
            <IconButton
              onClick={handleAddToCart}
              disabled={product.stock === 0 || isInCartCheck}
              sx={{
                width: "100%",
                borderRadius: 1,
                py: 1,
                backgroundColor: isInCartCheck ? "grey.300" : "primary.main",
                color: "white",
                "&:hover": {
                  backgroundColor: isInCartCheck ? "grey.400" : "primary.dark",
                },
                "&.Mui-disabled": {
                  backgroundColor: "grey.300",
                  color: "grey.500",
                },
              }}
            >
              <ShoppingCartIcon sx={{ mr: 1 }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {isInCartCheck ? "In Cart" : "Add to Cart"}
              </Typography>
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    </Card>
  );
};

export default ProductCard;