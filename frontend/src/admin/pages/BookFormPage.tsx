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
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  CloudUpload as CloudUploadIcon,
} from "@mui/icons-material";
import { BookFormData } from "../types/book.types";
import {
  getBook,
  createBook,
  updateBook,
  uploadBookCover,
} from "../api/bookApi";
import axios, { AxiosError } from "axios";

// Available book genres
const AVAILABLE_GENRES = [
  "Fiction",
  "Non-fiction",
  "Mystery",
  "Thriller",
  "Science Fiction",
  "Fantasy",
  "Romance",
  "Biography",
  "History",
  "Self-help",
  "Business",
  "Cooking",
  "Travel",
  "Science",
  "Technology",
  "Philosophy",
  "Poetry",
  "Drama",
  "Children",
  "Young Adult",
  "Dystopian",
  "Classic",
  "Horror",
  "Adventure",
  "Comics",
  "Art",
  "Religion",
  "Sports",
  "Music",
  "Educational",
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

const BookFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isEditMode = !!id;

  // Calculate current price based on original price and discount rate
  const calculateCurrentPrice = (
    originalPrice: number,
    discountRate: number
  ): number => {
    return originalPrice * (1 - discountRate / 100);
  };

  // Form state
  // const [formData, setFormData] = useState<BookFormData>({
  //   title: "",
  //   author: "",
  //   description: "",
  //   originalPrice: 0,
  //   discountRate: 0,
  //   isbn: "",
  //   publicationYear: new Date().getFullYear(),
  //   publisher: "",
  //   pageCount: 0,
  //   genres: [],
  //   language: "English",
  //   stock: 0,
  //   coverImage: null,
  //   coverImageUrl: "",
  // });

  const [formData, setFormData] = useState<BookFormData>({
    title: "",
    author: "",
    description: "",
    originalPrice: 0,
    price: 0, // Calculated field
    isbn: "",
    publicationYear: new Date().getFullYear(),
    publisher: "",
    pageCount: 0,
    genres: [],
    language: "English",
    stock: 0,
    coverImage: null,
    coverImageUrl: "",
    isAvailableRush: true, // New field for rush delivery
    weight: 0, // New field for weight
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

  // Load book data if in edit mode
  useEffect(() => {
    const loadBook = async () => {
      if (!isEditMode) return;

      try {
        setLoading(true);
        const bookData = await getBook(id);

        setFormData({
          title: bookData.title || "",
          author: bookData.author || "",
          description: bookData.description || "",
          originalPrice: bookData.originalPrice || 0,
          // price: calculateCurrentPrice(bookData.originalPrice, bookData.discountRate),
          price: bookData.price || 0, // Use price directly if available
          isbn: bookData.isbn || "",
          publicationYear: bookData.publicationYear || new Date().getFullYear(),
          publisher: bookData.publisher || "",
          pageCount: bookData.pageCount || 0,
          genres: bookData.genres || [],
          language: bookData.language || "English",
          stock: bookData.stock || 0,
          coverImageUrl: bookData.coverImage || "",
          isAvailableRush:
            bookData.isAvailableRush !== undefined
              ? bookData.isAvailableRush
              : true, // Default to true if not set
          weight: bookData.weight || 0, // Default to 0 if not set
        });

        // Set preview URL for existing image
        setPreviewUrl(bookData.coverImage || "");
      } catch (err) {
        console.error("Failed to load book:", err);
        setError("Failed to load book data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadBook();
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
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image file size must be less than 5MB");
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

  const handleRushDeliveryChange = (e: SelectChangeEvent<string>) => {
    const value = e.target.value === "true";
    setFormData((prev) => ({
      ...prev,
      isAvailableRush: value,
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

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    // Author validation
    if (!formData.author.trim()) {
      newErrors.author = "Author is required";
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    // Original price validation
    if (formData.originalPrice <= 0) {
      newErrors.originalPrice = "Original price must be greater than 0";
    }

    // Discount rate validation
    // if (formData.discountRate < 0 || formData.discountRate > 100) {
    //   newErrors.discountRate = "Discount rate must be between 0 and 100";
    // }

    // ISBN validation
    if (!formData.isbn.trim()) {
      newErrors.isbn = "ISBN is required";
    } else if (
      !/^(?:\d[- ]?){13}$|^(?:\d[- ]?){10}$/.test(
        formData.isbn.replace(/[- ]/g, "")
      )
    ) {
      newErrors.isbn = "ISBN must be a valid 10 or 13 digit number";
    }

    // Publication year validation
    if (!formData.publicationYear) {
      newErrors.publicationYear = "Publication year is required";
    } else {
      const currentYear = new Date().getFullYear();
      if (
        formData.publicationYear < 1000 ||
        formData.publicationYear > currentYear + 5
      ) {
        newErrors.publicationYear = `Publication year must be between 1000 and ${
          currentYear + 5
        }`;
      }
    }

    // Publisher validation
    if (!formData.publisher.trim()) {
      newErrors.publisher = "Publisher is required";
    }

    // Page count validation
    if (formData.pageCount <= 0) {
      newErrors.pageCount = "Page count must be greater than 0";
    }

    // Genres validation
    if (formData.genres.length === 0) {
      newErrors.genres = "Select at least one genre";
    }

    // Stock quantity validation
    if (formData.stock < 0) {
      newErrors.stock = "Stock quantity cannot be negative";
    }

    // Cover image validation for new books
    if (!isEditMode && !selectedFile && !previewUrl) {
      newErrors.coverImage = "Cover image is required";
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
      let finalFormData = { ...formData };

      // If there's a selected file, upload it first
      if (selectedFile) {
        setUploading(true);
        try {
          const s3Key = await uploadBookCover(selectedFile, (progress) => {
            setUploadProgress(progress);
          });

          // Update form data with S3 key instead of file
          finalFormData = {
            ...finalFormData,
            coverImage: null, // Remove file object
            coverImageUrl: s3Key, // Use S3 key
            // tinh price = originalPrice * (1 - discountRate / 100)
            // price: calculateCurrentPrice(finalFormData.originalPrice, finalFormData.discountRate),
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
        await updateBook(id, finalFormData);
        setSuccess("Book updated successfully");
      } else {
        await createBook(finalFormData);
        setSuccess("Book created successfully");

        // Clear form data on successful creation
        setFormData({
          title: "",
          author: "",
          description: "",
          originalPrice: 0,
          // discountRate: 0,
          price: 0, // Reset calculated price
          isbn: "",
          publicationYear: new Date().getFullYear(),
          publisher: "",
          pageCount: 0,
          genres: [],
          language: "English",
          stock: 0,
          coverImage: null,
          coverImageUrl: "",
          isAvailableRush: true, // Reset rush delivery option
          weight: 0, // Reset weight
        });
        setSelectedFile(null);
        setPreviewUrl("");
      }

      // Navigate back to book list after a short delay
      setTimeout(() => {
        navigate("/admin/books");
      }, 1500);
    } catch (err) {
      console.error("Failed to save book:", err);
      setError("Failed to save book. Please try again.");

      if (axios.isAxiosError(err)) {
              const error = err as AxiosError<{ message: string }>;
      
              if (
                error.response?.data?.message?.includes("2 times per day")
              ) {
                setError(error.response.data.message);
              } else {
                setError(
                  `Failed to delete product. ${
                    error.response?.data?.message || "Please try again."
                  }`
                );
              }
            } else {
              setError("An unknown error occurred");
            }


    } finally {
      setSaving(false);
    }
  };

  // Handle navigation back to book list
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
          {isEditMode ? "Edit Book" : "Add New Book"}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
        >
          Back to Products
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
                Book Information
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
                    label="Author"
                    name="author"
                    value={formData.author}
                    onChange={handleInputChange}
                    error={!!errors.author}
                    helperText={errors.author}
                  />
                </Grid>

                <Grid size={12}>
                  <TextField
                    fullWidth
                    required
                    label="Description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    multiline
                    rows={4}
                    error={!!errors.description}
                    helperText={errors.description}
                  />
                </Grid>

                <Grid size={6}>
                  <TextField
                    fullWidth
                    required
                    label="ISBN"
                    name="isbn"
                    value={formData.isbn}
                    onChange={handleInputChange}
                    error={!!errors.isbn}
                    helperText={errors.isbn}
                  />
                </Grid>

                <Grid size={6}>
                  <TextField
                    fullWidth
                    required
                    label="Publication Year"
                    name="publicationYear"
                    type="number"
                    value={
                      formData.publicationYear === 0
                        ? ""
                        : formData.publicationYear
                    }
                    onChange={handleNumberInputChange}
                    InputProps={{
                      inputProps: {
                        min: 1000,
                        max: new Date().getFullYear() + 5,
                      },
                    }}
                    error={!!errors.publicationYear}
                    helperText={
                      errors.publicationYear ||
                      "Enter the year the book was published"
                    }
                  />
                </Grid>

                <Grid size={6}>
                  <TextField
                    fullWidth
                    required
                    label="Publisher"
                    name="publisher"
                    value={formData.publisher}
                    onChange={handleInputChange}
                    error={!!errors.publisher}
                    helperText={errors.publisher}
                  />
                </Grid>

                <Grid size={6}>
                  <TextField
                    fullWidth
                    required
                    label="Page Count"
                    name="pageCount"
                    type="number"
                    value={formData.pageCount === 0 ? "" : formData.pageCount}
                    onChange={handleNumberInputChange}
                    InputProps={{ inputProps: { min: 1 } }}
                    error={!!errors.pageCount}
                    helperText={errors.pageCount}
                  />
                </Grid>

                <Grid size={12}>
                  <FormControl fullWidth error={!!errors.genres}>
                    <InputLabel id="genres-label">Genres</InputLabel>
                    <Select
                      labelId="genres-label"
                      multiple
                      required
                      name="genres"
                      value={formData.genres}
                      onChange={handleSelectChange}
                      input={<OutlinedInput label="Genres" />}
                      renderValue={(selected) => (
                        <Box
                          sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}
                        >
                          {(selected as string[]).map((value) => (
                            <Chip key={value} label={value} />
                          ))}
                        </Box>
                      )}
                    >
                      {AVAILABLE_GENRES.map((genre) => (
                        <MenuItem key={genre} value={genre}>
                          {genre}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.genres && (
                      <FormHelperText>{errors.genres}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>

                <Grid size={6}>
                  <FormControl fullWidth>
                    <InputLabel id="language-label">Language</InputLabel>
                    <Select
                      labelId="language-label"
                      name="language"
                      value={formData.language}
                      onChange={handleSelectChange}
                      label="Language"
                    >
                      {AVAILABLE_LANGUAGES.map((language) => (
                        <MenuItem key={language} value={language}>
                          {language}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={6}>
                  <TextField
                    fullWidth
                    required
                    label="Stock Quantity"
                    name="stock"
                    type="number"
                    value={formData.stock === 0 ? "" : formData.stock}
                    onChange={handleNumberInputChange}
                    InputProps={{ inputProps: { min: 0 } }}
                    error={!!errors.stock}
                    helperText={errors.stock}
                  />
                </Grid>



                <Grid size={6}>
                  <TextField
                    fullWidth
                    required
                    label="Weight (grams)"
                    name="weight"
                    type="number"
                    value={formData.weight === 0 ? "" : formData.weight}
                    onChange={handleNumberInputChange}
                    InputProps={{ inputProps: { min: 0 } }}
                    error={!!errors.weight}
                    helperText={errors.weight}
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
                    value={
                      formData.originalPrice === 0 ? "" : formData.originalPrice
                    }
                    onChange={handleNumberInputChange}
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                      inputProps: { min: 0, step: 0.01 },
                    }}
                    error={!!errors.originalPrice}
                    helperText={
                      errors.originalPrice ||
                      "The original price before any discounts"
                    }
                  />
                </Grid>

                {/* them tickbox chon isAvailableRush = true hoac false */}
                <Grid size={6}>
                  <FormControl fullWidth>
                    <InputLabel id="rush-delivery-label">
                      Rush Delivery
                    </InputLabel>
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
                </Grid> */}

                {/* <Grid size={6}>
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

                {/* nguoi dung nhap vao price */}
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
                    helperText={
                      errors.price || "The final price after any discounts"
                    }
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
                    alt="Book cover preview"
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
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Uploading image... {uploadProgress}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={uploadProgress}
                  />
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
              startIcon={
                saving || uploading ? (
                  <CircularProgress size={20} />
                ) : (
                  <SaveIcon />
                )
              }
            >
              {uploading
                ? "Uploading..."
                : saving
                ? "Saving..."
                : isEditMode
                ? "Update Book"
                : "Add Book"}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default BookFormPage;
