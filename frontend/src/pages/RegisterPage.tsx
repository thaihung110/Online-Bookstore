import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container } from "@mui/material";
import RegisterForm from "../components/auth/RegisterForm";
import { useAuthStore } from "../store/authStore";

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  // Redirect to home if user is already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  return (
    <Container maxWidth="sm" sx={{ pt: 4 }}>
      <RegisterForm />
    </Container>
  );
};

export default RegisterPage;
