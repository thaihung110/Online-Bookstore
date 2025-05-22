import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAdminAuthStore } from "../../store/adminAuthStore";
import { CircularProgress } from "@mui/material";

interface AdminProtectedRouteProps {
  children?: React.ReactNode;
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({
  children,
}) => {
  const { isAuthenticated, isLoading } = useAdminAuthStore();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </div>
    );
  }

  // Redirect to admin login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" />;
  }

  // Render either children or outlet
  return <>{children ? children : <Outlet />}</>;
};

export default AdminProtectedRoute;
