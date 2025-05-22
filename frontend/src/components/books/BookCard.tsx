import React from "react";
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  CardActions,
  Box,
  Rating,
  Chip,
  Stack,
  IconButton,
  CircularProgress,
  Badge,
} from "@mui/material";
import BookmarkAddOutlinedIcon from "@mui/icons-material/BookmarkAddOutlined";
import BookmarkAddedIcon from "@mui/icons-material/BookmarkAdded";
import InventoryIcon from "@mui/icons-material/Inventory";
import { useNavigate } from "react-router-dom";
import { Book } from "../../api/books";
import { useCartStore } from "../../store/cartStore";
import { useWishlistStore } from "../../store/wishlistStore";

interface BookCardProps {
  book: Book;
  variant?: "default" | "compact";
}

const BookCard: React.FC<BookCardProps> = ({ book, variant = "default" }) => {
  const navigate = useNavigate();
  const { addItem, isInCart } = useCartStore();
  const {
    addItemToWishlist,
    removeItemFromWishlist,
    isItemInWishlist,
    isLoading: wishlistLoading,
  } = useWishlistStore();

  const alreadyInCart = isInCart(book.id);
  const bookInWishlist = isItemInWishlist(book.id);

  const handleViewDetails = () => {
    navigate(`/books/${book.id}`);
  };

  const handleAddToCart = () => {
    addItem(book);
  };

  const handleToggleWishlist = async () => {
    try {
      if (bookInWishlist) {
        await removeItemFromWishlist(book.id);
      } else {
        await addItemToWishlist(book);
      }
    } catch (error) {
      console.error("Failed to toggle wishlist item on card:", error);
    }
  };

  // Placeholder image if no cover is available
  const coverImage =
    book.coverImage || "https://via.placeholder.com/150x200?text=No+Image";

  // Display first genre if available
  const primaryGenre =
    book.genres && book.genres.length > 0 ? book.genres[0] : null;

  // Check if book is on sale
  const isOnSale = book.discountRate > 0;

  return (
    <Card
      sx={{
        width: "100%",
        height: variant === "compact" ? 380 : 520,
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.2s",
        "&:hover": {
          transform: "scale(1.02)",
        },
        position: "relative",
      }}
      elevation={2}
    >
      <Box sx={{ position: "relative" }}>
        {isOnSale && (
          <Badge
            sx={{
              position: "absolute",
              top: 12,
              right: 12,
              zIndex: 1,
              "& .MuiBadge-badge": {
                fontSize: "0.8rem",
                height: "24px",
                minWidth: "24px",
                padding: "0 8px",
                borderRadius: "12px",
                fontWeight: "bold",
              },
            }}
            badgeContent={`-${book.discountRate}%`}
            color="error"
          />
        )}
        <CardMedia
          component="img"
          height={variant === "compact" ? 140 : 200}
          image={coverImage}
          alt={book.title}
          sx={{ objectFit: "contain", pt: 2 }}
        />
      </Box>
      <CardContent sx={{ flexGrow: 1, pb: 0 }}>
        {primaryGenre && (
          <Chip
            label={primaryGenre}
            size="small"
            sx={{ mb: 1 }}
            color="primary"
            variant="outlined"
          />
        )}

        <Typography
          gutterBottom
          variant={variant === "compact" ? "subtitle1" : "h6"}
          component="div"
          noWrap
          title={book.title}
        >
          {book.title}
        </Typography>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          by {book.author}
        </Typography>

        {book.rating !== undefined && (
          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            <Rating
              name={`book-rating-${book.id}`}
              value={book.rating}
              precision={0.5}
              size="small"
              readOnly
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              {book.rating}
            </Typography>
          </Box>
        )}

        {variant !== "compact" && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              mb: 1,
            }}
          >
            {book.description}
          </Typography>
        )}

        <Box sx={{ display: "flex", alignItems: "center", mt: 1, mb: 1 }}>
          <InventoryIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
          <Typography
            variant="body2"
            color={book.stock > 0 ? "success.main" : "error.main"}
          >
            {book.stock > 0 ? `In stock: ${book.stock} items` : "Out of stock"}
          </Typography>
        </Box>

        <Box sx={{ mt: 1 }}>
          {isOnSale ? (
            <Stack direction="column" spacing={0.5}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="h6" color="error.main">
                  ${book.price.toFixed(2)}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    bgcolor: "error.main",
                    color: "white",
                    px: 0.7,
                    py: 0.3,
                    borderRadius: 1,
                    fontWeight: "bold",
                  }}
                >
                  -{book.discountRate}%
                </Typography>
              </Box>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textDecoration: "line-through" }}
              >
                ${book.originalPrice.toFixed(2)}
              </Typography>
            </Stack>
          ) : (
            <Typography variant="h6" color="primary">
              ${book.price.toFixed(2)}
            </Typography>
          )}
        </Box>
      </CardContent>

      <CardActions
        sx={{ p: 2, pt: 1, display: "flex", justifyContent: "space-between" }}
      >
        <Button
          size="small"
          color="primary"
          variant="outlined"
          onClick={handleViewDetails}
          sx={{ flexGrow: 0.5 }}
        >
          Details
        </Button>
        <Button
          size="small"
          color="primary"
          variant="contained"
          onClick={handleAddToCart}
          disabled={alreadyInCart || book.stock <= 0}
          sx={{ flexGrow: 0.5, mx: 1 }}
        >
          {alreadyInCart ? "In Cart" : "Add to Cart"}
        </Button>
        <IconButton
          aria-label={
            bookInWishlist ? "Remove from wishlist" : "Add to wishlist"
          }
          onClick={handleToggleWishlist}
          disabled={wishlistLoading}
          color="secondary"
          sx={{ flexShrink: 0 }}
          size="medium"
        >
          {wishlistLoading ? (
            <CircularProgress size={24} color="inherit" />
          ) : bookInWishlist ? (
            <BookmarkAddedIcon />
          ) : (
            <BookmarkAddOutlinedIcon />
          )}
        </IconButton>
      </CardActions>
    </Card>
  );
};

export default BookCard;
