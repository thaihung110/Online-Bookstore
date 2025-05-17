import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  TextField,
  Grid,
} from "@mui/material";
import { getFeaturedBooks, getBooks } from "../api/books";
import api from "../api/axios";

// This component is solely for testing API connectivity
const TestApiComponent: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<any>(null);
  const [endpoint, setEndpoint] = useState<string>("");
  const [apiUrl, setApiUrl] = useState<string>(api.defaults.baseURL || "");

  const testFeaturedBooks = async () => {
    setLoading(true);
    setEndpoint("/books/featured");
    setError(null);
    try {
      const data = await getFeaturedBooks();
      console.log("Featured books API response:", data);
      setResponse(data);
    } catch (err) {
      console.error("Error fetching featured books:", err);
      if (err instanceof Error) {
        setError(`${err.message}\n${err.stack}`);
      } else {
        setError("Unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const testAllBooks = async () => {
    setLoading(true);
    setEndpoint("/books");
    setError(null);
    try {
      const data = await getBooks();
      console.log("All books API response:", data);
      setResponse(data);
    } catch (err) {
      console.error("Error fetching all books:", err);
      if (err instanceof Error) {
        setError(`${err.message}\n${err.stack}`);
      } else {
        setError("Unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const testCustomEndpoint = async () => {
    if (!endpoint) return;

    setLoading(true);
    setError(null);
    try {
      const response = await api.get(endpoint);
      console.log(`Custom endpoint ${endpoint} response:`, response.data);
      setResponse(response.data);
    } catch (err) {
      console.error(`Error fetching from ${endpoint}:`, err);
      if (err instanceof Error) {
        setError(`${err.message}\n${err.stack}`);
      } else {
        setError("Unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ my: 4, p: 3, maxWidth: 800, mx: "auto" }}>
      <Typography variant="h4" component="h1" gutterBottom>
        API Test Component
      </Typography>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          API Configuration
        </Typography>
        <Typography>Base URL: {apiUrl}</Typography>
      </Paper>

      <Box sx={{ display: "flex", gap: 2, mb: 4 }}>
        <Button
          variant="contained"
          onClick={testFeaturedBooks}
          disabled={loading}
        >
          Test Featured Books API
        </Button>

        <Button variant="contained" onClick={testAllBooks} disabled={loading}>
          Test All Books API
        </Button>
      </Box>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Test Custom Endpoint
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid size={8}>
            <TextField
              fullWidth
              label="API Endpoint"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="/books/featured"
            />
          </Grid>
          <Grid size={4}>
            <Button
              variant="contained"
              onClick={testCustomEndpoint}
              disabled={loading || !endpoint}
              fullWidth
            >
              Test
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Paper sx={{ p: 3, bgcolor: "#ffebee", mb: 3 }}>
          <Typography color="error" variant="h6">
            Error
          </Typography>
          <Typography>Endpoint: {endpoint}</Typography>
          <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{error}</pre>
        </Paper>
      )}

      {response && (
        <Paper sx={{ p: 3, mb: 3, overflow: "auto", maxHeight: 400 }}>
          <Typography variant="h6" gutterBottom>
            Response from {endpoint}
          </Typography>
          <pre style={{ margin: 0 }}>{JSON.stringify(response, null, 2)}</pre>
        </Paper>
      )}
    </Box>
  );
};

export default TestApiComponent;
