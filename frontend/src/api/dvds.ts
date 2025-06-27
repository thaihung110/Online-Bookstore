import api from "./axios";
import { DVD, DVDQuery, DVDResponse } from "../types/product.types";

// Define raw DVD data type from API
interface RawDVDData {
  _id?: string;
  id?: string;
  productType: 'DVD';
  title: string;
  disctype: string;
  director: string;
  runtime: number;
  studio: string;
  subtitles: string;
  releaseddate: string | Date;
  filmtype: string;
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

// Cache for memoizing DVD data
const dvdCache = new Map<string, { data: DVD | DVD[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Validate DVD data
const isValidDVD = (dvd: any): dvd is RawDVDData => {
  return (
    typeof dvd === "object" &&
    dvd !== null &&
    dvd.productType === 'DVD' &&
    typeof dvd.title === "string" &&
    typeof dvd.disctype === "string" &&
    typeof dvd.director === "string" &&
    typeof dvd.runtime === "number" &&
    typeof dvd.studio === "string" &&
    typeof dvd.subtitles === "string" &&
    typeof dvd.filmtype === "string" &&
    typeof dvd.price === "number"
  );
};

// Transform DVD data from API to frontend format
const transformDVDData = (dvdData: RawDVDData): DVD => {
  // Convert _id to id if necessary, but preserve _id for backend operations
  const id = dvdData._id || dvdData.id || "";
  const _id = dvdData._id || dvdData.id || "";

  // Ensure numeric values
  const originalPrice = Number(dvdData.originalPrice) || dvdData.price;
  const discountRate = Number(dvdData.discountRate) || 0;
  const price = Number(dvdData.price);
  const stock = Number(dvdData.stock) || 0;
  const runtime = Number(dvdData.runtime) || 0;

  return {
    id,
    _id,
    productType: 'DVD',
    title: dvdData.title.trim(),
    disctype: dvdData.disctype.trim(),
    director: dvdData.director.trim(),
    runtime,
    studio: dvdData.studio.trim(),
    subtitles: dvdData.subtitles.trim(),
    releaseddate: dvdData.releaseddate,
    filmtype: dvdData.filmtype.trim(),
    description: dvdData.description?.trim(),
    originalPrice,
    discountRate,
    price,
    stock,
    coverImage: dvdData.coverImage,
    isAvailable: dvdData.isAvailable,
    isFeatured: dvdData.isFeatured,
    isAvailableForPreOrder: dvdData.isAvailableForPreOrder,
    preOrderReleaseDate: dvdData.preOrderReleaseDate,
    createdAt: dvdData.createdAt,
    updatedAt: dvdData.updatedAt,
  };
};

// Get paginated DVDs with filtering options
export const getDVDs = async (query: DVDQuery = {}): Promise<DVDResponse> => {
  console.log("API: Calling getDVDs with query:", query);

  try {
    // Clean up query parameters
    const cleanQuery: DVDQuery = {};
    if (query.page && query.page > 0) cleanQuery.page = query.page;
    if (query.limit && query.limit > 0) cleanQuery.limit = query.limit;
    if (query.search?.trim()) cleanQuery.search = query.search.trim();
    if (query.director?.trim()) cleanQuery.director = query.director.trim();
    if (query.studio?.trim()) cleanQuery.studio = query.studio.trim();

    // Handle disc types array
    if (Array.isArray(query.discTypes) && query.discTypes.length > 0) {
      cleanQuery.discTypes = query.discTypes
        .map((type) => type.trim())
        .filter((type) => type.length > 0);
      console.log("API: Clean disc types:", cleanQuery.discTypes);
    }

    // Handle film types array
    if (Array.isArray(query.filmTypes) && query.filmTypes.length > 0) {
      cleanQuery.filmTypes = query.filmTypes
        .map((type) => type.trim())
        .filter((type) => type.length > 0);
      console.log("API: Clean film types:", cleanQuery.filmTypes);
    }

    if (query.minPrice && query.minPrice >= 0) cleanQuery.minPrice = query.minPrice;
    if (query.maxPrice && query.maxPrice >= 0) cleanQuery.maxPrice = query.maxPrice;
    if (query.minRuntime && query.minRuntime > 0) cleanQuery.minRuntime = query.minRuntime;
    if (query.maxRuntime && query.maxRuntime > 0) cleanQuery.maxRuntime = query.maxRuntime;
    if (query.minYear && query.minYear > 0) cleanQuery.minYear = query.minYear;
    if (query.maxYear && query.maxYear > 0) cleanQuery.maxYear = query.maxYear;
    if (query.inStock !== undefined) cleanQuery.inStock = query.inStock;
    if (query.onSale !== undefined) cleanQuery.onSale = query.onSale;
    if (query.sortBy) cleanQuery.sortBy = query.sortBy;
    if (query.sortOrder) cleanQuery.sortOrder = query.sortOrder;

    console.log("API: Clean query parameters:", cleanQuery);

    const response = await api.get("/dvds", {
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
    if (!response.data || !Array.isArray(response.data.dvds)) {
      throw new Error("Invalid response format from DVDs API");
    }

    const transformedDVDs = response.data.dvds
      .filter(isValidDVD)
      .map(transformDVDData);

    return {
      dvds: transformedDVDs,
      total: response.data.total || transformedDVDs.length,
      page: response.data.page || 1,
      limit: response.data.limit || 10,
    };
  } catch (error) {
    console.error("Error in getDVDs API call:", error);
    return {
      dvds: [],
      total: 0,
      page: 1,
      limit: 10,
    };
  }
};

// Get a single DVD by ID with caching
export const getDVDById = async (id: string): Promise<DVD> => {
  console.log(`Calling getDVDById API for id: ${id}`);

  // Check cache first
  const cached = dvdCache.get(id);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log("Cache hit for DVD:", id);
    return cached.data as DVD;
  }

  try {
    const response = await api.get(`/dvds/${id}`);
    
    if (!isValidDVD(response.data)) {
      throw new Error("Invalid DVD data received from API");
    }

    const transformedDVD = transformDVDData(response.data as RawDVDData);

    // Update cache
    dvdCache.set(id, {
      data: transformedDVD,
      timestamp: Date.now(),
    });

    return transformedDVD;
  } catch (error) {
    console.error(`Error in getDVDById API call for id ${id}:`, error);
    throw error;
  }
};

// Get featured DVDs with memoization
export const getFeaturedDVDs = async (limit: number = 6): Promise<DVD[]> => {
  const cacheKey = `featured_dvds_${limit}`;
  const cached = dvdCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log("Cache hit for featured DVDs");
    return cached.data as DVD[];
  }

  try {
    const response = await api.get("/dvds/featured", {
      params: { limit: Math.max(1, Math.min(limit, 20)) },
    });

    if (!Array.isArray(response.data)) {
      throw new Error("Invalid response format for featured DVDs");
    }

    const transformedDVDs = response.data
      .filter(isValidDVD)
      .map(transformDVDData);

    // Update cache
    dvdCache.set(cacheKey, {
      data: transformedDVDs,
      timestamp: Date.now(),
    });

    return transformedDVDs;
  } catch (error) {
    console.error("Error in getFeaturedDVDs API call:", error);
    return [];
  }
};

// Get all unique film types with caching
const filmTypesCache = {
  data: [] as string[],
  timestamp: 0,
};

export const getAllFilmTypes = async (): Promise<string[]> => {
  // Check cache
  if (Date.now() - filmTypesCache.timestamp < CACHE_TTL) {
    return filmTypesCache.data;
  }

  try {
    const response = await api.get("/dvds/film-types");

    if (!Array.isArray(response.data)) {
      throw new Error("Invalid response format for film types");
    }

    // Update cache
    filmTypesCache.data = response.data;
    filmTypesCache.timestamp = Date.now();

    return response.data;
  } catch (error) {
    console.error("Error in getAllFilmTypes API call:", error);
    return filmTypesCache.data.length > 0
      ? filmTypesCache.data
      : ["Action", "Comedy", "Drama", "Horror", "Sci-Fi"];
  }
};

// Get all unique disc types with caching
const discTypesCache = {
  data: [] as string[],
  timestamp: 0,
};

export const getAllDiscTypes = async (): Promise<string[]> => {
  // Check cache
  if (Date.now() - discTypesCache.timestamp < CACHE_TTL) {
    return discTypesCache.data;
  }

  try {
    const response = await api.get("/dvds/disc-types");

    if (!Array.isArray(response.data)) {
      throw new Error("Invalid response format for disc types");
    }

    // Update cache
    discTypesCache.data = response.data;
    discTypesCache.timestamp = Date.now();

    return response.data;
  } catch (error) {
    console.error("Error in getAllDiscTypes API call:", error);
    return discTypesCache.data.length > 0
      ? discTypesCache.data
      : ["DVD", "Blu-ray", "4K UHD", "Blu-ray 3D"];
  }
};