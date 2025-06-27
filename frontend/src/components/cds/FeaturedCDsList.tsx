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
import CDCard from "./CDCard";
import { useCDStore } from "../../store/cdStore";

const FeaturedCDsList: React.FC = () => {
  const {
    featuredCDs,
    isLoading,
    error,
    fetchFeaturedCDs,
    clearError,
  } = useCDStore();

  useEffect(() => {
    fetchFeaturedCDs(6);
  }, [fetchFeaturedCDs]);

  const handleRetry = () => {
    clearError();
    fetchFeaturedCDs(6);
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
          Featured CDs
        </Typography>
        <Button component={RouterLink} to="/cds" variant="outlined">
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
      ) : featuredCDs.length === 0 ? (
        <Box textAlign="center" p={3}>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            No featured CDs available right now.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Check back later for featured music releases.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {featuredCDs.map((cd) => (
            <Grid key={cd.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <CDCard cd={cd} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default FeaturedCDsList;