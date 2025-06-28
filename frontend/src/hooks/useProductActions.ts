import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';

// Custom hook for product actions - following SRP (Single Responsibility Principle)
// Only handles product-related actions, not UI concerns
export const useProductActions = (product: any | null) => {
  const navigate = useNavigate();
  const { addItem, isInCart } = useCartStore();

  // Add to cart action with error handling
  const handleAddToCart = useCallback(async () => {
    if (!product) {
      console.warn('No product available for add to cart');
      return false;
    }

    try {
      // Use backend MongoDB _id for cart operations
      const productId = product._id || product.id;
      console.log('[ProductActions] Adding to cart with productId:', productId, 'product:', product);
      
      await addItem(productId, 1);
      return true;
    } catch (error) {
      console.error('Error adding product to cart:', error);
      return false;
    }
  }, [product, addItem]);

  // Buy now action with cart integration and navigation
  const handleBuyNow = useCallback(async () => {
    if (!product) {
      console.warn('No product available for buy now');
      return false;
    }

    try {
      const frontendId = product.id; // Use frontend id for isInCart check
      const backendId = product._id || product.id; // Use backend _id for cart operations
      
      console.log('[ProductActions] Buy now with frontendId:', frontendId, 'backendId:', backendId);

      // Add to cart if not already present
      if (!isInCart(frontendId)) {
        await addItem(backendId, 1);
      }

      // Set localStorage for checkout flow
      const selected = { [frontendId]: true };
      localStorage.setItem("cart-selected-items", JSON.stringify(selected));
      localStorage.setItem("cart-buynow-id", frontendId);
      
      // Navigate to cart
      navigate("/cart");
      return true;
    } catch (error) {
      console.error("Error during buy now process:", error);
      return false;
    }
  }, [product, isInCart, addItem, navigate]);

  // Check if product is in cart
  const productInCart = useCallback(() => {
    if (!product) return false;
    return isInCart(product.id);
  }, [product, isInCart]);

  // Generate product action label
  const getAddToCartLabel = useCallback(() => {
    if (!product) return "Add to Cart";
    return productInCart() ? "Already in Cart" : "Add to Cart";
  }, [product, productInCart]);

  return {
    handleAddToCart,
    handleBuyNow,
    productInCart,
    getAddToCartLabel,
    isActionDisabled: !product,
  };
};