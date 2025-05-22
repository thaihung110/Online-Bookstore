// Role type definition
export enum UserRole {
  ADMIN = "admin",
  USER = "user",
}

// Role display mapping
export const ROLE_DISPLAY: Record<UserRole, string> = {
  [UserRole.ADMIN]: "Admin",
  [UserRole.USER]: "User",
};

// Sort fields for user lists
export type UserSortField =
  | "name"
  | "email"
  | "role"
  | "createdAt"
  | "updatedAt"
  | "isActive";

// Sort direction
export type SortOrder = "asc" | "desc";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  address?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  totalPages?: number;
  total?: number;
}

export interface UserFilters extends Pagination {
  search?: string;
  role?: UserRole;
  isActive?: boolean;
  sortBy?: UserSortField;
  sortOrder?: SortOrder;
}

// Default filter values
export const DEFAULT_USER_FILTERS: UserFilters = {
  page: 1,
  limit: 10,
  sortBy: "name",
  sortOrder: "asc",
};

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserFormData {
  name: string;
  email: string;
  password?: string; // Optional for edit mode
  role: UserRole;
  address?: string;
  phone?: string;
  isActive: boolean;
}

// User status display utility
export const getUserStatusLabel = (isActive: boolean): string =>
  isActive ? "Active" : "Inactive";

// User role color utility
export const getUserRoleColor = (
  role: UserRole
): "primary" | "secondary" | "default" => {
  switch (role) {
    case UserRole.ADMIN:
      return "primary";
    case UserRole.USER:
      return "default";
    default:
      return "default";
  }
};
