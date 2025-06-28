import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Interface for product store compatibility
interface ProductStore<T> {
  currentProduct: T | null;
  isLoading: boolean;
  error: string | null;
  fetchProductById: (id: string) => Promise<void>;
  clearCurrentProduct: () => void;
}

// Generic hook for product detail logic - following SRP and DIP
// Handles data fetching and navigation logic, not UI concerns
export const useProductDetail = <T>(
  productStore: ProductStore<T>
) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    currentProduct,
    isLoading,
    error,
    fetchProductById,
    clearCurrentProduct,
  } = productStore;

  // Fetch product data when component mounts or ID changes
  useEffect(() => {
    if (id) {
      fetchProductById(id);
    } else {
      // No ID provided, redirect to products page
      navigate('/books', { replace: true });
    }

    // Scroll to top when component mounts or ID changes
    window.scrollTo(0, 0);

    // Cleanup function
    return () => {
      // Only clear if we're unmounting, not just re-rendering
    };
  }, [id, fetchProductById, navigate]);

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      clearCurrentProduct();
    };
  }, [clearCurrentProduct]);

  // Navigation helper
  const handleGoBack = () => {
    navigate(-1);
  };

  // Generate placeholder image if no cover is available
  const getCoverImage = (product: T | null) => {
    if (!product) return undefined;
    return (product as any)?.coverImage || 
           "https://via.placeholder.com/400x600?text=No+Image+Available";
  };

  // Check if product has discount
  const isOnSale = (product: T | null) => {
    if (!product) return false;
    const discountRate = (product as any)?.discountRate;
    return discountRate !== undefined && 
           discountRate !== null && 
           discountRate > 0;
  };

  // Get display prices
  const getPricing = (product: T | null) => {
    if (!product) return { currentPrice: 0, originalPrice: 0, hasDiscount: false, discountRate: 0 };

    const productAny = product as any;
    const currentPrice = productAny?.price || 0;
    const originalPrice = productAny?.originalPrice !== undefined 
      ? productAny.originalPrice 
      : currentPrice;
    
    return {
      currentPrice,
      originalPrice,
      hasDiscount: isOnSale(product),
      discountRate: productAny?.discountRate || 0,
    };
  };

  // Format price safely
  const formatPrice = (price: number): string => {
    return typeof price === "number" && !isNaN(price) 
      ? price.toFixed(2) 
      : "N/A";
  };

  // Get rating display info
  const getRatingInfo = (product: T | null) => {
    if (!product) return { hasRating: false, rating: 0, totalRatings: 0 };

    const productAny = product as any;
    const hasValidRating = productAny?.rating !== undefined &&
                          productAny?.rating !== null &&
                          !isNaN(productAny?.rating) &&
                          productAny?.rating > 0;

    return {
      hasRating: hasValidRating,
      rating: productAny?.rating || 0,
      totalRatings: productAny?.totalRatings || 0,
    };
  };

  return {
    // Data
    product: currentProduct,
    isLoading,
    error,
    productId: id,

    // Actions
    handleGoBack,

    // Helpers
    getCoverImage,
    isOnSale,
    getPricing,
    formatPrice,
    getRatingInfo,

    // Status checks
    hasProduct: !!currentProduct,
    hasError: !!error,
  };
};