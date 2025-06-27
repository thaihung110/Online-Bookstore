import { Product } from "../types/product.types";

// Helper function to get display data from any product type
export const getProductDisplayData = (product: Product) => {
  const baseData = {
    id: product.id,
    title: product.title,
    coverImage: product.coverImage,
    stock: product.stock,
    productType: product.productType,
  };

  switch (product.productType) {
    case "CD":
      return {
        ...baseData,
        author: product.artist,
        link: `/cds/${product.id}`,
        secondaryInfo: `Album: ${product.albumTitle}`,
      };
    case "DVD":
      return {
        ...baseData,
        author: product.director,
        link: `/dvds/${product.id}`,
        secondaryInfo: `Runtime: ${product.runtime} min`,
      };
    case "BOOK":
    default:
      return {
        ...baseData,
        author: product.author,
        link: `/books/${product.id}`,
        secondaryInfo: product.publisher
          ? `Publisher: ${product.publisher}`
          : "",
      };
  }
};

// Helper to get appropriate placeholder image
export const getProductPlaceholder = (productType: string) => {
  switch (productType) {
    case "CD":
      return "/placeholder-cd.jpg";
    case "DVD":
      return "/placeholder-dvd.jpg";
    case "BOOK":
    default:
      return "/placeholder-book.jpg";
  }
};
