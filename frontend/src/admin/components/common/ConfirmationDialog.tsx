import React from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Box,
} from "@mui/material";

export type ConfirmationDialogType =
  | "delete"
  | "approve"
  | "reject"
  | "status"
  | "custom";

interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  message: string | React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?:
    | "primary"
    | "secondary"
    | "error"
    | "info"
    | "success"
    | "warning";
  loading?: boolean;
  type?: ConfirmationDialogType;
  contentDetails?: React.ReactNode;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * A reusable confirmation dialog component
 *
 * @param props - Component props
 */
const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  confirmColor = "primary",
  loading = false,
  type = "custom",
  contentDetails,
  onClose,
  onConfirm,
}) => {
  // Determine button label based on type if not explicitly provided
  const getConfirmLabel = () => {
    if (confirmLabel) return confirmLabel;

    switch (type) {
      case "delete":
        return loading ? "Deleting..." : "Delete";
      case "approve":
        return loading ? "Approving..." : "Approve";
      case "reject":
        return loading ? "Rejecting..." : "Reject";
      case "status":
        return loading ? "Updating..." : "Update Status";
      default:
        return loading ? "Processing..." : "Confirm";
    }
  };

  // Determine button color based on type if not explicitly provided
  const getConfirmColor = ():
    | "primary"
    | "secondary"
    | "error"
    | "info"
    | "success"
    | "warning" => {
    if (confirmColor) return confirmColor;

    switch (type) {
      case "delete":
        return "error";
      case "approve":
        return "success";
      case "reject":
        return "error";
      case "status":
        return "info";
      default:
        return "primary";
    }
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      aria-labelledby="confirmation-dialog-title"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="confirmation-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
        {contentDetails && <Box sx={{ mt: 2 }}>{contentDetails}</Box>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading} color="inherit">
          {cancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          color={getConfirmColor()}
          variant="contained"
          disabled={loading}
          startIcon={
            loading ? <CircularProgress size={20} color="inherit" /> : null
          }
        >
          {getConfirmLabel()}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationDialog;
