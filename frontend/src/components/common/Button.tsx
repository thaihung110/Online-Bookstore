import React from "react";
import {
  Button as MuiButton,
  ButtonProps as MuiButtonProps,
} from "@mui/material";

interface ButtonProps extends MuiButtonProps {
  variant?: "text" | "outlined" | "contained";
  size?: "small" | "medium" | "large";
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = "contained",
  size = "medium",
  fullWidth = false,
  ...rest
}) => {
  return (
    <MuiButton variant={variant} size={size} fullWidth={fullWidth} {...rest}>
      {children}
    </MuiButton>
  );
};

export default Button;
