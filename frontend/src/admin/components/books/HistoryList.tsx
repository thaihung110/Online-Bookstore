import React from "react";
import {
  Box,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import {
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material";

// Types for history entries
interface HistoryEntry {
  productName: string;
  action: 'create' | 'update' | 'delete';
  timestamp: string;
}

interface HistoryListProps {
  history: HistoryEntry[];
  loading: boolean;
}

const HistoryList: React.FC<HistoryListProps> = ({
  history,
  loading,
}) => {
  // Get action icon and color
  const getActionDetails = (action: string) => {
    switch (action) {
      case 'CREATE':
        return { icon: <AddIcon />, color: 'success', label: 'Created' };
      case 'UPDATE':
        return { icon: <EditIcon />, color: 'warning', label: 'Updated' };
      case 'DELETE':
        return { icon: <DeleteIcon />, color: 'error', label: 'Deleted' };
      case 'VIEW':
        return { icon: <ViewIcon />, color: 'info', label: 'Viewed' };
      default:
        return { icon: <EditIcon />, color: 'default', label: action };
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <Paper elevation={3}>
      <TableContainer>
        <Table sx={{ minWidth: 650 }} aria-label="history table">
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Date & Time</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                  <CircularProgress size={40} />
                </TableCell>
              </TableRow>
            ) : history.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1">
                    No history entries found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              history.map((entry) => {
                const actionDetails = getActionDetails(entry.action);
                const { date, time } = formatTimestamp(entry.timestamp);
                
                return (
                  <TableRow
                    // key={entry._id}
                    sx={{
                      "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Typography variant="body2" fontWeight="medium">
                          {entry.productName}
                        </Typography>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        icon={actionDetails.icon}
                        label={actionDetails.label}
                        color={actionDetails.color as any}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {date}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {time}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default HistoryList;
export type { HistoryEntry };