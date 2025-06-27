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
import AlbumIcon from "@mui/icons-material/Album";

import { CD } from "../../types/product.types";
import { useCartStore } from "../../store/cartStore";

interface CDCardProps {
  cd: CD;
}

const CDCard: React.FC<CDCardProps> = memo(({ cd }) => {
  const theme = useTheme();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { addItem } = useCartStore();
  const isInCart = useCartStore((state) => state.isInCart(cd.id));
  
  // Memoize computed values
  const isDiscounted = cd.discountRate > 0;

  // Placeholder image as data URL for CDs
  const placeholderImage = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iODAiIGZpbGw9IiNDQ0NDQ0MiLz4KPGNpcmNsZSBjeD0iMTAwIiBjeT0iMTAwIiByPSIxNSIgZmlsbD0iI0Y1RjVGNSIvPgo8dGV4dCB4PSIxMDAiIHk9IjE1MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OTk5OSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIj5ObyBJbWFnZTwvdGV4dD4KPC9zdmc+";

  // Guard: Don't display CD if data is invalid
  if (
    cd.price === 0 ||
    (isDiscounted &&
      (cd.originalPrice === null || cd.originalPrice === undefined))
  ) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `CDCard: Not displaying CD due to invalid data:`,
        cd
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
    const productId = cd._id || cd.id; // Use MongoDB _id for backend
    console.log('[CDCard] Adding to cart with productId:', productId, 'cd:', cd);
    addItem(productId, 1);
  };

  // Price calculations
  const originalPriceUsd = cd.originalPrice;
  const priceUsd = cd.discountRate > 0 ? originalPriceUsd * (1 - cd.discountRate / 100) : originalPriceUsd;

  return (
    <Card
      component={Link}
      to={`/cds/${cd.id}`}
      sx={{
        height: 380,
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
      <Box sx={{ position: "relative", height: 220, flexShrink: 0 }}>
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
          image={imageError ? placeholderImage : (cd.coverImage || placeholderImage)}
          alt={cd.title}
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
            label={`-${cd.discountRate}%`}
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
        
        {/* CD Type indicator */}
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
          <AlbumIcon fontSize="small" sx={{ mr: 0.5 }} />
          <Typography variant="caption">CD</Typography>
        </Box>
      </Box>

      <CardContent
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          height: 180,
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
          {cd.title}
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
          {cd.artist}
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
          {cd.albumTitle}
        </Typography>

        <Chip
          label={cd.category}
          size="small"
          variant="outlined"
          sx={{ 
            alignSelf: "flex-start",
            mb: 1,
            fontSize: "0.75rem",
          }}
        />

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
          {cd.stock === 0 && (
            <Typography variant="body2" color="error" sx={{ mt: 0.5 }}>
              Out of Stock
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
});

CDCard.displayName = "CDCard";

export default CDCard;