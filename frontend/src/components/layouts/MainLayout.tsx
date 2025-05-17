import React, { useState } from "react";
import {
  Box,
  Container,
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  useTheme,
  Badge,
  InputBase,
  alpha,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  useMediaQuery,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
} from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useCartStore } from "../../store/cartStore";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import PersonIcon from "@mui/icons-material/Person";
import HomeIcon from "@mui/icons-material/Home";
import BookIcon from "@mui/icons-material/Book";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import DashboardIcon from "@mui/icons-material/Dashboard";
import InstagramIcon from "@mui/icons-material/Instagram";
import FacebookIcon from "@mui/icons-material/Facebook";
import TwitterIcon from "@mui/icons-material/Twitter";
import LocalLibraryIcon from "@mui/icons-material/LocalLibrary";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuthStore();
  const cartStore = useCartStore();
  const totalItems = cartStore.getTotalItems();

  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const profileMenuOpen = Boolean(anchorEl);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    logout();
    navigate("/login");
  };

  const handleViewProfile = () => {
    handleProfileMenuClose();
    navigate("/dashboard");
  };

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/books?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
      setDrawerOpen(false);
    }
  };

  const drawerItems = [
    { text: "Home", icon: <HomeIcon />, path: "/" },
    { text: "Books", icon: <BookIcon />, path: "/books" },
    ...(isAuthenticated
      ? [
          { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
          { text: "Wishlist", icon: <BookmarkIcon />, path: "/wishlist" },
        ]
      : []),
  ];

  const drawer = (
    <Box sx={{ width: 250 }} role="presentation">
      <Box
        sx={{
          p: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          bgcolor: "primary.main",
          color: "white",
        }}
      >
        <LocalLibraryIcon sx={{ fontSize: 40, mb: 1 }} />
        <Typography variant="h6" component="div">
          Online Bookstore
        </Typography>
      </Box>
      <Divider />
      <List>
        {" "}
        {drawerItems.map((item) => (
          <ListItem
            key={item.text}
            component={RouterLink}
            to={item.path}
            onClick={() => setDrawerOpen(false)}
            sx={{ cursor: "pointer" }}
          >
            {" "}
            <ListItemIcon>{item.icon}</ListItemIcon>{" "}
            <ListItemText primary={item.text} />{" "}
          </ListItem>
        ))}{" "}
      </List>{" "}
      <Divider />{" "}
      <List>
        {" "}
        {isAuthenticated ? (
          <ListItem onClick={handleLogout} sx={{ cursor: "pointer" }}>
            {" "}
            <ListItemIcon>
              {" "}
              <ExitToAppIcon />{" "}
            </ListItemIcon>{" "}
            <ListItemText primary="Logout" />{" "}
          </ListItem>
        ) : (
          <>
            {" "}
            <ListItem
              component={RouterLink}
              to="/login"
              onClick={() => setDrawerOpen(false)}
              sx={{ cursor: "pointer" }}
            >
              {" "}
              <ListItemIcon>
                {" "}
                <PersonIcon />{" "}
              </ListItemIcon>{" "}
              <ListItemText primary="Login" />{" "}
            </ListItem>{" "}
            <ListItem
              component={RouterLink}
              to="/register"
              onClick={() => setDrawerOpen(false)}
              sx={{ cursor: "pointer" }}
            >
              {" "}
              <ListItemIcon>
                {" "}
                <PersonIcon />{" "}
              </ListItemIcon>{" "}
              <ListItemText primary="Register" />{" "}
            </ListItem>{" "}
          </>
        )}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <AppBar
        position="sticky"
        elevation={0}
        color="default"
        sx={{ bgcolor: "white", borderBottom: 1, borderColor: "divider" }}
      >
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: "block", md: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ display: "flex", alignItems: "center" }}>
            <LocalLibraryIcon color="primary" sx={{ mr: 1, fontSize: 28 }} />
            <Typography
              variant="h6"
              component={RouterLink}
              to="/"
              sx={{
                fontFamily: "'Playfair Display', serif",
                textDecoration: "none",
                color: "primary.main",
                fontWeight: 700,
                display: { xs: "none", sm: "block" },
              }}
            >
              Online Bookstore
            </Typography>
          </Box>

          <Box
            sx={{
              ml: 3,
              display: { xs: "none", md: "flex" },
              alignItems: "center",
            }}
          >
            <Button
              component={RouterLink}
              to="/"
              color="inherit"
              sx={{ mx: 1 }}
            >
              Home
            </Button>
            <Button
              component={RouterLink}
              to="/books"
              color="inherit"
              sx={{ mx: 1 }}
            >
              Books
            </Button>
          </Box>

          <Box
            component="form"
            onSubmit={handleSearchSubmit}
            sx={{
              position: "relative",
              ml: 2,
              borderRadius: theme.shape.borderRadius,
              backgroundColor: alpha(theme.palette.common.black, 0.05),
              "&:hover": {
                backgroundColor: alpha(theme.palette.common.black, 0.1),
              },
              width: { xs: "100%", md: "auto" },
              flexGrow: { xs: 1, md: 0.5 },
              mr: { xs: 1, md: 2 },
              display: { xs: "none", sm: "block" },
            }}
          >
            <Box
              sx={{
                p: "0 16px",
                height: "100%",
                position: "absolute",
                display: "flex",
                alignItems: "center",
              }}
            >
              <SearchIcon />
            </Box>
            <InputBase
              placeholder="Search books…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                color: "inherit",
                width: "100%",
                pl: 6,
                pr: 1,
                py: 1,
                "& .MuiInputBase-input": {
                  transition: theme.transitions.create("width"),
                },
              }}
            />
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <IconButton
            color="inherit"
            component={RouterLink}
            to="/cart"
            aria-label="cart"
            sx={{ mr: 1 }}
          >
            <Badge badgeContent={totalItems} color="secondary">
              <ShoppingCartIcon />
            </Badge>
          </IconButton>

          {isAuthenticated ? (
            <>
              <Tooltip title={user?.username || "Profile"}>
                <IconButton onClick={handleProfileMenuOpen} color="inherit">
                  <Avatar
                    sx={{ width: 32, height: 32, bgcolor: "secondary.main" }}
                    alt={user?.username}
                    src={user?.username?.charAt(0).toUpperCase()}
                  />
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={anchorEl}
                open={profileMenuOpen}
                onClose={handleProfileMenuClose}
                MenuListProps={{
                  "aria-labelledby": "basic-button",
                }}
                transformOrigin={{ horizontal: "right", vertical: "top" }}
                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
              >
                <MenuItem onClick={handleViewProfile}>
                  <ListItemIcon>
                    <DashboardIcon fontSize="small" />
                  </ListItemIcon>
                  View Profile
                </MenuItem>
                <MenuItem onClick={handleProfileMenuClose}>
                  <ListItemIcon>
                    {/* <SettingsIcon fontSize="small" /> */}
                  </ListItemIcon>
                  Settings
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <ExitToAppIcon fontSize="small" />
                  </ListItemIcon>
                  Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Box sx={{ display: { xs: "none", sm: "block" } }}>
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
                color="primary"
                component={RouterLink}
                to="/register"
              >
                Register
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        {drawer}
      </Drawer>

      <Container
        component="main"
        sx={{
          flexGrow: 1,
          py: 4,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </Container>

      <Box
        component="footer"
        sx={{
          py: 4,
          px: 2,
          mt: "auto",
          bgcolor: "background.paper",
          borderTop: 1,
          borderColor: "divider",
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: "flex", flexWrap: "wrap", mx: -2 }}>
            <GridItem size={12} md={4} sx={{ px: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <LocalLibraryIcon
                  color="primary"
                  sx={{ mr: 1, fontSize: 24 }}
                />
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: "'Playfair Display', serif",
                    color: "primary.main",
                    fontWeight: 700,
                  }}
                >
                  Online Bookstore
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                Your destination for quality books with a curated selection
                spanning fiction, non-fiction, children's literature, and
                specialty titles.
              </Typography>
              <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                <IconButton aria-label="facebook" size="small">
                  <FacebookIcon fontSize="small" />
                </IconButton>
                <IconButton aria-label="twitter" size="small">
                  <TwitterIcon fontSize="small" />
                </IconButton>
                <IconButton aria-label="instagram" size="small">
                  <InstagramIcon fontSize="small" />
                </IconButton>
              </Box>
            </GridItem>

            <GridItem size={12} md={2} sx={{ mt: { xs: 3, md: 0 }, px: 2 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Quick Links
              </Typography>
              <List dense disablePadding>
                {["Home", "Books", "Cart"].map((text) => (
                  <ListItem
                    key={text}
                    disablePadding
                    component={RouterLink}
                    to={text === "Home" ? "/" : `/${text.toLowerCase()}`}
                    sx={{
                      color: "text.secondary",
                      textDecoration: "none",
                      py: 0.5,
                    }}
                  >
                    <Typography variant="body2">{text}</Typography>
                  </ListItem>
                ))}
              </List>
            </GridItem>

            <GridItem size={12} md={2} sx={{ mt: { xs: 3, md: 0 }, px: 2 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Customer Service
              </Typography>
              <List dense disablePadding>
                {["Orders", "Returns", "Contact Us", "FAQs"].map((text) => (
                  <ListItem
                    key={text}
                    disablePadding
                    component={RouterLink}
                    to="#"
                    sx={{
                      color: "text.secondary",
                      textDecoration: "none",
                      py: 0.5,
                    }}
                  >
                    <Typography variant="body2">{text}</Typography>
                  </ListItem>
                ))}
              </List>
            </GridItem>

            <GridItem size={12} md={4} sx={{ mt: { xs: 3, md: 0 }, px: 2 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Subscribe to Our Newsletter
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Stay updated with new releases and exclusive offers.
              </Typography>
              <Box component="form" noValidate sx={{ mt: 1 }}>
                <InputBase
                  placeholder="Your email address"
                  sx={{
                    bgcolor: "background.default",
                    p: 1,
                    px: 2,
                    borderRadius: 1,
                    width: "100%",
                    mb: 1,
                    border: 1,
                    borderColor: "divider",
                  }}
                />
                <Button variant="contained" fullWidth>
                  Subscribe
                </Button>
              </Box>
            </GridItem>
          </Box>
          <Divider sx={{ my: 3 }} />
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} Online Bookstore. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

const GridItem = ({ children, size, md, ...props }: any) => (
  <Box
    sx={{
      width: "100%",
      ...(md && {
        [md === true ? "md" : `md`]: { width: `${(md / 12) * 100}%` },
      }),
      ...(size && {
        ...(typeof size === "object"
          ? Object.entries(size).reduce(
              (acc, [breakpoint, cols]) => ({
                ...acc,
                [breakpoint]: { width: `${(Number(cols) / 12) * 100}%` },
              }),
              {}
            )
          : { xs: { width: `${(size / 12) * 100}%` } }),
      }),
    }}
    {...props}
  >
    {" "}
    {children}{" "}
  </Box>
);

export default MainLayout;
