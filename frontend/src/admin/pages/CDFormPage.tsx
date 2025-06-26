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
  Chip,
  OutlinedInput,
  CircularProgress,
  Alert,
  Divider,
  useTheme,
  SelectChangeEvent,
  LinearProgress,
} from "@mui/material";
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  CloudUpload as CloudUploadIcon,
} from "@mui/icons-material";
import { CDFormData } from "../types/cd.types";
import { getCD, createCD, updateCD, uploadCDCover } from "../api/cdApi";

// Available cd genres
const AVAILABLE_CATEGORY = [
    "Pop",
    "Rock",
    "Hip-Hop",
    "Jazz",
    "Classical",
    "Country",
    "Electronic",
    "R&B",
    "Reggae",
    "Blues",
    "Folk",
    "Latin",
];

// Available languages
const AVAILABLE_LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Portuguese",
  "Russian",
  "Japanese",
  "Chinese",
  "Korean",
  "Arabic",
  "Hindi",
  "Vietnamese",
];

const CDFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isEditMode = !!id;

  // Calculate current price based on original price and discount rate
  const calculateCurrentPrice = (originalPrice: number, discountRate: number): number => {
    return originalPrice * (1 - discountRate / 100);
  };

  // Form state
  const [formData, setFormData] = useState<CDFormData>({
    title: "",
    artist: "",
    originalPrice: 0,
    discountRate: 0,
    stock: 0,
    coverImage: null,
    coverImageUrl: "",
    albumTitle: "",
    trackList: "",
    category: "Pop", // Default category
    releasedDate: new Date().toISOString().split("T")[0], // Default to today
  });

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // UI state
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  // Load cd data if in edit mode
  useEffect(() => {
    const loadCD = async () => {
      if (!isEditMode) return;

      try {
        setLoading(true);
        const cdData = await getCD(id);



        setFormData({
          title: cdData.title || "",
          originalPrice: cdData.originalPrice || 0,
          discountRate: cdData.discountRate || 0,
          stock: cdData.stock || 0,
          coverImageUrl: cdData.coverImage || "",

          artist: cdData.artist || "",
            albumTitle: cdData.albumTitle || "",
            trackList: cdData.trackList || "",
            category: cdData.category || "Pop", // Default to Pop if not set
            releasedDate: cdData.releasedDate || new Date().toISOString().split("T")[0], // Default to today
        });

        // Set preview URL for existing image
        setPreviewUrl(cdData.coverImage || "");
      } catch (err) {
        console.error("Failed to load cd:", err);
        setError("Failed to load cd data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadCD();
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

  // Handle number input changes
  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numberValue = value === "" ? 0 : parseFloat(value);

    setFormData((prev) => ({ ...prev, [name]: numberValue }));

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
  const handleSelectChange = (e: SelectChangeEvent<string | string[]>) => {
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



  // Handle file selection (only preview, don't upload yet)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file size must be less than 5MB');
        return;
      }

      setSelectedFile(file);
      setFormData((prev) => ({ ...prev, coverImage: file }));

      // Create a local preview URL
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Clear any previous errors
      if (errors.coverImage) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.coverImage;
          return newErrors;
        });
      }
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    // Author validation
    if (!formData.artist.trim()) {
      newErrors.author = "Artist is required";
    }


    // Original price validation
    if (formData.originalPrice <= 0) {
      newErrors.originalPrice = "Original price must be greater than 0";
    }

    // Discount rate validation
    if (formData.discountRate < 0 || formData.discountRate > 100) {
      newErrors.discountRate = "Discount rate must be between 0 and 100";
    }

    // Stock quantity validation
    if (formData.stock < 0) {
      newErrors.stock = "Stock quantity cannot be negative";
    }

    // // Cover image validation for new cds
    // if (!isEditMode && !selectedFile && !previewUrl) {
    //   newErrors.coverImage = "Cover image is required";
    // }

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
      let finalFormData = { ...formData };

      // If there's a selected file, upload it first
      if (selectedFile) {
        setUploading(true);
        try {
          const s3Key = await uploadCDCover(selectedFile, (progress) => {
            setUploadProgress(progress);
          });

          // Update form data with S3 key instead of file
          finalFormData = {
            ...finalFormData,
            coverImage: null, // Remove file object
            coverImageUrl: s3Key, // Use S3 key
          };
        } catch (uploadError) {
          console.error("Failed to upload image:", uploadError);
          setError("Failed to upload image. Please try again.");
          return;
        } finally {
          setUploading(false);
          setUploadProgress(0);
        }
      }

      if (isEditMode) {
        await updateCD(id, finalFormData);
        setSuccess("CD updated successfully");
      } else {
        await createCD(finalFormData);
        setSuccess("CD created successfully");

        // Clear form data on successful creation
        setFormData({
          title: "",
          originalPrice: 0,
          discountRate: 0,
          stock: 0,
          coverImage: null,
          coverImageUrl: "",
          artist:  "",
            albumTitle:  "",
            trackList:  "",
            category: "Pop", // Default to Pop if not set
            releasedDate:new Date().toISOString().split("T")[0], // Default to today
        });
        setSelectedFile(null);
        setPreviewUrl("");
      }

      // Navigate back to cd list after a short delay
      setTimeout(() => {
        navigate("/admin/cds");
      }, 1500);
    } catch (err) {
      console.error("Failed to save cd:", err);
      setError("Failed to save cd. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Handle navigation back to cd list
  const handleBack = () => {
    navigate("/admin/cds");
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
          {isEditMode ? "Edit CD" : "Add New CD"}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
        >
          Back to CD
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
          <Grid container spacing={3}>
            {/* Left Column */}
            <Grid size={{ xs: 12, md: 8 }}>
              <Typography variant="h6" gutterBottom>
                CD Information
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={2}>
                <Grid size={12}>
                  <TextField
                    fullWidth
                    required
                    label="Title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    error={!!errors.title}
                    helperText={errors.title}
                  />
                </Grid>

                <Grid size={12}>
                  <TextField
                    fullWidth
                    required
                    label="Artist"
                    name="artist"
                    value={formData.artist}
                    onChange={handleInputChange}
                    error={!!errors.author}
                    helperText={errors.author}
                  />
                </Grid>


        
                <Grid size={12}>
                  <TextField
                    fullWidth
                    label="Album Title"
                    name="albumTitle"
                    value={formData.albumTitle}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid size={12}>
                  <TextField
                    fullWidth
                    label="Track List"
                    name="trackList"
                    value={formData.trackList}
                    onChange={handleInputChange}
                    multiline
                    rows={4}
                    placeholder="Enter track names separated by commas"
                  />
                </Grid>
                <Grid size={6}>
                  <FormControl fullWidth>
                    <InputLabel id="category-label">Category</InputLabel>
                    <Select
                      labelId="category-label"
                      name="category"
                      value={formData.category}
                      onChange={handleSelectChange}
                      input={<OutlinedInput label="Category" />}
                      error={!!errors.category}
                    >
                      {AVAILABLE_CATEGORY.map((category) => (
                        <MenuItem key={category} value={category}>
                          {category}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.category && (
                      <FormHelperText error>{errors.category}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Released Date"
                    name="releasedDate"
                    type="date"
                    value={formData.releasedDate}
                    onChange={handleInputChange}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                

                

                <Grid size={6}>
                  <TextField
                    fullWidth
                    required
                    label="Stock Quantity"
                    name="stock"
                    type="number"
                    value={
                      formData.stock === 0 ? "" : formData.stock
                    }
                    onChange={handleNumberInputChange}
                    InputProps={{ inputProps: { min: 0 } }}
                    error={!!errors.stock}
                    helperText={errors.stock}
                  />
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                Pricing
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={2}>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    required
                    label="Original Price"
                    name="originalPrice"
                    type="number"
                    value={formData.originalPrice === 0 ? "" : formData.originalPrice}
                    onChange={handleNumberInputChange}
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                      inputProps: { min: 0, step: 0.01 },
                    }}
                    error={!!errors.originalPrice}
                    helperText={errors.originalPrice || "The original price before any discounts"}
                  />
                </Grid>

                <Grid size={6}>
                  <TextField
                    fullWidth
                    required
                    label="Discount Rate (%)"
                    name="discountRate"
                    type="number"
                    value={formData.discountRate === 0 ? "" : formData.discountRate}
                    onChange={handleNumberInputChange}
                    InputProps={{
                      endAdornment: <Typography sx={{ ml: 1 }}>%</Typography>,
                      inputProps: { min: 0, max: 100, step: 0.01 },
                    }}
                    error={!!errors.discountRate}
                    helperText={
                      errors.discountRate || "Percentage discount (0-100%)"
                    }
                  />
                </Grid>

                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Current Price (Calculated)"
                    value={`$${(calculateCurrentPrice(formData.originalPrice, formData.discountRate) || 0).toFixed(2)}`}
                    InputProps={{
                      readOnly: true,
                    }}
                    helperText="Automatically calculated from original price and discount rate"
                    sx={{
                      "& .MuiInputBase-input": {
                        backgroundColor: theme.palette.grey[100],
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Right Column */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="h6" gutterBottom>
                Cover Image
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Box
                sx={{
                  border: `1px dashed ${
                    errors.coverImage
                      ? theme.palette.error.main
                      : theme.palette.divider
                  }`,
                  borderRadius: 1,
                  p: 2,
                  mb: 2,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 300,
                  backgroundColor: "background.paper",
                }}
              >
                {previewUrl || formData.coverImageUrl ? (
                  <Box
                    component="img"
                    src={previewUrl || formData.coverImageUrl}
                    alt="CD cover preview"
                    sx={{
                      maxWidth: "100%",
                      maxHeight: 300,
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <Typography color="text.secondary" align="center">
                    No image selected
                  </Typography>
                )}
              </Box>

              <Button
                component="label"
                fullWidth
                variant="outlined"
                startIcon={<CloudUploadIcon />}
                sx={{ mb: 1 }}
              >
                Upload Cover Image
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleFileChange}
                />
              </Button>

              {errors.coverImage && (
                <FormHelperText error>{errors.coverImage}</FormHelperText>
              )}

              {uploading && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Uploading image... {uploadProgress}%
                  </Typography>
                  <LinearProgress variant="determinate" value={uploadProgress} />
                </Box>
              )}

              <Typography variant="caption" color="text.secondary">
                Recommended size: 800x1200 pixels (2:3 ratio)
              </Typography>
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end" }}>
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
              disabled={saving || uploading}
              startIcon={(saving || uploading) ? <CircularProgress size={20} /> : <SaveIcon />}
            >
              {uploading
                ? "Uploading..."
                : saving
                ? "Saving..."
                : isEditMode
                ? "Update CD"
                : "Add CD"
              }
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default CDFormPage;
