import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  FormControlLabel,
  Switch,
  MenuItem,
  CircularProgress,
  Breadcrumbs,
  Link,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { Save as SaveIcon, Cancel as CancelIcon } from "@mui/icons-material";
import { useNavigate, useParams, Link as RouterLink } from "react-router-dom";
import { getCDById, createCD, updateCD, getCDCategories } from "../api/cdApi";
import { CD, CDFormData } from "../types/cd.types";

// Initial form data
const INITIAL_FORM_DATA: CDFormData = {
  title: "",
  artist: "",
  albumTitle: "",
  trackList: "",
  category: "",
  releaseddate: "",
  description: "",
  originalPrice: 0,
  discountRate: 0,
  price: 0,
  stock: 0,
  coverImage: "",
  isAvailable: true,
  isFeatured: false,
  isAvailableForPreOrder: false,
  preOrderReleaseDate: "",
};

const CDFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  // Form state
  const [formData, setFormData] = useState<CDFormData>(INITIAL_FORM_DATA);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesData = await getCDCategories();
        setCategories(categoriesData);
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    };
    loadCategories();
  }, []);

  // Load CD data for editing
  useEffect(() => {
    if (isEdit && id) {
      const loadCD = async () => {
        setLoading(true);
        try {
          const cd = await getCDById(id);
          setFormData({
            title: cd.title,
            artist: cd.artist,
            albumTitle: cd.albumTitle,
            trackList: cd.trackList,
            category: cd.category,
            releaseddate: cd.releaseddate ? new Date(cd.releaseddate).toISOString().split('T')[0] : "",
            description: cd.description || "",
            originalPrice: cd.originalPrice,
            discountRate: cd.discountRate,
            price: cd.price,
            stock: cd.stock,
            coverImage: cd.coverImage || "",
            isAvailable: cd.isAvailable !== false,
            isFeatured: cd.isFeatured || false,
            isAvailableForPreOrder: cd.isAvailableForPreOrder || false,
            preOrderReleaseDate: cd.preOrderReleaseDate ? new Date(cd.preOrderReleaseDate).toISOString().split('T')[0] : "",
          });
        } catch (err: any) {
          setError(err.message || "Failed to load CD");
        } finally {
          setLoading(false);
        }
      };
      loadCD();
    }
  }, [isEdit, id]);

  // Handle form field changes
  const handleChange = (field: keyof CDFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { type, checked, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [field]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Basic validation
    if (!formData.title || !formData.artist || !formData.albumTitle) {
      setError("Please fill in all required fields");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Prepare data for submission
      const submitData: CDFormData = {
        ...formData,
        originalPrice: Number(formData.originalPrice),
        discountRate: Number(formData.discountRate),
        price: Number(formData.price),
        stock: Number(formData.stock),
      };

      if (isEdit && id) {
        await updateCD(id, submitData);
      } else {
        await createCD(submitData);
      }

      navigate("/admin/cds");
    } catch (err: any) {
      setError(err.message || "Failed to save CD");
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate("/admin/cds");
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link component={RouterLink} to="/admin" underline="hover">
          Dashboard
        </Link>
        <Link component={RouterLink} to="/admin/cds" underline="hover">
          CDs
        </Link>
        <Typography color="text.primary">
          {isEdit ? "Edit CD" : "Add New CD"}
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Typography variant="h4" component="h1" fontWeight="bold" mb={3}>
        {isEdit ? "Edit CD" : "Add New CD"}
      </Typography>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Form */}
      <Paper sx={{ p: 4 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Title *"
                value={formData.title}
                onChange={handleChange("title")}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Artist *"
                value={formData.artist}
                onChange={handleChange("artist")}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Album Title *"
                value={formData.albumTitle}
                onChange={handleChange("albumTitle")}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                select
                label="Category"
                value={formData.category}
                onChange={handleChange("category")}
              >
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                type="date"
                label="Release Date"
                value={formData.releaseddate}
                onChange={handleChange("releaseddate")}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Cover Image URL"
                value={formData.coverImage}
                onChange={handleChange("coverImage")}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Track List"
                value={formData.trackList}
                onChange={handleChange("trackList")}
                placeholder="Enter track list (one track per line)"
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={formData.description}
                onChange={handleChange("description")}
              />
            </Grid>

            {/* Pricing */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Pricing
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                type="number"
                label="Original Price *"
                value={formData.originalPrice}
                onChange={handleChange("originalPrice")}
                inputProps={{ min: 0, step: 0.01 }}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                type="number"
                label="Discount Rate (%)"
                value={formData.discountRate}
                onChange={handleChange("discountRate")}
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                type="number"
                label="Final Price *"
                value={formData.price}
                onChange={handleChange("price")}
                inputProps={{ min: 0, step: 0.01 }}
                required
              />
            </Grid>

            {/* Inventory */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Inventory
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Stock Quantity *"
                value={formData.stock}
                onChange={handleChange("stock")}
                inputProps={{ min: 0 }}
                required
              />
            </Grid>

            {/* Settings */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Settings
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isAvailable}
                    onChange={handleChange("isAvailable")}
                  />
                }
                label="Available for Purchase"
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isFeatured}
                    onChange={handleChange("isFeatured")}
                  />
                }
                label="Featured CD"
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isAvailableForPreOrder}
                    onChange={handleChange("isAvailableForPreOrder")}
                  />
                }
                label="Available for Pre-order"
              />
            </Grid>

            {formData.isAvailableForPreOrder && (
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Pre-order Release Date"
                  value={formData.preOrderReleaseDate}
                  onChange={handleChange("preOrderReleaseDate")}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            )}

            {/* Form Actions */}
            <Grid size={{ xs: 12 }}>
              <Box display="flex" gap={2} justifyContent="flex-end" mt={3}>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={saving}
                >
                  {saving ? "Saving..." : isEdit ? "Update CD" : "Create CD"}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
};

export default CDFormPage;