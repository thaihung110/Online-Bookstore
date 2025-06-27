import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Box,
  Typography,
  Avatar,
  Pagination,
  Tooltip,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from "@mui/icons-material";
import { DVD } from "../../types/dvd.types";

interface DVDListProps {
  dvds: DVD[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onEdit: (dvd: DVD) => void;
  onDelete: (dvd: DVD) => void;
  loading: boolean;
}

const DVDList: React.FC<DVDListProps> = ({
  dvds,
  total,
  page,
  limit,
  totalPages,
  onPageChange,
  onEdit,
  onDelete,
  loading,
}) => {
  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (dvds.length === 0 && !loading) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" color="textSecondary">
          No DVDs found
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        DVDs ({total} total)
      </Typography>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Cover</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Director</TableCell>
              <TableCell>Studio</TableCell>
              <TableCell>Runtime</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Stock</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dvds.map((dvd) => (
              <TableRow key={dvd._id} hover>
                <TableCell>
                  <Avatar
                    src={dvd.coverImage}
                    alt={dvd.title}
                    sx={{ width: 50, height: 50 }}
                    variant="rounded"
                  >
                    {dvd.title.charAt(0)}
                  </Avatar>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2" fontWeight="medium">
                      {dvd.title}
                    </Typography>
                    {dvd.isFeatured && (
                      <Chip
                        icon={<StarIcon />}
                        label="Featured"
                        size="small"
                        color="warning"
                        sx={{ mt: 0.5 }}
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell>{dvd.director}</TableCell>
                <TableCell>{dvd.studio}</TableCell>
                <TableCell>{formatRuntime(dvd.runtime)}</TableCell>
                <TableCell>
                  <Box>
                    {dvd.filmtype && (
                      <Chip
                        label={dvd.filmtype}
                        size="small"
                        variant="outlined"
                        sx={{ mb: 0.5 }}
                      />
                    )}
                    {dvd.disctype && (
                      <Chip
                        label={dvd.disctype}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      ${dvd.price.toFixed(2)}
                    </Typography>
                    {dvd.discountRate > 0 && (
                      <Typography
                        variant="caption"
                        color="textSecondary"
                        sx={{ textDecoration: "line-through" }}
                      >
                        ${dvd.originalPrice.toFixed(2)}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    color={dvd.stock > 0 ? "textPrimary" : "error"}
                  >
                    {dvd.stock}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={0.5} flexWrap="wrap">
                    <Chip
                      label={dvd.isAvailable ? "Available" : "Unavailable"}
                      size="small"
                      color={dvd.isAvailable ? "success" : "default"}
                      icon={
                        dvd.isAvailable ? <VisibilityIcon /> : <VisibilityOffIcon />
                      }
                    />
                    {dvd.isAvailableForPreOrder && (
                      <Chip
                        label="Pre-order"
                        size="small"
                        color="info"
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={0.5}>
                    <Tooltip title="Edit DVD">
                      <IconButton
                        size="small"
                        onClick={() => onEdit(dvd)}
                        disabled={loading}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete DVD">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => onDelete(dvd)}
                        disabled={loading}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, newPage) => onPageChange(newPage)}
            color="primary"
            size="large"
          />
        </Box>
      )}
    </Box>
  );
};

export default DVDList;