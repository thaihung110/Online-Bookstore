import React from "react";
import { TextField as MuiTextField, SxProps, Theme } from "@mui/material";

interface TextFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: boolean;
  helperText?: string;
  type?: string;
  fullWidth?: boolean;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  variant?: "standard" | "filled" | "outlined";
  margin?: "none" | "dense" | "normal";
  size?: "small" | "medium";
  multiline?: boolean;
  rows?: number;
  maxRows?: number;
  InputProps?: Record<string, unknown>;
  sx?: SxProps<Theme>;
}

const TextField: React.FC<TextFieldProps> = ({
  label,
  name,
  value,
  onChange,
  error = false,
  helperText = "",
  type = "text",
  fullWidth = true,
  required = false,
  disabled = false,
  placeholder,
  autoFocus = false,
  variant = "outlined",
  margin = "normal",
  size,
  multiline = false,
  rows,
  maxRows,
  InputProps,
  sx,
  ...rest
}) => {
  return (
    <MuiTextField
      label={label}
      name={name}
      value={value}
      onChange={onChange}
      error={error}
      helperText={helperText}
      type={type}
      fullWidth={fullWidth}
      required={required}
      disabled={disabled}
      placeholder={placeholder}
      autoFocus={autoFocus}
      variant={variant}
      margin={margin}
      size={size}
      multiline={multiline}
      rows={rows}
      maxRows={maxRows}
      InputProps={InputProps}
      sx={sx}
      {...rest}
    />
  );
};

export default TextField;
