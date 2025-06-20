import React from "react";
import { render, screen } from "@testing-library/react";
import App from "./App";
import FilterPanel from "./components/books/FilterPanel";
import { BookQuery } from "./api/books";

test("renders learn react link", () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});

test("FilterPanel renders with default values", () => {
  // Mock props
  const filters: BookQuery = {
    page: 1,
    limit: 10,
    sortBy: "title",
    sortOrder: "asc",
  };

  const mockHandlers = {
    onFilterChange: jest.fn(),
    onApplyFilters: jest.fn(),
    onResetFilters: jest.fn(),
    isMobile: false,
  };

  render(
    <FilterPanel
      filters={filters}
      onFilterChange={mockHandlers.onFilterChange}
      onApplyFilters={mockHandlers.onApplyFilters}
      onResetFilters={mockHandlers.onResetFilters}
      isMobile={mockHandlers.isMobile}
    />
  );

  // Check for key elements
  expect(screen.getByText("Khoảng giá")).toBeInTheDocument();
  expect(screen.getByText("Năm xuất bản")).toBeInTheDocument();
  expect(screen.getByText("Tác giả")).toBeInTheDocument();
  expect(screen.getByText("Thể loại")).toBeInTheDocument();
});
