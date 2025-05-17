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
} from "@mui/material";
import BookmarkAddOutlinedIcon from "@mui/icons-material/BookmarkAddOutlined";
import BookmarkAddedIcon from "@mui/icons-material/BookmarkAdded";
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

  // Display first category if available
  const primaryCategory =
    book.category && book.category.length > 0 ? book.category[0] : null;

  return (
    <Card
      sx={{
        height: variant === "compact" ? 360 : 450,
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.2s",
        "&:hover": {
          transform: "scale(1.02)",
        },
      }}
      elevation={2}
    >
      <CardMedia
        component="img"
        height={variant === "compact" ? 140 : 200}
        image={coverImage}
        alt={book.title}
        sx={{ objectFit: "contain", pt: 2 }}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        {primaryCategory && (
          <Chip
            label={primaryCategory}
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

        <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
          ${book.price.toFixed(2)}
        </Typography>
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0, justifyContent: "space-between" }}>
        <Stack direction="row" spacing={1} sx={{ flexGrow: 1 }}>
          <Button
            size="small"
            color="primary"
            variant="outlined"
            onClick={handleViewDetails}
            sx={{ flexGrow: 1 }}
          >
            Details
          </Button>
          <Button
            size="small"
            color="primary"
            variant="contained"
            onClick={handleAddToCart}
            disabled={alreadyInCart}
            sx={{ flexGrow: 1 }}
          >
            {alreadyInCart ? "In Cart" : "Add to Cart"}
          </Button>
        </Stack>
        <IconButton
          aria-label={
            bookInWishlist ? "Remove from wishlist" : "Add to wishlist"
          }
          onClick={handleToggleWishlist}
          disabled={wishlistLoading}
          color="secondary"
          sx={{ ml: 1 }}
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
