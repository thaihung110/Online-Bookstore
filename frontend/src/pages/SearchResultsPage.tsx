import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from "@mui/material";
import { useLocation, useSearchParams } from "react-router-dom";
import MainLayout from "../components/layouts/MainLayout";
import ProductCard from "../components/common/ProductCard";
import { Product, searchAllProducts } from "../api/products";

const SearchResultsPage: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    const searchProducts = async () => {
      if (!query.trim()) {
        setProducts([]);
        setFilteredProducts([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const results = await searchAllProducts(query, 50);
        setProducts(results);
        setFilteredProducts(results);
      } catch (err) {
        console.error("Search error:", err);
        setError("Failed to search products. Please try again.");
        setProducts([]);
        setFilteredProducts([]);
      } finally {
        setLoading(false);
      }
    };

    searchProducts();
  }, [query]);

  useEffect(() => {
    if (filterType === "all") {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter(product => 
        product.productType === filterType.toUpperCase()
      ));
    }
  }, [filterType, products]);

  const handleFilterChange = (event: SelectChangeEvent) => {
    setFilterType(event.target.value);
  };

  const getProductTypeCount = (type: string) => {
    if (type === "all") return products.length;
    return products.filter(product => product.productType === type.toUpperCase()).length;
  };

  const getProductTypeLabel = (type: string) => {
    switch (type) {
      case "BOOK": return "Book";
      case "CD": return "CD";
      case "DVD": return "DVD";
      default: return type;
    }
  };

  return (
    <MainLayout>
      <Container maxWidth="lg">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Search Results
          </Typography>
          
          {query && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Results for: <strong>"{query}"</strong>
              </Typography>
              
              {!loading && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2, flexWrap: "wrap" }}>
                  <Typography variant="body1" color="text.secondary">
                    {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"} found
                  </Typography>
                  
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <Chip 
                      label={`All (${getProductTypeCount("all")})`}
                      variant={filterType === "all" ? "filled" : "outlined"}
                      onClick={() => setFilterType("all")}
                      clickable
                      size="small"
                    />
                    <Chip 
                      label={`Books (${getProductTypeCount("book")})`}
                      variant={filterType === "book" ? "filled" : "outlined"}
                      onClick={() => setFilterType("book")}
                      clickable
                      size="small"
                    />
                    <Chip 
                      label={`CDs (${getProductTypeCount("cd")})`}
                      variant={filterType === "cd" ? "filled" : "outlined"}
                      onClick={() => setFilterType("cd")}
                      clickable
                      size="small"
                    />
                    <Chip 
                      label={`DVDs (${getProductTypeCount("dvd")})`}
                      variant={filterType === "dvd" ? "filled" : "outlined"}
                      onClick={() => setFilterType("dvd")}
                      clickable
                      size="small"
                    />
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </Box>

        {!query.trim() && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Enter a search term to find products across our catalog of books, CDs, and DVDs.
          </Alert>
        )}

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && query.trim() && filteredProducts.length === 0 && (
          <Alert severity="info" sx={{ mb: 3 }}>
            No products found matching your search. Try different keywords or browse our categories.
          </Alert>
        )}

        {!loading && !error && filteredProducts.length > 0 && (
          <Box sx={{ display: "flex", flexWrap: "wrap", mx: -1.5 }}>
            {filteredProducts.map((product) => (
              <Box
                key={`${product.productType}-${product.id}`}
                sx={{ 
                  width: { xs: "100%", sm: "50%", md: "33.33%", lg: "25%" }, 
                  p: 1.5 
                }}
              >
                <ProductCard product={product} />
              </Box>
            ))}
          </Box>
        )}
      </Container>
    </MainLayout>
  );
};

export default SearchResultsPage;