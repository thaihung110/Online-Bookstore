import React from "react";
import {

  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,

  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,

  TablePagination,
  TableRow,
  TableSortLabel,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { CD, CDFilters } from "../../types/cd.types";

interface CDListProps {
  cds: CD[];
  totalCDs: number;
  loading: boolean;
  filters: CDFilters;
  onFilterChange: (newFilters: Partial<CDFilters>) => void;
  onDeleteCD: (cd: CD) => void;

}

const CDList: React.FC<CDListProps> = ({
  cds,

  totalCDs,
  loading,
  filters,
  onFilterChange,
  onDeleteCD,
}) => {
  const navigate = useNavigate();

  // Placeholder image as data URL to avoid network requests
  const placeholderImage = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA0MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0xNiAxOEgyNFYyMkgxNlYxOFoiIGZpbGw9IiNDQ0NDQ0MiLz4KPHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA0MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0xNiAxOEgyNFYyMkgxNlYxOFoiIGZpbGw9IiNDQ0NDQ0MiLz4KPHBhdGggZD0iTTEyIDI2SDI4VjI4SDEyVjI2WiIgZmlsbD0iI0NDQ0NDQyIvPgo8cGF0aCBkPSJNMTIgMzBIMjhWMzJIMTJWMzBaIiBmaWxsPSIjQ0NDQ0NDIi8+Cjx0ZXh0IHg9IjIwIiB5PSI0NCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OTk5OSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjgiPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4K";

  // Handle pagination
  const handleChangePage = (_event: unknown, newPage: number) => {
    onFilterChange({ page: newPage + 1 });
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    onFilterChange({
      limit: parseInt(event.target.value, 10),
      page: 1,
    });
  };

  // Handle sorting
  const handleSortRequest = (property: string) => {
    const isAsc = filters.sortBy === property && filters.sortOrder === "asc";
    onFilterChange({
      sortBy: property,
      sortOrder: isAsc ? "desc" : "asc",
      page: 1,
    });
  };

  // Create sort direction indicator
  const createSortHandler = (property: string) => () => {
    handleSortRequest(property);
  };

  // Handle actions
  const handleEditCD = (id: string) => {
    navigate(`/admin/cds/edit/${id}`);
  };

  return (
    <Paper elevation={3}>
      <TableContainer>
        <Table sx={{ minWidth: 650 }} aria-label="cds table">
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={filters.sortBy === "title"}
                  direction={
                    filters.sortBy === "title"
                      ? filters.sortOrder === "asc"
                        ? "asc"
                        : "desc"
                      : "asc"
                  }
                  onClick={createSortHandler("title")}
                >
                  Title
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={filters.sortBy === "author"}
                  direction={
                    filters.sortBy === "author"
                      ? filters.sortOrder === "asc"
                        ? "asc"
                        : "desc"
                      : "asc"
                  }
                  onClick={createSortHandler("author")}
                >
                  Author
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={filters.sortBy === "price"}
                  direction={
                    filters.sortBy === "price"
                      ? filters.sortOrder === "asc"
                        ? "asc"
                        : "desc"
                      : "asc"
                  }
                  onClick={createSortHandler("price")}
                >
                  Price
                </TableSortLabel>
              </TableCell>
              <TableCell>Genres</TableCell>
              <TableCell>
                <TableSortLabel
                  active={filters.sortBy === "stockQuantity"}
                  direction={
                    filters.sortBy === "stockQuantity"
                      ? filters.sortOrder === "asc"
                        ? "asc"
                        : "desc"
                      : "asc"
                  }
                  onClick={createSortHandler("stock")}
                >
                  Stock
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <CircularProgress size={40} />
                </TableCell>
              </TableRow>
            ) : cds.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1">
                    No cds found. Try adjusting your filters.
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    sx={{ mt: 2 }}
                    onClick={() => navigate("/admin/cds/add")}
                  >
                    Add New cds
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              cds.map((cd) => (
                <TableRow
                  key={cd._id}
                  sx={{
                    "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Box
                        component="img"
                        src={cd.coverImage || placeholderImage}
                        alt={cd.title}
                        sx={{
                          width: 40,
                          height: 60,
                          objectFit: "cover",
                          mr: 2,
                          borderRadius: 1,
                        }}
                        onError={(
                          e: React.SyntheticEvent<HTMLImageElement>
                        ) => {
                          // Only set placeholder once to prevent infinite loops
                          if (e.currentTarget.src !== placeholderImage) {
                            e.currentTarget.src = placeholderImage;
                          }
                        }}
                      />
                      <Typography variant="body1">{cd.title}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{cd.artist}</TableCell>
                  <TableCell>
                    {cd.discountRate > 0 ? (
                      <>
                        <Typography
                          variant="body2"
                          component="span"
                          sx={{
                            textDecoration: "line-through",
                            color: "text.secondary",
                            mr: 1,
                          }}
                        >
                          ${(cd.originalPrice || 0).toFixed(2)}
                        </Typography>
                        <Typography
                          variant="body1"
                          component="span"
                          sx={{ color: "error.main", fontWeight: "bold" }}
                        >
                          ${(cd.price || 0).toFixed(2)}
                        </Typography>
                        <Typography
                          variant="caption"
                          component="span"
                          sx={{ color: "success.main", ml: 1 }}
                        >
                          ({cd.discountRate}% off)
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="body1">
                        ${(cd.price || 0).toFixed(2)}
                      </Typography>
                    )}
                  </TableCell>
                  {/* <TableCell>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {cd.genres.slice(0, 2).map((genre) => (
                        <Chip
                          key={genre}
                          label={genre}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                      {book.genres.length > 2 && (
                        <Chip
                          label={`+${book.genres.length - 2}`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </TableCell> */}
                  <TableCell>
                    <Chip
                      label={cd.stock}
                      color={cd.stock > 0 ? "success" : "error"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton
                        aria-label="edit"
                        size="small"
                        onClick={() => handleEditCD(cd._id)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        aria-label="delete"
                        size="small"
                        onClick={() => onDeleteCD(cd)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={totalCDs}
        rowsPerPage={filters.limit}
        page={filters.page - 1}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
};

export default CDList;

