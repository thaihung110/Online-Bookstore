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
  Checkbox,
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
  CloudUpload as CloudUploadIcon,
} from "@mui/icons-material";
import { BookFormData } from "../types/book.types";
import { getBook, createBook, updateBook } from "../api/bookApi";

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

  // Form state
  const [formData, setFormData] = useState<BookFormData>({
    title: "",
    author: "",
    description: "",
    price: 0,
    isbn: "",
    publicationDate: "",
    publisher: "",
    pageCount: 0,
    genres: [],
    language: "English",
    stockQuantity: 0,
    isOnSale: false,
    salePrice: undefined,
    coverImage: null,
    coverImageUrl: "",
  });

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // UI state
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load book data if in edit mode
  useEffect(() => {
    const loadBook = async () => {
      if (!isEditMode) return;

      try {
        setLoading(true);
        const bookData = await getBook(id);

        setFormData({
          title: bookData.title,
          author: bookData.author,
          description: bookData.description,
          price: bookData.price,
          salePrice: bookData.salePrice,
          isbn: bookData.isbn,
          publicationDate: bookData.publicationDate.split("T")[0], // Format date for input
          publisher: bookData.publisher,
          pageCount: bookData.pageCount,
          genres: bookData.genres,
          language: bookData.language,
          stockQuantity: bookData.stockQuantity,
          isOnSale: bookData.isOnSale,
          coverImageUrl: bookData.coverImage,
        });
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

  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
      // If isOnSale is unchecked, reset salePrice
      ...(name === "isOnSale" && !checked ? { salePrice: undefined } : {}),
    }));
  };

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFormData((prev) => ({ ...prev, coverImage: file }));

      // Create a preview URL
      const reader = new FileReader();
      reader.onload = () => {
        setFormData((prev) => ({
          ...prev,
          coverImageUrl: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
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

    // Price validation
    if (formData.price <= 0) {
      newErrors.price = "Price must be greater than 0";
    }

    // Sale price validation
    if (formData.isOnSale && (!formData.salePrice || formData.salePrice <= 0)) {
      newErrors.salePrice = "Sale price must be greater than 0";
    }

    if (
      formData.isOnSale &&
      formData.salePrice &&
      formData.salePrice >= formData.price
    ) {
      newErrors.salePrice = "Sale price must be less than regular price";
    }

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

    // Publication date validation
    if (!formData.publicationDate) {
      newErrors.publicationDate = "Publication date is required";
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
    if (formData.stockQuantity < 0) {
      newErrors.stockQuantity = "Stock quantity cannot be negative";
    }

    // Cover image validation for new books
    if (!isEditMode && !formData.coverImage && !formData.coverImageUrl) {
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
      if (isEditMode) {
        await updateBook(id, formData);
        setSuccess("Book updated successfully");
      } else {
        await createBook(formData);
        setSuccess("Book created successfully");

        // Clear form data on successful creation
        if (!isEditMode) {
          setFormData({
            title: "",
            author: "",
            description: "",
            price: 0,
            isbn: "",
            publicationDate: "",
            publisher: "",
            pageCount: 0,
            genres: [],
            language: "English",
            stockQuantity: 0,
            isOnSale: false,
            salePrice: undefined,
            coverImage: null,
            coverImageUrl: "",
          });
        }
      }

      // Navigate back to book list after a short delay
      setTimeout(() => {
        navigate("/admin/books");
      }, 1500);
    } catch (err) {
      console.error("Failed to save book:", err);
      setError("Failed to save book. Please try again.");
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
          Back to Books
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
                    label="Publication Date"
                    name="publicationDate"
                    type="date"
                    value={formData.publicationDate}
                    onChange={handleInputChange}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    error={!!errors.publicationDate}
                    helperText={errors.publicationDate}
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
                    name="stockQuantity"
                    type="number"
                    value={
                      formData.stockQuantity === 0 ? "" : formData.stockQuantity
                    }
                    onChange={handleNumberInputChange}
                    InputProps={{ inputProps: { min: 0 } }}
                    error={!!errors.stockQuantity}
                    helperText={errors.stockQuantity}
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
                    label="Regular Price"
                    name="price"
                    type="number"
                    value={formData.price === 0 ? "" : formData.price}
                    onChange={handleNumberInputChange}
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                      inputProps: { min: 0, step: 0.01 },
                    }}
                    error={!!errors.price}
                    helperText={errors.price}
                  />
                </Grid>

                <Grid size={6} sx={{ display: "flex", alignItems: "center" }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.isOnSale}
                        onChange={handleCheckboxChange}
                        name="isOnSale"
                      />
                    }
                    label="On Sale"
                  />
                </Grid>

                {formData.isOnSale && (
                  <Grid size={6}>
                    <TextField
                      fullWidth
                      required
                      label="Sale Price"
                      name="salePrice"
                      type="number"
                      value={formData.salePrice || ""}
                      onChange={handleNumberInputChange}
                      InputProps={{
                        startAdornment: (
                          <Typography sx={{ mr: 1 }}>$</Typography>
                        ),
                        inputProps: { min: 0, step: 0.01 },
                      }}
                      error={!!errors.salePrice}
                      helperText={errors.salePrice}
                    />
                  </Grid>
                )}
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
                {formData.coverImageUrl ? (
                  <Box
                    component="img"
                    src={formData.coverImageUrl}
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
              disabled={saving}
              startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            >
              {saving ? "Saving..." : isEditMode ? "Update Book" : "Add Book"}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default BookFormPage;
