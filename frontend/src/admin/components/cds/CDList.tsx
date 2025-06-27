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
import { CD } from "../../types/cd.types";

interface CDListProps {
  cds: CD[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onEdit: (cd: CD) => void;
  onDelete: (cd: CD) => void;
  loading: boolean;
}

const CDList: React.FC<CDListProps> = ({
  cds,
  total,
  page,
  limit,
  totalPages,
  onPageChange,
  onEdit,
  onDelete,
  loading,
}) => {
  if (cds.length === 0 && !loading) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" color="textSecondary">
          No CDs found
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        CDs ({total} total)
      </Typography>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Cover</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Artist</TableCell>
              <TableCell>Album</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Stock</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cds.map((cd) => (
              <TableRow key={cd._id} hover>
                <TableCell>
                  <Avatar
                    src={cd.coverImage}
                    alt={cd.title}
                    sx={{ width: 50, height: 50 }}
                    variant="rounded"
                  >
                    {cd.title.charAt(0)}
                  </Avatar>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2" fontWeight="medium">
                      {cd.title}
                    </Typography>
                    {cd.isFeatured && (
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
                <TableCell>{cd.artist}</TableCell>
                <TableCell>{cd.albumTitle}</TableCell>
                <TableCell>{cd.category || "—"}</TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      ${cd.price.toFixed(2)}
                    </Typography>
                    {cd.discountRate > 0 && (
                      <Typography
                        variant="caption"
                        color="textSecondary"
                        sx={{ textDecoration: "line-through" }}
                      >
                        ${cd.originalPrice.toFixed(2)}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    color={cd.stock > 0 ? "textPrimary" : "error"}
                  >
                    {cd.stock}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={0.5} flexWrap="wrap">
                    <Chip
                      label={cd.isAvailable ? "Available" : "Unavailable"}
                      size="small"
                      color={cd.isAvailable ? "success" : "default"}
                      icon={
                        cd.isAvailable ? <VisibilityIcon /> : <VisibilityOffIcon />
                      }
                    />
                    {cd.isAvailableForPreOrder && (
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
                    <Tooltip title="Edit CD">
                      <IconButton
                        size="small"
                        onClick={() => onEdit(cd)}
                        disabled={loading}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete CD">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => onDelete(cd)}
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

export default CDList;