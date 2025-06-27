import React from "react";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Collapse,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Inventory as StockIcon,
  AttachMoney as PriceIcon,
  RemoveShoppingCart as UnavailableIcon,
} from "@mui/icons-material";
import { CartValidationIssue } from "../../api/cart";
import { vndToUsd } from "../../utils/currency";

interface CartValidationAlertProps {
  issues: CartValidationIssue[];
  onRefresh?: () => void;
  onFixIssues?: () => void;
}

const CartValidationAlert: React.FC<CartValidationAlertProps> = ({
  issues,
  onRefresh,
  onFixIssues,
}) => {
  const [expanded, setExpanded] = React.useState(false);

  if (!issues || issues.length === 0) {
    return null;
  }

  const stockIssues = issues.filter((issue) => issue.type === "stock");
  const priceIssues = issues.filter((issue) => issue.type === "price");
  const unavailableIssues = issues.filter(
    (issue) => issue.type === "unavailable"
  );

  const getIssueIcon = (type: string) => {
    switch (type) {
      case "stock":
        return <StockIcon color="warning" />;
      case "price":
        return <PriceIcon color="info" />;
      case "unavailable":
        return <UnavailableIcon color="error" />;
      default:
        return <WarningIcon color="warning" />;
    }
  };

  const getSeverity = () => {
    if (unavailableIssues.length > 0 || stockIssues.length > 0) {
      return "error";
    }
    if (priceIssues.length > 0) {
      return "warning";
    }
    return "info";
  };

  const getTitle = () => {
    const totalIssues = issues.length;
    if (totalIssues === 1) {
      return "Cart Issue Detected";
    }
    return `${totalIssues} Cart Issues Detected`;
  };

  const formatPriceMessage = (issue: CartValidationIssue) => {
    if (issue.currentPrice && issue.cartPrice) {
      const currentPriceUsd = vndToUsd(issue.currentPrice);
      const cartPriceUsd = vndToUsd(issue.cartPrice);
      const priceChange =
        issue.currentPrice > issue.cartPrice ? "increased" : "decreased";
      return `Price has ${priceChange} from $${cartPriceUsd.toFixed(
        2
      )} to $${currentPriceUsd.toFixed(2)}`;
    }
    return issue.message;
  };

  return (
    <Alert
      severity={getSeverity() as any}
      sx={{ mb: 2 }}
      action={
        <Box sx={{ display: "flex", gap: 1 }}>
          {onRefresh && (
            <Button color="inherit" size="small" onClick={onRefresh}>
              Refresh
            </Button>
          )}
          {onFixIssues && (
            <Button color="inherit" size="small" onClick={onFixIssues}>
              Fix Issues
            </Button>
          )}
          <IconButton
            color="inherit"
            size="small"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
      }
    >
      <AlertTitle>{getTitle()}</AlertTitle>

      {!expanded && (
        <Typography variant="body2">
          {unavailableIssues.length > 0 &&
            `${unavailableIssues.length} unavailable, `}
          {stockIssues.length > 0 && `${stockIssues.length} stock issues, `}
          {priceIssues.length > 0 && `${priceIssues.length} price changes`}
          {". Click to expand for details."}
        </Typography>
      )}

      <Collapse in={expanded}>
        <List dense sx={{ mt: 1 }}>
          {issues.map((issue, index) => (
            <ListItem key={`${issue.productId}-${index}`} sx={{ pl: 0 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                {getIssueIcon(issue.type)}
              </ListItemIcon>
              <ListItemText
                primary={
                  issue.type === "price"
                    ? formatPriceMessage(issue)
                    : issue.message
                }
                secondary={
                  issue.type === "stock" && issue.currentStock !== undefined
                    ? `Available: ${issue.currentStock}, Requested: ${issue.requestedQuantity}`
                    : undefined
                }
              />
            </ListItem>
          ))}
        </List>
      </Collapse>
    </Alert>
  );
};

export default CartValidationAlert;
