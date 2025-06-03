import React from "react";
import {
  Box,
  Container,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Breadcrumbs,
  Link,
  useMediaQuery,
  useTheme,
  Avatar,
  Tooltip,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Book as BookIcon,
  People as PeopleIcon,
  Category as CategoryIcon,
  ShoppingCart as OrdersIcon,
  Settings as SettingsIcon,
  Home as HomeIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";
import {
  Link as RouterLink,
  useLocation,
  Link as RouterDomLink,
  Outlet,
  useNavigate,
} from "react-router-dom";
import { useAdminAuthStore } from "../../store/adminAuthStore";

// Define the drawer width
const DRAWER_WIDTH = 240;

// Menu items for the sidebar
const MENU_ITEMS = [
  { text: "Books", icon: <BookIcon />, path: "/admin/books" },
  { text: "Orders", icon: <OrdersIcon />, path: "/admin/orders" },
  { text: "Users", icon: <PeopleIcon />, path: "/admin/users" },
];

// Route mapping for breadcrumbs
const ROUTE_MAPPING: Record<string, string> = {
  admin: "Admin",
  books: "Books",
  users: "Users",
  categories: "Categories",
  orders: "Orders",
  settings: "Settings",
  add: "Add",
  edit: "Edit",
};

/**
 * Admin layout component with responsive sidebar and breadcrumbs
 */
const AdminLayout: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAdminAuthStore();

  // Toggle the mobile drawer
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Handle admin logout
  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  // Generate breadcrumbs based on current route
  const generateBreadcrumbs = () => {
    const paths = location.pathname.split("/").filter(Boolean);
    let currentPath = "";

    return paths
      .map((path, index) => {
        currentPath += `/${path}`;

        // Skip numeric IDs in paths
        if (!isNaN(Number(path))) {
          return null;
        }

        const isLast = index === paths.length - 1;
        const label = ROUTE_MAPPING[path] || path;

        return isLast ? (
          <Typography key={path} color="text.primary">
            {label}
          </Typography>
        ) : (
          <Link
            component={RouterLink}
            to={currentPath}
            key={path}
            color="inherit"
            underline="hover"
          >
            {label}
          </Link>
        );
      })
      .filter(Boolean);
  };

  // Drawer content
  const drawer = (
    <>
      <Toolbar sx={{ justifyContent: "center" }}>
        <Typography variant="h6" noWrap component="div">
          Bookstore Admin
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {MENU_ITEMS.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={RouterDomLink}
              to={item.path}
              selected={location.pathname === item.path}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton component={RouterDomLink} to="/">
            <ListItemIcon>
              <HomeIcon />
            </ListItemIcon>
            <ListItemText primary="Back to Store" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </>
  );

  return (
    <Box sx={{ display: "flex" }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Admin Panel
          </Typography>
          <Tooltip title="Profile">
            <IconButton color="inherit" size="small">
              <Avatar sx={{ width: 32, height: 32 }}>A</Avatar>
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Side Drawer - Mobile */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: DRAWER_WIDTH,
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Side Drawer - Desktop */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: DRAWER_WIDTH,
          },
        }}
        open
      >
        {drawer}
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
        }}
      >
        <Toolbar /> {/* Spacer for appbar */}
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
          <Link
            component={RouterLink}
            to="/admin/books"
            color="inherit"
            underline="hover"
          >
            Admin
          </Link>
          {generateBreadcrumbs()}
        </Breadcrumbs>
        <Container maxWidth="xl" disableGutters>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
};

export default AdminLayout;
