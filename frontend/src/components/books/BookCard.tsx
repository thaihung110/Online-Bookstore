import React, { memo, useState } from "react";
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Rating,
  Chip,
  IconButton,
  Skeleton,
  Tooltip,
  Stack,
  useTheme,
} from "@mui/material";
import { Link } from "react-router-dom";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import { Book } from "../../api/books";
import { useCartStore } from "../../store/cartStore";
import { useWishlistStore } from "../../store/wishlistStore";

interface BookCardProps {
  book: Book;
}

const BookCard: React.FC<BookCardProps> = memo(({ book }) => {
  const theme = useTheme();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { addItem } = useCartStore();
  const isInCart = useCartStore((state) => state.isInCart(book.id));
  const { addItemToWishlist, removeItemFromWishlist, isItemInWishlist } =
    useWishlistStore();

  // Memoize computed values
  const isDiscounted = book.discountRate > 0;
  const inWishlist = isItemInWishlist(book.id);

  // Handle image loading
  const handleImageLoad = () => setImageLoaded(true);
  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(true);
  };

  // Handle cart and wishlist actions
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem(book.id, 1);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    if (inWishlist) {
      removeItemFromWishlist(book.id);
    } else {
      addItemToWishlist(book);
    }
  };

  // Debug: Log giá trị đầu vào
  console.log(
    "BookCard:",
    book.title,
    "price:",
    book.price,
    "originalPrice:",
    book.originalPrice
  );
  // Không chuyển đổi giá nữa, chỉ hiển thị trực tiếp
  const priceUsd = book.price;
  const originalPriceUsd = book.originalPrice;

  return (
    <Card
      component={Link}
      to={`/books/${book.id}`}
      sx={{
        height: "100%",
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
      <Box sx={{ position: "relative", paddingTop: "140%" }}>
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
          image={imageError ? "/placeholder-book.jpg" : book.coverImage}
          alt={book.title}
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
          <Tooltip
            title={inWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
          >
            <IconButton
              onClick={handleToggleWishlist}
              sx={{
                bgcolor: "background.paper",
                "&:hover": { bgcolor: "action.hover" },
              }}
              size="small"
            >
              {inWishlist ? (
                <BookmarkIcon color="primary" fontSize="small" />
              ) : (
                <BookmarkBorderIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        </Box>
        {/* Discount badge */}
        {isDiscounted && (
          <Chip
            label={`-${book.discountRate}%`}
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
      </Box>

      <CardContent
        sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}
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
            minHeight: "3rem",
          }}
        >
          {book.title}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          gutterBottom
          sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {book.author}
        </Typography>

        {book.rating !== undefined && (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <Rating value={book.rating} readOnly size="small" precision={0.5} />
            <Typography variant="body2" color="text.secondary">
              {book.rating.toFixed(1)}
            </Typography>
          </Stack>
        )}

        <Box sx={{ mt: "auto" }}>
          <Stack direction="row" spacing={1} alignItems="baseline">
            <Typography
              variant="h6"
              color={isDiscounted ? "error.main" : "primary.main"}
              sx={{ fontWeight: "bold" }}
            >
              ${priceUsd.toFixed(2)}
            </Typography>
            {isDiscounted && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textDecoration: "line-through" }}
              >
                ${originalPriceUsd.toFixed(2)}
              </Typography>
            )}
          </Stack>
          {book.stock === 0 && (
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              Out of Stock
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
});

BookCard.displayName = "BookCard";

export default BookCard;
