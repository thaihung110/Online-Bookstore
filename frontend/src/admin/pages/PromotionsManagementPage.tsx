import React from "react";
import { Box, Typography, Paper, Button } from "@mui/material";
import { Construction as ConstructionIcon } from "@mui/icons-material";

const PromotionsManagementPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Promotion Management
      </Typography>

      <Paper
        elevation={3}
        sx={{
          p: 5,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ConstructionIcon
          sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
        />
        <Typography variant="h5" gutterBottom>
          Under Construction
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Promotion management functionality is coming soon. This section will
          allow you to create and manage discounts, coupons, and special offers.
        </Typography>
        <Box>
          <Button variant="contained" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default PromotionsManagementPage;
