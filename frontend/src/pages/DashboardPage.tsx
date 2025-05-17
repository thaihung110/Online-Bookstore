import React from "react";
import {
  Box,
  Typography,
  Paper,
  Divider,
  Grid,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  AccountCircle,
  ShoppingBasket,
  Favorite,
  Edit,
  Book,
  MailOutline,
  CalendarToday,
} from "@mui/icons-material";
import MainLayout from "../components/layouts/MainLayout";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Placeholder for user creation date - replace with actual data when available
  const memberSince = user?.id // A crude way to make it seem dynamic for now
    ? new Date(
        Date.now() - (parseInt(user.id, 16) % (1000 * 60 * 60 * 24 * 365))
      ).toLocaleDateString()
    : new Date().toLocaleDateString();

  return (
    <MainLayout>
      <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
        <Avatar sx={{ width: 64, height: 64, bgcolor: "primary.main", mr: 2 }}>
          <AccountCircle sx={{ fontSize: 40 }} />
        </Avatar>
        <Box>
          <Typography variant="h4" component="h1">
            Welcome, {user?.username || "User"}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your account, view orders, and update your wishlist.
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Account Information Section */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <AccountCircle color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Account Information</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <AccountCircle fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Username"
                  secondary={user?.username || "N/A"}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <MailOutline fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Email"
                  secondary={user?.email || "N/A"}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CalendarToday fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Member Since" secondary={memberSince} />
              </ListItem>
            </List>
            <Button
              variant="outlined"
              startIcon={<Edit />}
              sx={{ mt: 2 }}
              onClick={() => navigate("/dashboard/edit-profile")} // Placeholder path
            >
              Edit Profile
            </Button>
          </Paper>
        </Grid>

        {/* Recent Orders Section */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <ShoppingBasket color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Recent Orders</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              You haven't placed any orders yet.
            </Typography>
            <Button
              variant="contained"
              startIcon={<Book />}
              onClick={() => navigate("/books")}
            >
              Browse Books & Start Shopping
            </Button>
            {/* Placeholder for future order list */}
            {/* <Button variant="text" endIcon={<Receipt />} sx={{mt: 1, display: 'block'}}>View All Orders</Button> */}
          </Paper>
        </Grid>

        {/* Wishlist Section */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Favorite color="secondary" sx={{ mr: 1 }} />
              <Typography variant="h6">Your Wishlist</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              View and manage books you've saved for later.
            </Typography>
            <Button
              variant="contained"
              startIcon={<Favorite />}
              onClick={() => navigate("/wishlist")}
              color="secondary"
            >
              View My Wishlist
            </Button>
            {/* Placeholder for future wishlist items */}
          </Paper>
        </Grid>
      </Grid>
    </MainLayout>
  );
};

export default DashboardPage;
