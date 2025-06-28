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

import { Book } from "../../api/books";
import { useCartStore } from "../../store/cartStore";


interface BookCardProps {
  book: Book;
}

const BookCard: React.FC<BookCardProps> = memo(({ book }) => {
  const theme = useTheme();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { addItem } = useCartStore();
  const isInCart = useCartStore((state) => state.isInCart(book.id));
  // Memoize computed values
  const isDiscounted = book.discountRate > 0;

  // Placeholder image as data URL to avoid network requests
  const placeholderImage = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDIwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik04MCA5MEgxMjBWMTEwSDgwVjkwWiIgZmlsbD0iI0NDQ0NDQyIvPgo8cGF0aCBkPSJNNjAgMTMwSDE0MFYxNDBINjBWMTMwWiIgZmlsbD0iI0NDQ0NDQyIvPgo8cGF0aCBkPSJNNjAgMTUwSDE0MFYxNjBINjBWMTUwWiIgZmlsbD0iI0NDQ0NDQyIvPgo8cGF0aCBkPSJNNjAgMTcwSDE0MFYxODBINjBWMTcwWiIgZmlsbD0iI0NDQ0NDQyIvPgo8dGV4dCB4PSIxMDAiIHk9IjIyMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OTk5OSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0Ij5ObyBJbWFnZTwvdGV4dD4KPC9zdmc+";

  // Guard: Không hiển thị sách nếu dữ liệu không hợp lệ
  if (
    book.price === 0 ||
    (isDiscounted &&
      (book.originalPrice === null || book.originalPrice === undefined))
  ) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `BookCard: Không hiển thị sách do dữ liệu không hợp lệ:`,
        book
      );
    }
    return null;
  }

  // Handle image loading
  const handleImageLoad = () => setImageLoaded(true);
  const handleImageError = () => {
    if (!imageError) { // Only set error once to prevent loops
      setImageError(true);
      setImageLoaded(true);
    }
  };

  // Handle cart actions
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    const bookId = book._id || book.id; // Use MongoDB _id for backend
    console.log('[BookCard] Adding to cart with bookId:', bookId, 'book:', book);
    addItem(bookId, 1);
  };



  // Debug: Log giá trị đầu vào
  if (process.env.NODE_ENV !== "production") {
    console.log(
      "BookCard:",
      book.title,
      "price:",
      book.price,
      "originalPrice:",
      book.originalPrice
    );
  }

  // Không chuyển đổi giá nữa, chỉ hiển thị trực tiếp
  
  const originalPriceUsd = book.originalPrice;
const priceUsd = book.discountRate > 0 ? originalPriceUsd * (1 - book.discountRate / 100) : originalPriceUsd ; // calculate using discountRate
  return (
    <Card
      component={Link}
      to={`/books/${book.id}`}
      sx={{
        height: 380, // Slightly reduced height for better proportions
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
          image={imageError ? placeholderImage : (book.coverImage || placeholderImage )}
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

        {/* Rush delivery badge */}
        {book.isAvailableRush && (
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
      </Box>

      <CardContent
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          height: 180, // Fixed height for content area
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
            height: "3rem", // Fixed height instead of minHeight
            lineHeight: 1.5,
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
            height: "1.5rem", // Fixed height for author
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
          {book.stock === 0 && (
            <Typography variant="body2" color="error" sx={{ mt: 0.5 }}>
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
