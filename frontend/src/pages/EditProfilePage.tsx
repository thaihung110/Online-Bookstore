import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  CircularProgress,
  Alert,
} from "@mui/material";
import MainLayout from "../components/layouts/MainLayout";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";

// Placeholder for update user API function type
// import { updateUser, UpdateUserRequest } from '../api/users'; // Assuming an api/users.ts might exist

const EditProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, token, fetchCurrentUser } = useAuthStore(); // Assuming fetchCurrentUser updates the user object in store

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  // const [currentPassword, setCurrentPassword] = useState(''); // For password change
  // const [newPassword, setNewPassword] = useState('');
  // const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setEmail(user.email);
    } else {
      // If no user data (e.g., direct navigation to this page without being logged in),
      // redirect or handle appropriately. ProtectedRoute should ideally prevent this.
      navigate("/login");
    }
  }, [user, navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (!user || !token) {
      setError("Authentication details are missing.");
      setIsLoading(false);
      return;
    }

    // Basic validation
    if (!username.trim()) {
      setError("Username cannot be empty.");
      setIsLoading(false);
      return;
    }

    // const updateData: UpdateUserRequest = {
    //   username,
    // email, // If email change is allowed
    // currentPassword, // If password change is implemented
    // newPassword,
    // };

    try {
      // Placeholder for API call
      console.log("Submitting profile update:", { username });
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      // const updatedUser = await updateUser(user.id, updateData, token);
      // await fetchCurrentUser(); // Re-fetch user data to update the store

      setSuccessMessage("Profile updated successfully!");
      // Optionally navigate away or show success inline
      // navigate('/dashboard');
    } catch (err) {
      const apiError =
        err instanceof Error ? err.message : "Failed to update profile.";
      setError(apiError);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    // Should be handled by ProtectedRoute, but as a fallback:
    return (
      <MainLayout>
        <Container sx={{ py: 4 }}>
          <CircularProgress />
        </Container>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Edit Profile
          </Typography>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Username"
                  variant="outlined"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Email (cannot be changed)"
                  variant="outlined"
                  value={email}
                  disabled // Assuming email is not editable for now
                />
              </Grid>

              {/* Placeholder for password change fields 
              <Grid size={12}>
                <Typography variant="h6" sx={{mt: 2}}>Change Password</Typography>
              </Grid>
              <Grid size={12}>
                <TextField fullWidth label="Current Password" type="password" variant="outlined" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              </Grid>
              <Grid size={12}>
                <TextField fullWidth label="New Password" type="password" variant="outlined" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </Grid>
              <Grid size={12}>
                <TextField fullWidth label="Confirm New Password" type="password" variant="outlined" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} />
              </Grid>
              */}

              <Grid size={12} sx={{ mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={isLoading}
                  startIcon={
                    isLoading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : null
                  }
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={() => navigate("/dashboard")}
                  sx={{ ml: 2 }}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </Grid>

              {error && (
                <Grid size={12}>
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                  </Alert>
                </Grid>
              )}
              {successMessage && (
                <Grid size={12}>
                  <Alert severity="success" sx={{ mt: 2 }}>
                    {successMessage}
                  </Alert>
                </Grid>
              )}
            </Grid>
          </form>
        </Paper>
      </Container>
    </MainLayout>
  );
};

export default EditProfilePage;
