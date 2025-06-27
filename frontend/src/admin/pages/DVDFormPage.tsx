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
import { getDVDById, createDVD, updateDVD, getDVDFilmTypes, getDVDDiscTypes } from "../api/dvdApi";
import { DVD, DVDFormData } from "../types/dvd.types";

// Initial form data
const INITIAL_FORM_DATA: DVDFormData = {
  title: "",
  director: "",
  runtime: 0,
  studio: "",
  subtitles: "",
  releaseddate: "",
  filmtype: "",
  disctype: "",
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

const DVDFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  // Form state
  const [formData, setFormData] = useState<DVDFormData>(INITIAL_FORM_DATA);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filmTypes, setFilmTypes] = useState<string[]>([]);
  const [discTypes, setDiscTypes] = useState<string[]>([]);

  // Load film types and disc types
  useEffect(() => {
    const loadTypes = async () => {
      try {
        const [filmTypesData, discTypesData] = await Promise.all([
          getDVDFilmTypes(),
          getDVDDiscTypes()
        ]);
        setFilmTypes(filmTypesData);
        setDiscTypes(discTypesData);
      } catch (err) {
        console.error("Failed to load types:", err);
      }
    };
    loadTypes();
  }, []);

  // Load DVD data for editing
  useEffect(() => {
    if (isEdit && id) {
      const loadDVD = async () => {
        setLoading(true);
        try {
          const dvd = await getDVDById(id);
          setFormData({
            title: dvd.title,
            director: dvd.director,
            runtime: dvd.runtime,
            studio: dvd.studio,
            subtitles: dvd.subtitles,
            releaseddate: dvd.releaseddate ? new Date(dvd.releaseddate).toISOString().split('T')[0] : "",
            filmtype: dvd.filmtype,
            disctype: dvd.disctype,
            description: dvd.description || "",
            originalPrice: dvd.originalPrice,
            discountRate: dvd.discountRate,
            price: dvd.price,
            stock: dvd.stock,
            coverImage: dvd.coverImage || "",
            isAvailable: dvd.isAvailable !== false,
            isFeatured: dvd.isFeatured || false,
            isAvailableForPreOrder: dvd.isAvailableForPreOrder || false,
            preOrderReleaseDate: dvd.preOrderReleaseDate ? new Date(dvd.preOrderReleaseDate).toISOString().split('T')[0] : "",
          });
        } catch (err: any) {
          setError(err.message || "Failed to load DVD");
        } finally {
          setLoading(false);
        }
      };
      loadDVD();
    }
  }, [isEdit, id]);

  // Handle form field changes
  const handleChange = (field: keyof DVDFormData) => (
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
    if (!formData.title || !formData.director || !formData.studio) {
      setError("Please fill in all required fields");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Prepare data for submission
      const submitData: DVDFormData = {
        ...formData,
        runtime: Number(formData.runtime),
        originalPrice: Number(formData.originalPrice),
        discountRate: Number(formData.discountRate),
        price: Number(formData.price),
        stock: Number(formData.stock),
      };

      if (isEdit && id) {
        await updateDVD(id, submitData);
      } else {
        await createDVD(submitData);
      }

      navigate("/admin/dvds");
    } catch (err: any) {
      setError(err.message || "Failed to save DVD");
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate("/admin/dvds");
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
        <Link component={RouterLink} to="/admin/dvds" underline="hover">
          DVDs
        </Link>
        <Typography color="text.primary">
          {isEdit ? "Edit DVD" : "Add New DVD"}
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Typography variant="h4" component="h1" fontWeight="bold" mb={3}>
        {isEdit ? "Edit DVD" : "Add New DVD"}
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
                label="Director *"
                value={formData.director}
                onChange={handleChange("director")}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Studio *"
                value={formData.studio}
                onChange={handleChange("studio")}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Runtime (minutes) *"
                value={formData.runtime}
                onChange={handleChange("runtime")}
                inputProps={{ min: 1 }}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                select
                label="Film Type"
                value={formData.filmtype}
                onChange={handleChange("filmtype")}
              >
                {filmTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                select
                label="Disc Type"
                value={formData.disctype}
                onChange={handleChange("disctype")}
              >
                {discTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
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
                label="Subtitles"
                value={formData.subtitles}
                onChange={handleChange("subtitles")}
                placeholder="e.g., English, Spanish, French"
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
                label="Featured DVD"
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
                  {saving ? "Saving..." : isEdit ? "Update DVD" : "Create DVD"}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
};

export default DVDFormPage;