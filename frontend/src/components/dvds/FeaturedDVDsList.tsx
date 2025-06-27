import React, { useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  Button,
  Alert,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import DVDCard from "./DVDCard";
import { useDVDStore } from "../../store/dvdStore";

const FeaturedDVDsList: React.FC = () => {
  const {
    featuredDVDs,
    isLoading,
    error,
    fetchFeaturedDVDs,
    clearError,
  } = useDVDStore();

  useEffect(() => {
    fetchFeaturedDVDs(6);
  }, [fetchFeaturedDVDs]);

  const handleRetry = () => {
    clearError();
    fetchFeaturedDVDs(6);
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h5" component="h2" fontWeight="bold">
          Featured DVDs
        </Typography>
        <Button component={RouterLink} to="/dvds" variant="outlined">
          View All
        </Button>
      </Box>

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={handleRetry}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      ) : featuredDVDs.length === 0 ? (
        <Box textAlign="center" p={3}>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            No featured DVDs available right now.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Check back later for featured movie releases.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {featuredDVDs.map((dvd) => (
            <Grid key={dvd.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <DVDCard dvd={dvd} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default FeaturedDVDsList;