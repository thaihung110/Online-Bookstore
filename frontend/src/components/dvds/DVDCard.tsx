import React, { memo, useState } from "react";
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Chip,
  IconButton,
  Skeleton,
  Tooltip,
  Stack,
  useTheme,
} from "@mui/material";
import { Link } from "react-router-dom";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import MovieIcon from "@mui/icons-material/Movie";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

import { DVD } from "../../types/product.types";
import { useCartStore } from "../../store/cartStore";

interface DVDCardProps {
  dvd: DVD;
}

const DVDCard: React.FC<DVDCardProps> = memo(({ dvd }) => {
  const theme = useTheme();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { addItem } = useCartStore();
  const isInCart = useCartStore((state) => state.isInCart(dvd.id));
  
  // Memoize computed values
  const isDiscounted = dvd.discountRate > 0;

  // Placeholder image as data URL for DVDs
  const placeholderImage = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI4MCIgdmlld0JveD0iMCAwIDIwMCAyODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjgwIiBmaWxsPSIjRjVGNUY1Ii8+CjxyZWN0IHg9IjIwIiB5PSIyMCIgd2lkdGg9IjE2MCIgaGVpZ2h0PSIyNDAiIGZpbGw9IiNDQ0NDQ0MiIHJ4PSI0Ii8+Cjx0cmlhbmdsZSBjeD0iMTAwIiBjeT0iMTQwIiByPSIzMCIgZmlsbD0iIzk5OTk5OSIvPgo8cGF0aCBkPSJNODUgMTI1TDEyNSAxNDBMODUgMTU1VjEyNVoiIGZpbGw9IiM5OTk5OTkiLz4KPHR5dGUgeD0iMTAwIiB5PSIyMDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5OTk5OTkiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiI+Tm8gSW1hZ2U8L3RleHQ+Cjwvc3ZnPg==";

  // Guard: Don't display DVD if data is invalid
  if (
    dvd.price === 0 ||
    (isDiscounted &&
      (dvd.originalPrice === null || dvd.originalPrice === undefined))
  ) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `DVDCard: Not displaying DVD due to invalid data:`,
        dvd
      );
    }
    return null;
  }

  // Handle image loading
  const handleImageLoad = () => setImageLoaded(true);
  const handleImageError = () => {
    if (!imageError) {
      setImageError(true);
      setImageLoaded(true);
    }
  };

  // Handle cart actions
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    const productId = dvd._id || dvd.id; // Use MongoDB _id for backend
    console.log('[DVDCard] Adding to cart with productId:', productId, 'dvd:', dvd);
    addItem(productId, 1);
  };

  // Price calculations
  const originalPriceUsd = dvd.originalPrice;
  const priceUsd = dvd.discountRate > 0 ? originalPriceUsd * (1 - dvd.discountRate / 100) : originalPriceUsd;

  // Format runtime
  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <Card
      component={Link}
      to={`/dvds/${dvd.id}`}
      sx={{
        height: 420, // Slightly taller for DVD info
        display: "flex",
        flexDirection: "column",
        textDecoration: "none",
        transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: theme.shadows[4],
        },
      }}
    >
      <Box sx={{ position: "relative", height: 240, flexShrink: 0 }}>
        {!imageLoaded && (
          <Skeleton
            variant="rectangular"
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
            }}
            animation="wave"
          />
        )}
        <CardMedia
          component="img"
          image={imageError ? placeholderImage : (dvd.coverImage || placeholderImage)}
          alt={dvd.title}
          onLoad={handleImageLoad}
          onError={handleImageError}
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: imageLoaded ? 1 : 0,
            transition: "opacity 0.3s ease-in-out",
          }}
        />
        
        {/* Action buttons */}
        <Box
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          <Tooltip title={isInCart ? "In Cart" : "Add to Cart"}>
            <IconButton
              onClick={handleAddToCart}
              disabled={isInCart}
              sx={{
                bgcolor: "background.paper",
                "&:hover": { bgcolor: "action.hover" },
              }}
              size="small"
            >
              <ShoppingCartIcon
                color={isInCart ? "disabled" : "primary"}
                fontSize="small"
              />
            </IconButton>
          </Tooltip>
        </Box>
        
        {/* Discount badge */}
        {isDiscounted && (
          <Chip
            label={`-${dvd.discountRate}%`}
            color="error"
            size="small"
            sx={{
              position: "absolute",
              top: 8,
              left: 8,
              fontWeight: "bold",
            }}
          />
        )}

        {/* Rush delivery badge */}
        {dvd.isAvailableRush && (
          <Chip
            label="Rush Available"
            color="warning"
            size="small"
            sx={{
              position: "absolute",
              top: isDiscounted ? 48 : 8, // Position below discount badge if both exist
              left: 8,
              fontWeight: "bold",
              fontSize: "0.7rem",
            }}
          />
        )}
        
        {/* DVD Type indicator */}
        <Box
          sx={{
            position: "absolute",
            bottom: 8,
            left: 8,
            display: "flex",
            alignItems: "center",
            bgcolor: "rgba(0, 0, 0, 0.7)",
            color: "white",
            px: 1,
            py: 0.5,
            borderRadius: 1,
          }}
        >
          <MovieIcon fontSize="small" sx={{ mr: 0.5 }} />
          <Typography variant="caption">{dvd.disctype}</Typography>
        </Box>

        {/* Runtime indicator */}
        <Box
          sx={{
            position: "absolute",
            bottom: 8,
            right: 8,
            display: "flex",
            alignItems: "center",
            bgcolor: "rgba(0, 0, 0, 0.7)",
            color: "white",
            px: 1,
            py: 0.5,
            borderRadius: 1,
          }}
        >
          <AccessTimeIcon fontSize="small" sx={{ mr: 0.5 }} />
          <Typography variant="caption">{formatRuntime(dvd.runtime)}</Typography>
        </Box>
      </Box>

      <CardContent
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          height: 200,
          p: 2,
        }}
      >
        <Typography
          variant="h6"
          component="h2"
          gutterBottom
          sx={{
            fontSize: "1rem",
            fontWeight: "bold",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            height: "3rem",
            lineHeight: 1.5,
          }}
        >
          {dvd.title}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          gutterBottom
          sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            height: "1.5rem",
          }}
        >
          Directed by {dvd.director}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          gutterBottom
          sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            height: "1.5rem",
            fontStyle: "italic",
          }}
        >
          {dvd.studio}
        </Typography>

        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
          <Chip
            label={dvd.filmtype}
            size="small"
            variant="outlined"
            sx={{ fontSize: "0.75rem" }}
          />
          <Chip
            label={dvd.disctype}
            size="small"
            variant="filled"
            color="secondary"
            sx={{ fontSize: "0.75rem" }}
          />
        </Stack>

        <Box sx={{ mt: "auto", minHeight: "3rem", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <Stack direction="row" spacing={1} alignItems="baseline">
            <Typography
              variant="h6"
              color={isDiscounted ? "error.main" : "primary.main"}
              sx={{ fontWeight: "bold" }}
            >
              ${(priceUsd || 0).toFixed(2)}
            </Typography>
            {isDiscounted &&
              originalPriceUsd !== null &&
              originalPriceUsd !== undefined && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ textDecoration: "line-through" }}
                >
                  ${originalPriceUsd.toFixed(2)}
                </Typography>
              )}
          </Stack>
          {dvd.stock === 0 && (
            <Typography variant="body2" color="error" sx={{ mt: 0.5 }}>
              Out of Stock
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
});

DVDCard.displayName = "DVDCard";

export default DVDCard;