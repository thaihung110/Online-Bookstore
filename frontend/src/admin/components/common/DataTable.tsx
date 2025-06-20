import React from "react";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  CircularProgress,
  Typography,
  Box,
  SxProps,
  Theme,
} from "@mui/material";
import { SortOrder } from "../../types/user.types";

// Define column interface
export interface DataTableColumn<T> {
  id: string;
  label: string;
  sortable?: boolean;
  align?: "left" | "right" | "center";
  width?: string | number;
  renderCell?: (item: T) => React.ReactNode;
}

// Props interface
interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  totalItems: number;
  page: number;
  rowsPerPage: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  loading?: boolean;
  emptyMessage?: string;
  emptyAction?: React.ReactNode;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  onSortChange?: (property: string) => void;
  sx?: SxProps<Theme>;
}

/**
 * A reusable data table component with pagination and sorting
 *
 * @template T - The type of data to display
 */
function DataTable<T>({
  columns,
  data,
  keyExtractor,
  totalItems,
  page,
  rowsPerPage,
  sortBy,
  sortOrder = "asc",
  loading = false,
  emptyMessage = "No data found.",
  emptyAction,
  onPageChange,
  onRowsPerPageChange,
  onSortChange,
  sx,
}: DataTableProps<T>) {
  // Handle pagination page change
  const handleChangePage = (_event: unknown, newPage: number) => {
    onPageChange(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    onRowsPerPageChange(parseInt(event.target.value, 10));
  };

  // Create sort direction indicator and handler
  const createSortHandler = (property: string) => () => {
    if (onSortChange) {
      onSortChange(property);
    }
  };

  return (
    <Paper elevation={3} sx={sx}>
      <TableContainer>
        <Table aria-label="data table">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align || "left"}
                  style={{ width: column.width }}
                >
                  {column.sortable && onSortChange ? (
                    <TableSortLabel
                      active={sortBy === column.id}
                      direction={sortBy === column.id ? sortOrder : "asc"}
                      onClick={createSortHandler(column.id)}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  align="center"
                  sx={{ py: 3 }}
                >
                  <CircularProgress size={40} />
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  align="center"
                  sx={{ py: 3 }}
                >
                  <Typography variant="body1">{emptyMessage}</Typography>
                  {emptyAction && <Box sx={{ mt: 2 }}>{emptyAction}</Box>}
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow
                  key={keyExtractor(item)}
                  sx={{
                    "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
                  }}
                >
                  {columns.map((column) => (
                    <TableCell key={column.id} align={column.align || "left"}>
                      {column.renderCell
                        ? column.renderCell(item)
                        : (item as any)[column.id]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={totalItems}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
}

export default DataTable;
