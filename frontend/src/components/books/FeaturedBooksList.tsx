import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  Button,
  Alert,
  Paper,
  Link,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import BookCard from "./BookCard";
import { Book, getFeaturedBooks } from "../../api/books";
import api from "../../api/axios";

const FeaturedBooksList: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    "checking" | "connected" | "failed"
  >("checking");

  // Check basic connection to backend
  const checkConnection = async () => {
    try {
      // Try to connect to the backend root endpoint
      await api.get("/");
      setConnectionStatus("connected");
      return true;
    } catch (err) {
      console.error("Backend connection check failed:", err);
      setConnectionStatus("failed");
      return false;
    }
  };

  const loadFeaturedBooks = async () => {
    try {
      setLoading(true);
      setError(null);

      // First check connection
      const isConnected = await checkConnection();
      if (!isConnected) {
        setError(
          "Backend connection failed. Please ensure the server is running."
        );
        setLoading(false);
        return;
      }

      console.log("Requesting featured books...");
      const data = await getFeaturedBooks(6);
      console.log("Featured books response:", data);
      setBooks(data);

      // Save response info for debugging
      setDebugInfo({
        timestamp: new Date().toISOString(),
        data,
        dataLength: Array.isArray(data) ? data.length : "not an array",
        dataType: typeof data,
        apiBaseUrl: api.defaults.baseURL,
      });
    } catch (err) {
      console.error("Error loading featured books:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load featured books"
      );

      // Save error info for debugging
      setDebugInfo({
        timestamp: new Date().toISOString(),
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : "No stack trace",
        apiBaseUrl: api.defaults.baseURL,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeaturedBooks();
  }, []);

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
        <Typography variant="h5" component="h2" fontWeight="bold">
          Featured Books
        </Typography>
        <Button component={RouterLink} to="/books" variant="outlined">
          View All
        </Button>
      </Box>

      {connectionStatus === "failed" && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => loadFeaturedBooks()}
            >
              Retry
            </Button>
          }
        >
          Cannot connect to the backend server at {api.defaults.baseURL}. Ensure
          the server is running.
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={loadFeaturedBooks}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      ) : books.length === 0 ? (
        <Box textAlign="center" p={3}>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            No featured books available right now.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This might happen if:{" "}
            <ul>
              <li>No books are marked as featured in the database</li>
              <li>The database hasn't been seeded</li>
              <li>The backend isn't correctly returning data</li>
            </ul>
          </Typography>
          <Button size="small" component={Link} href="/api-test" sx={{ mt: 2 }}>
            Go to API Test Page
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {books.map((book) => (
            <Grid key={book.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <BookCard book={book} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Debug information - always visible */}
      <Paper
        sx={{
          mt: 4,
          p: 2,
          bgcolor: "#f5f5f5",
          maxHeight: 200,
          overflow: "auto",
        }}
      >
        <Typography variant="subtitle2" gutterBottom>
          Debug Info:
        </Typography>
        <pre style={{ margin: 0, fontSize: "0.75rem" }}>
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </Paper>
    </Box>
  );
};

export default FeaturedBooksList;
