import React, { useEffect } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useWishlistStore } from "../store/wishlistStore";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Alert,
  Container,
  IconButton,
  Paper,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { styled } from "@mui/material/styles";

const StyledCard = styled(Card)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  height: "100%",
  transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: theme.shadows[8],
  },
}));

const StyledCardMedia = styled(CardMedia)({
  paddingTop: "100%", // 1:1 aspect ratio for cover
  objectFit: "cover",
});

const WishlistPage: React.FC = () => {
  const { wishlist, isLoading, error, loadWishlist, removeItemFromWishlist } =
    useWishlistStore();

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  const handleRemoveItem = async (bookId: string) => {
    try {
      await removeItemFromWishlist(bookId);
      // Optionally, show a success notification
    } catch (err) {
      // Error is handled in store, but can show notification here too
      console.error("Failed to remove item from wishlist on page:", err);
    }
  };

  if (isLoading && !wishlist) {
    return (
      <Container sx={{ py: 4, textAlign: "center" }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading Wishlist...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!wishlist || wishlist.items.length === 0) {
    return (
      <Container sx={{ py: 4, textAlign: "center" }}>
        <Paper elevation={3} sx={{ p: 4, display: "inline-block" }}>
          <Typography variant="h5" gutterBottom>
            Your Wishlist is Empty
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Looks like you haven't added any books to your wishlist yet.
          </Typography>
          <Button
            component={RouterLink}
            to="/books"
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
          >
            Explore Books
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{ mb: 4, textAlign: "center", color: "primary.main" }}
      >
        My Wishlist
      </Typography>
      <Grid container spacing={3}>
        {wishlist.items.map((item) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={item.id}>
            <StyledCard>
              <RouterLink
                to={`/books/${item.book.id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <StyledCardMedia
                  image={item.book.coverImage || "/placeholder-cover.jpg"} // Use a placeholder if no cover image
                  title={item.book.title}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h6" component="div" noWrap>
                    {item.book.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    By: {item.book.author}
                  </Typography>
                  <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                    ${item.book.price.toFixed(2)}
                  </Typography>
                </CardContent>
              </RouterLink>
              <CardActions
                sx={{
                  justifyContent: "space-between",
                  p: 2,
                  borderTop: "1px solid #eee",
                }}
              >
                <Button
                  size="small"
                  color="secondary"
                  variant="outlined"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleRemoveItem(item.book.id)}
                  disabled={isLoading} // Disable button when any wishlist operation is in progress
                >
                  Remove
                </Button>
                {/* Optionally, add an "Add to Cart" button here */}
              </CardActions>
            </StyledCard>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default WishlistPage;
