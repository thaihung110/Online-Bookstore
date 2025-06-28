import api from "./axios";
import { CD, CDQuery, CDResponse } from "../types/product.types";

// Define raw CD data type from API
interface RawCDData {
  _id?: string;
  id?: string;
  productType: 'CD';
  title: string;
  artist: string;
  albumTitle?: string;
  albumtitle?: string; // Backend uses lowercase
  trackList?: string;
  tracklist?: string; // Backend uses lowercase
  category: string;
  releaseddate: string | Date;
  description?: string;
  originalPrice?: number;
  discountRate?: number;
  price: number;
  stock: number;
  coverImage?: string;
  isAvailable?: boolean;
  isFeatured?: boolean;
  isAvailableForPreOrder?: boolean;
  preOrderReleaseDate?: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// Cache for memoizing CD data
const cdCache = new Map<string, { data: CD | CD[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Validate CD data
const isValidCD = (cd: any): cd is RawCDData => {
  return (
    typeof cd === "object" &&
    cd !== null &&
    cd.productType === 'CD' &&
    typeof cd.title === "string" &&
    typeof cd.artist === "string" &&
    (typeof cd.albumTitle === "string" || typeof cd.albumtitle === "string") &&
    (typeof cd.trackList === "string" || typeof cd.tracklist === "string") &&
    typeof cd.category === "string" &&
    typeof cd.price === "number"
  );
};

// Transform CD data from API to frontend format
const transformCDData = (cdData: RawCDData): CD => {
  // Convert _id to id if necessary, but preserve _id for backend operations
  const id = cdData._id || cdData.id || "";
  const _id = cdData._id || cdData.id || "";

  // Handle both field name formats (camelCase and lowercase)
  const albumTitle = cdData.albumTitle || cdData.albumtitle || "";
  const trackList = cdData.trackList || cdData.tracklist || "";

  // Ensure numeric values
  const originalPrice = Number(cdData.originalPrice) || cdData.price;
  const discountRate = Number(cdData.discountRate) || 0;
  const price = Number(cdData.price);
  const stock = Number(cdData.stock) || 0;

  return {
    id,
    _id,
    productType: 'CD',
    title: cdData.title.trim(),
    artist: cdData.artist.trim(),
    albumTitle: albumTitle.trim(),
    trackList: trackList,
    category: cdData.category.trim(),
    releaseddate: cdData.releaseddate,
    description: cdData.description?.trim(),
    originalPrice,
    discountRate,
    price,
    stock,
    coverImage: cdData.coverImage,
    isAvailable: cdData.isAvailable,
    isFeatured: cdData.isFeatured,
    isAvailableForPreOrder: cdData.isAvailableForPreOrder,
    preOrderReleaseDate: cdData.preOrderReleaseDate,
    createdAt: cdData.createdAt,
    updatedAt: cdData.updatedAt,
  };
};

// Get paginated CDs with filtering options
export const getCDs = async (query: CDQuery = {}): Promise<CDResponse> => {
  console.log("API: Calling getCDs with query:", query);

  try {
    // Clean up query parameters
    const cleanQuery: CDQuery = {};
    if (query.page && query.page > 0) cleanQuery.page = query.page;
    if (query.limit && query.limit > 0) cleanQuery.limit = query.limit;
    if (query.search?.trim()) cleanQuery.search = query.search.trim();
    if (query.artist?.trim()) cleanQuery.artist = query.artist.trim();
    if (query.albumTitle?.trim()) cleanQuery.albumTitle = query.albumTitle.trim();

    // Handle categories array
    if (Array.isArray(query.categories) && query.categories.length > 0) {
      cleanQuery.categories = query.categories
        .map((category) => category.trim())
        .filter((category) => category.length > 0);
      console.log("API: Clean categories:", cleanQuery.categories);
    }

    if (query.minPrice && query.minPrice >= 0) cleanQuery.minPrice = query.minPrice;
    if (query.maxPrice && query.maxPrice >= 0) cleanQuery.maxPrice = query.maxPrice;
    if (query.minYear && query.minYear > 0) cleanQuery.minYear = query.minYear;
    if (query.maxYear && query.maxYear > 0) cleanQuery.maxYear = query.maxYear;
    if (query.inStock !== undefined) cleanQuery.inStock = query.inStock;
    if (query.onSale !== undefined) cleanQuery.onSale = query.onSale;
    if (query.sortBy) cleanQuery.sortBy = query.sortBy;
    if (query.sortOrder) cleanQuery.sortOrder = query.sortOrder;

    console.log("API: Clean query parameters:", cleanQuery);

    const response = await api.get("/cds", {
      params: cleanQuery,
      paramsSerializer: {
        serialize: (params) => {
          return Object.entries(params)
            .map(([key, value]) => {
              if (Array.isArray(value)) {
                return value
                  .map((v) => `${encodeURIComponent(key)}=${encodeURIComponent(v)}`)
                  .join("&");
              }
              return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
            })
            .join("&");
        },
      },
    });

    // Validate and transform response data
    if (!response.data || !Array.isArray(response.data.cds)) {
      console.error("API: Invalid response format:", response.data);
      throw new Error("Invalid response format from CDs API");
    }

    console.log("API: Raw response data:", {
      totalCDs: response.data.cds.length,
      total: response.data.total,
      page: response.data.page,
      limit: response.data.limit
    });

    const validCDs = response.data.cds.filter(isValidCD);
    console.log("API: Valid CDs after filtering:", validCDs.length, "out of", response.data.cds.length);
    
    if (validCDs.length !== response.data.cds.length) {
      console.warn("API: Some CDs filtered out during validation:", 
        response.data.cds.filter((cd: RawCDData) => !isValidCD(cd)).map((cd: RawCDData) => ({
          id: cd._id,
          title: cd.title,
          reason: "Failed validation"
        }))
      );
    }

    const transformedCDs = validCDs.map(transformCDData);

    return {
      cds: transformedCDs,
      total: response.data.total || transformedCDs.length,
      page: response.data.page || 1,
      limit: response.data.limit || 10,
    };
  } catch (error) {
    console.error("Error in getCDs API call:", error);
    return {
      cds: [],
      total: 0,
      page: 1,
      limit: 10,
    };
  }
};

// Get a single CD by ID with caching
export const getCDById = async (id: string): Promise<CD> => {
  console.log(`Calling getCDById API for id: ${id}`);

  // Check cache first
  const cached = cdCache.get(id);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log("Cache hit for CD:", id);
    return cached.data as CD;
  }

  try {
    const response = await api.get(`/cds/${id}`);
    
    if (!isValidCD(response.data)) {
      throw new Error("Invalid CD data received from API");
    }

    const transformedCD = transformCDData(response.data as RawCDData);

    // Update cache
    cdCache.set(id, {
      data: transformedCD,
      timestamp: Date.now(),
    });

    return transformedCD;
  } catch (error) {
    console.error(`Error in getCDById API call for id ${id}:`, error);
    throw error;
  }
};

// Get featured CDs with memoization
export const getFeaturedCDs = async (limit: number = 6): Promise<CD[]> => {
  const cacheKey = `featured_cds_${limit}`;
  const cached = cdCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log("Cache hit for featured CDs");
    return cached.data as CD[];
  }

  try {
    const response = await api.get("/cds/featured", {
      params: { limit: Math.max(1, Math.min(limit, 20)) },
    });

    if (!Array.isArray(response.data)) {
      throw new Error("Invalid response format for featured CDs");
    }

    const transformedCDs = response.data
      .filter(isValidCD)
      .map(transformCDData);

    // Update cache
    cdCache.set(cacheKey, {
      data: transformedCDs,
      timestamp: Date.now(),
    });

    return transformedCDs;
  } catch (error) {
    console.error("Error in getFeaturedCDs API call:", error);
    return [];
  }
};

// Get all unique categories with caching
const categoriesCache = {
  data: [] as string[],
  timestamp: 0,
};

export const getAllCategories = async (): Promise<string[]> => {
  // Check cache
  if (Date.now() - categoriesCache.timestamp < CACHE_TTL) {
    return categoriesCache.data;
  }

  try {
    const response = await api.get("/cds/categories");

    if (!Array.isArray(response.data)) {
      throw new Error("Invalid response format for categories");
    }

    // Update cache
    categoriesCache.data = response.data;
    categoriesCache.timestamp = Date.now();

    return response.data;
  } catch (error) {
    console.error("Error in getAllCategories API call:", error);
    return categoriesCache.data.length > 0
      ? categoriesCache.data
      : ["Pop", "Rock", "Jazz", "Classical", "Hip-Hop"];
  }
};