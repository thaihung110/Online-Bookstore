import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Badge,
  useMediaQuery,
  useTheme,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Drawer,
  Container,
  ListItemButton,
} from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import MenuIcon from "@mui/icons-material/Menu";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import BookIcon from "@mui/icons-material/Book";
import DashboardIcon from "@mui/icons-material/Dashboard";
import LogoutIcon from "@mui/icons-material/Logout";
import SearchIcon from "@mui/icons-material/Search";

import LoginIcon from "@mui/icons-material/Login";
import PersonAddIcon from "@mui/icons-material/PersonAdd";

import { useAuthStore } from "../../store/authStore";
import { useCartStore } from "../../store/cartStore";

const NavigationBar: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();

  const { isAuthenticated, user, logout } = useAuthStore();
  const totalItems = useCartStore((state) => state.getTotalItems());

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
    navigate("/");
  };

  const menuId = "primary-account-menu";
  const renderMenu = (
    <Menu
      anchorEl={anchorEl}
      id={menuId}
      keepMounted
      open={Boolean(anchorEl)}
      onClose={handleMenuClose}
      PaperProps={{
        elevation: 3,
        sx: { minWidth: 200 },
      }}
      transformOrigin={{ horizontal: "right", vertical: "top" }}
      anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
    >
      <Box sx={{ p: 2, display: "flex", alignItems: "center" }}>
        <Avatar sx={{ width: 32, height: 32, mr: 2, bgcolor: "primary.main" }}>
          {user?.username?.charAt(0).toUpperCase() || "U"}
        </Avatar>
        <Box>
          <Typography variant="subtitle1">
            {user?.username || "User"}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {user?.email || ""}
          </Typography>
        </Box>
      </Box>

      <Divider />

      <MenuItem
        onClick={() => {
          navigate("/dashboard");
          handleMenuClose();
        }}
      >
        <ListItemIcon>
          <DashboardIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Dashboard</ListItemText>
      </MenuItem>

      <MenuItem
        onClick={() => {
          navigate("/profile");
          handleMenuClose();
        }}
      >
        <ListItemIcon>
          <AccountCircleIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Profile</ListItemText>
      </MenuItem>



      <Divider />

      <MenuItem onClick={handleLogout}>
        <ListItemIcon>
          <LogoutIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Logout</ListItemText>
      </MenuItem>
    </Menu>
  );

  const mobileDrawer = (
    <Drawer
      anchor="right"
      open={mobileMenuOpen}
      onClose={handleMobileMenuToggle}
    >
      <Box sx={{ width: 250, role: "presentation" }}>
        <List>
          <ListItem sx={{ justifyContent: "center", pt: 2, pb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              Online Bookstore
            </Typography>
          </ListItem>

          <Divider />

          {!isAuthenticated ? (
            <>
              <ListItemButton
                component={RouterLink}
                to="/login"
                onClick={handleMobileMenuToggle}
              >
                <ListItemIcon>
                  <LoginIcon />
                </ListItemIcon>
                <ListItemText primary="Login" />
              </ListItemButton>

              <ListItemButton
                component={RouterLink}
                to="/register"
                onClick={handleMobileMenuToggle}
              >
                <ListItemIcon>
                  <PersonAddIcon />
                </ListItemIcon>
                <ListItemText primary="Register" />
              </ListItemButton>
            </>
          ) : (
            <>
              <ListItem sx={{ p: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      mr: 2,
                      bgcolor: "primary.main",
                    }}
                  >
                    {user?.username?.charAt(0).toUpperCase() || "U"}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2">
                      {user?.username || "User"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {user?.email || ""}
                    </Typography>
                  </Box>
                </Box>
              </ListItem>

              <Divider />

              <ListItemButton
                component={RouterLink}
                to="/dashboard"
                onClick={handleMobileMenuToggle}
              >
                <ListItemIcon>
                  <DashboardIcon />
                </ListItemIcon>
                <ListItemText primary="Dashboard" />
              </ListItemButton>

              <ListItemButton
                component={RouterLink}
                to="/profile"
                onClick={handleMobileMenuToggle}
              >
                <ListItemIcon>
                  <AccountCircleIcon />
                </ListItemIcon>
                <ListItemText primary="Profile" />
              </ListItemButton>



              <ListItemButton
                onClick={() => {
                  logout();
                  handleMobileMenuToggle();
                  navigate("/");
                }}
              >
                <ListItemIcon>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText primary="Logout" />
              </ListItemButton>
            </>
          )}

          <Divider />

          <ListItemButton
            component={RouterLink}
            to="/"
            onClick={handleMobileMenuToggle}
          >
            <ListItemIcon>
              <BookIcon />
            </ListItemIcon>
            <ListItemText primary="Home" />
          </ListItemButton>

          <ListItemButton
            component={RouterLink}
            to="/books"
            onClick={handleMobileMenuToggle}
          >
            <ListItemIcon>
              <SearchIcon />
            </ListItemIcon>
            <ListItemText primary="Browse Books" />
          </ListItemButton>

          <ListItemButton
            component={RouterLink}
            to="/cds"
            onClick={handleMobileMenuToggle}
          >
            <ListItemIcon>
              <SearchIcon />
            </ListItemIcon>
            <ListItemText primary="Browse CDs" />
          </ListItemButton>

          <ListItemButton
            component={RouterLink}
            to="/dvds"
            onClick={handleMobileMenuToggle}
          >
            <ListItemIcon>
              <SearchIcon />
            </ListItemIcon>
            <ListItemText primary="Browse DVDs" />
          </ListItemButton>
        </List>
      </Box>
    </Drawer>
  );

  return (
    <AppBar position="sticky">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/* Logo */}
          <Box
            component={RouterLink}
            to="/"
            sx={{
              display: "flex",
              alignItems: "center",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <BookIcon sx={{ display: { xs: "none", sm: "flex" }, mr: 1 }} />
            <Typography
              variant="h6"
              noWrap
              sx={{
                display: { xs: "none", sm: "flex" },
                fontWeight: 700,
                letterSpacing: ".1rem",
                color: "inherit",
                textDecoration: "none",
              }}
            >
              BOOKSTORE
            </Typography>
          </Box>

          {/* Mobile Logo */}
          <Box
            component={RouterLink}
            to="/"
            sx={{
              flexGrow: 1,
              display: { xs: "flex", sm: "none" },
              textDecoration: "none",
              color: "inherit",
              alignItems: "center",
            }}
          >
            <BookIcon sx={{ mr: 1 }} />
            <Typography
              variant="h6"
              noWrap
              sx={{
                fontWeight: 700,
                letterSpacing: ".1rem",
              }}
            >
              BOOKSTORE
            </Typography>
          </Box>

          {/* Desktop Navigation */}
          <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}>
            <Button
              component={RouterLink}
              to="/books"
              color="inherit"
              sx={{ mx: 1 }}
            >
              Browse Books
            </Button>
            <Button
              component={RouterLink}
              to="/cds"
              color="inherit"
              sx={{ mx: 1 }}
            >
              Browse CDs
            </Button>
            <Button
              component={RouterLink}
              to="/dvds"
              color="inherit"
              sx={{ mx: 1 }}
            >
              Browse DVDs
            </Button>
          </Box>

          {/* Cart Icon */}
          <Box>
            <IconButton
              size="large"
              aria-label="Show cart items"
              color="inherit"
              component={RouterLink}
              to="/cart"
            >
              <Badge badgeContent={totalItems} color="error">
                <ShoppingCartIcon />
              </Badge>
            </IconButton>
          </Box>

          {/* User Menu */}
          {!isMobile && (
            <Box sx={{ ml: 2 }}>
              {isAuthenticated ? (
                <IconButton
                  size="large"
                  edge="end"
                  aria-label="account of current user"
                  aria-controls={menuId}
                  aria-haspopup="true"
                  onClick={handleProfileMenuOpen}
                  color="inherit"
                >
                  <AccountCircleIcon />
                </IconButton>
              ) : (
                <Box>
                  <Button
                    color="inherit"
                    component={RouterLink}
                    to="/login"
                    sx={{ mr: 1 }}
                  >
                    Login
                  </Button>
                  <Button
                    variant="outlined"
                    color="inherit"
                    component={RouterLink}
                    to="/register"
                  >
                    Register
                  </Button>
                </Box>
              )}
            </Box>
          )}

          {/* Mobile Menu Toggle */}
          {isMobile && (
            <IconButton
              size="large"
              edge="end"
              color="inherit"
              aria-label="menu"
              sx={{ ml: 1 }}
              onClick={handleMobileMenuToggle}
            >
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
      </Container>
      {renderMenu}
      {mobileDrawer}
    </AppBar>
  );
};

export default NavigationBar;
