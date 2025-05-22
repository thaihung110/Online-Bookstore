import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert,
  Divider,
  useTheme,
  SelectChangeEvent,
} from "@mui/material";
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import { UserFormData, UserRole } from "../types/user.types";
import { getUser, createUser, updateUser } from "../api/userApi";

const UserFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isEditMode = !!id;

  // Form state
  const [formData, setFormData] = useState<UserFormData>({
    name: "",
    email: "",
    password: "",
    role: UserRole.USER,
    address: "",
    phone: "",
    isActive: true,
  });

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // UI state
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load user data if in edit mode
  useEffect(() => {
    const loadUser = async () => {
      if (!isEditMode) return;

      try {
        setLoading(true);
        const userData = await getUser(id);

        setFormData({
          name: userData.name,
          email: userData.email,
          password: "", // Don't load password
          role: userData.role,
          address: userData.address || "",
          phone: userData.phone || "",
          isActive: userData.isActive,
        });
      } catch (err) {
        console.error("Failed to load user:", err);
        setError("Failed to load user data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [id, isEditMode]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle select changes
  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle switch changes
  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)
    ) {
      newErrors.email = "Invalid email address";
    }

    // Password validation (required only for new users)
    if (!isEditMode && !formData.password) {
      newErrors.password = "Password is required for new users";
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    // Phone validation (if provided)
    if (formData.phone && !/^[0-9+\-() ]+$/.test(formData.phone)) {
      newErrors.phone = "Invalid phone number format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      // Scroll to the first error
      const firstError = Object.keys(errors)[0];
      const element = document.querySelector(`[name="${firstError}"]`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (isEditMode) {
        // For edit mode, only include password if provided
        const updatedData = {
          ...formData,
          ...(formData.password ? {} : { password: undefined }),
        };
        await updateUser(id, updatedData);
        setSuccess("User updated successfully");
      } else {
        await createUser(formData);
        setSuccess("User created successfully");

        // Clear form data on successful creation
        if (!isEditMode) {
          setFormData({
            name: "",
            email: "",
            password: "",
            role: UserRole.USER,
            address: "",
            phone: "",
            isActive: true,
          });
        }
      }

      // Navigate back to user list after a short delay
      setTimeout(() => {
        navigate("/admin/users");
      }, 1500);
    } catch (err) {
      console.error("Failed to save user:", err);
      setError("Failed to save user. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Handle navigation back to user list
  const handleBack = () => {
    navigate("/admin/users");
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: UserRole.USER,
      address: "",
      phone: "",
      isActive: true,
    });
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

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
        <Typography variant="h4" component="h1">
          {isEditMode ? "Edit User" : "Add New User"}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
        >
          Back to Users
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Paper elevation={3} sx={{ p: 3 }}>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Box sx={{ display: "flex", flexWrap: "wrap", mx: -1.5 }}>
            <Box sx={{ width: "100%", px: 1.5, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                User Information
              </Typography>
              <Divider sx={{ mb: 3 }} />
            </Box>

            <Box
              sx={{
                width: "100%",
                maxWidth: { xs: "100%", sm: "50%" },
                px: 1.5,
                mb: 3,
              }}
            >
              <TextField
                fullWidth
                required
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                error={!!errors.name}
                helperText={errors.name}
              />
            </Box>

            <Box
              sx={{
                width: "100%",
                maxWidth: { xs: "100%", sm: "50%" },
                px: 1.5,
                mb: 3,
              }}
            >
              <TextField
                fullWidth
                required
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                error={!!errors.email}
                helperText={errors.email}
              />
            </Box>

            <Box
              sx={{
                width: "100%",
                maxWidth: { xs: "100%", sm: "50%" },
                px: 1.5,
                mb: 3,
              }}
            >
              <TextField
                fullWidth
                label={`Password ${
                  isEditMode ? "(Leave blank to keep current)" : "(Required)"
                }`}
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                error={!!errors.password}
                helperText={errors.password}
                required={!isEditMode}
              />
            </Box>

            <Box
              sx={{
                width: "100%",
                maxWidth: { xs: "100%", sm: "50%" },
                px: 1.5,
                mb: 3,
              }}
            >
              <FormControl fullWidth>
                <InputLabel id="role-label">Role</InputLabel>
                <Select
                  labelId="role-label"
                  id="role"
                  name="role"
                  value={formData.role}
                  label="Role"
                  onChange={handleSelectChange}
                >
                  <MenuItem value={UserRole.USER}>User</MenuItem>
                  <MenuItem value={UserRole.ADMIN}>Admin</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box
              sx={{
                width: "100%",
                maxWidth: { xs: "100%", sm: "50%" },
                px: 1.5,
                mb: 3,
              }}
            >
              <TextField
                fullWidth
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                error={!!errors.phone}
                helperText={errors.phone}
              />
            </Box>

            <Box
              sx={{
                width: "100%",
                maxWidth: { xs: "100%", sm: "50%" },
                px: 1.5,
                mb: 3,
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={handleSwitchChange}
                    name="isActive"
                    color="success"
                  />
                }
                label="Active Account"
              />
            </Box>

            <Box sx={{ width: "100%", px: 1.5, mb: 3 }}>
              <TextField
                fullWidth
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                multiline
                rows={3}
              />
            </Box>

            <Box
              sx={{
                width: "100%",
                px: 1.5,
                mt: 2,
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <Button
                variant="outlined"
                color="inherit"
                onClick={handleBack}
                sx={{ mr: 2 }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={saving}
                startIcon={
                  saving ? <CircularProgress size={20} /> : <SaveIcon />
                }
              >
                {saving ? "Saving..." : isEditMode ? "Update User" : "Add User"}
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default UserFormPage;
