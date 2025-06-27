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
import { DVDFormData } from "../types/dvd.types";
import { getDVD, createDVD, updateDVD, uploadDVDCover } from "../api/dvdApi";

// Available dvd genres
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

const DVDFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isEditMode = !!id;

  // Calculate current price based on original price and discount rate
  const calculateCurrentPrice = (originalPrice: number, discountRate: number): number => {
    return originalPrice * (1 - discountRate / 100);
  };

  // Form state
  const [formData, setFormData] = useState<DVDFormData>({
    title: "",
    originalPrice: 0,
    stock: 0,
    price: 0, // Calculated field
    coverImage: null,
    coverImageUrl: "",
    isAvailableRush: true, // New field for rush delivery
    disctype: "",
    director: "",
    runtime: 0, // Runtime in minutes
    studio: "",
    subtitles: "", // List of subtitles available
    releaseddate: new Date().toISOString().split("T")[0], // Default to today
    filmtype:"",


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

  // Load dvd data if in edit mode
  useEffect(() => {
    const loadDVD = async () => {
      if (!isEditMode) return;

      try {
        setLoading(true);
        const dvdData = await getDVD(id);



        setFormData({
          title: dvdData.title || "",
          originalPrice: dvdData.originalPrice || 0,
          price: dvdData.price || 0,
          stock: dvdData.stock || 0,
          coverImageUrl: dvdData.coverImage || "",
          isAvailableRush: dvdData.isAvailableRush !== undefined ? dvdData.isAvailableRush : true, // Default to true if not set
        disctype: dvdData.disctype || "",
            director: dvdData.director || "",
            runtime: dvdData.runtime || 0, // Runtime in minutes
            studio: dvdData.studio || "",
            subtitles: dvdData.subtitles || "", // List of subtitles available
            releaseddate: dvdData.releaseddate.slice(0,10) || new Date().toISOString().split("T")[0], // Default to today
            filmtype: dvdData.filmtype || "", // New field for film type

        });

        // Set preview URL for existing image
        setPreviewUrl(dvdData.coverImage || "");
      } catch (err) {
        console.error("Failed to load dvd:", err);
        setError("Failed to load dvd data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadDVD();
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


  const handleRushDeliveryChange = (e: SelectChangeEvent<string>) => {
    const value = e.target.value === "true";
    setFormData((prev) => ({ 
      ...prev, 
      isAvailableRush: value 
    }));
  
    // Clear error if exists
    if (errors.isAvailableRush) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.isAvailableRush;
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
   


    // Original price validation
    if (formData.originalPrice <= 0) {
      newErrors.originalPrice = "Original price must be greater than 0";
    }

    if (formData.price <= 0) {
      newErrors.originalPrice = "Original price must be greater than 0";
    }


    if( (formData.price / formData.originalPrice) < 0.3 || (formData.price / formData.originalPrice) > 1.5) {
      newErrors.originalPrice = "Price must be between 30% and 150% of the original price";
    }

    // Stock quantity validation
    if (formData.stock < 0) {
      newErrors.stock = "Stock quantity cannot be negative";
    }

    // // Cover image validation for new dvds
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
          const s3Key = await uploadDVDCover(selectedFile, (progress) => {
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
        await updateDVD(id, finalFormData);
        setSuccess("DVD updated successfully");
      } else {
        await createDVD(finalFormData);
        setSuccess("DVD created successfully");

        // Clear form data on successful creation
        setFormData({
          title: "",
          originalPrice: 0,
          price: 0, // Reset price
          stock: 0,
          coverImage: null,
          coverImageUrl: "",
          isAvailableRush: true, // Reset rush delivery option
            disctype: "",
            director: "",
            runtime: 0, // Reset runtime
            studio: "",
            subtitles: "", // Reset subtitles
            releaseddate: new Date().toISOString().split("T")[0], // Reset to today
            filmtype: "", // Reset film type
        });
        setSelectedFile(null);
        setPreviewUrl("");
      }

      // Navigate back to dvd list after a short delay
      setTimeout(() => {
        navigate("/admin/books");
      }, 1500);
    } catch (err) {
      console.error("Failed to save dvd:", err);
      setError("Failed to save dvd. Please try again.");

    } finally {
      setSaving(false);
    }
  };


  // Handle navigation back to dvd list
  const handleBack = () => {
    navigate("/admin/books");
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
          {isEditMode ? "Edit DVD" : "Add New DVD"}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
        >
          Back to DVD
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
                DVD Information
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

                


        
               
            
                <Grid size={6}>
                  <TextField
                    fullWidth
                    required
                    label="Director"
                    name="director"
                    value={formData.director}
                    onChange={handleInputChange}
                    error={!!errors.director}
                    helperText={errors.director}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    required
                    label="Runtime (minutes)"
                    name="runtime"
                    type="number"
                    value={formData.runtime === 0 ? "" : formData.runtime}
                    onChange={handleNumberInputChange}
                    InputProps={{ inputProps: { min: 0 } }}
                    error={!!errors.runtime}
                    helperText={errors.runtime || "Duration in minutes"}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    required
                    label="Studio"
                    name="studio"
                    value={formData.studio}
                    onChange={handleInputChange}
                    error={!!errors.studio}
                    helperText={errors.studio}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    required
                    label="Film Type"
                    name="filmtype"
                    value={formData.filmtype}
                    onChange={handleInputChange}
                    error={!!errors.filmtype}
                    helperText={errors.filmtype || "e.g. Feature Film, Documentary"}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    required
                    label="Disc Type"
                    name="disctype"
                    value={formData.disctype}
                    onChange={handleInputChange}
                    error={!!errors.disctype}
                    helperText={errors.disctype || "e.g. DVD, Blu-ray"}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    required
                    label="Released Date"
                    name="releaseddate"
                    type="date"
                    value={formData.releaseddate}
                    onChange={handleInputChange}
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.releaseddate}
                    helperText={errors.releaseddate || "Release date of the DVD"}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Subtitles (comma separated)"
                    name="subtitles"
                    value={formData.subtitles}
                    onChange={handleInputChange}
                    error={!!errors.subtitles}
                    helperText={errors.subtitles || "Available subtitles (e.g. English, Spanish)"}
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
                  <FormControl fullWidth>
                    <InputLabel id="rush-delivery-label">Rush Delivery</InputLabel>
                    <Select
                      labelId="rush-delivery-label"
                      name="isAvailableRush"
                      value={formData.isAvailableRush ? "true" : "false"}
                      onChange={handleRushDeliveryChange}
                      label="Rush Delivery"
                    >
                      <MenuItem value="true">Available</MenuItem>
                      <MenuItem value="false">Not Available</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* <Grid size={6}>
                  <TextField
                    fullWidth
                    required
                    label="Discount Rate (%)"
                    name="discountRate"
                    type="number"
                    value={formData}
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
                </Grid> */}


                <Grid size={6}>
                  <TextField
                    fullWidth
                    required
                    label="Price"
                    name="price"
                    type="number"
                    value={formData.price === 0 ? "" : formData.price}
                    onChange={handleNumberInputChange}
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                      inputProps: { min: 0, step: 0.01 },
                    }}
                    error={!!errors.price}
                    helperText={errors.price || "The final price after any discounts"}
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
                    alt="DVD cover preview"
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
                ? "Update DVD"
                : "Add DVD"
              }
            </Button>
          </Box>

        </Box>
      </Paper>
    </Box>
  );
};


export default DVDFormPage;

