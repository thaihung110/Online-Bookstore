import React from "react";
import { Box, Rating, Typography } from "@mui/material";
import { useRatingStore } from "../store/ratingStore";

interface StarRatingProps {
  bookId: string;
  size?: "small" | "medium" | "large";
  showLabel?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({ 
  bookId, 
  size = "medium", 
  showLabel = true 
}) => {
  const { getRating, setRating } = useRatingStore();
  const currentRating = getRating(bookId);

  const handleRatingChange = (event: React.SyntheticEvent, newValue: number | null) => {
    if (newValue !== null) {
      setRating(bookId, newValue);
    }
  };

  return (
    <Box 
      sx={{ 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center",
        gap: 0.5
      }}
    >
      <Rating
        name={`rating-${bookId}`}
        value={currentRating}
        onChange={handleRatingChange}
        precision={1}
        size={size}
        max={5}
        sx={{
          color: "#ffc107", // Yellow color
          "& .MuiRating-iconFilled": {
            color: "#ffc107",
          },
          "& .MuiRating-iconHover": {
            color: "#ffb300",
          },
        }}
      />
      {showLabel && (
        <Typography 
          variant="caption" 
          color="text.secondary"
          sx={{ fontSize: "0.75rem" }}
        >
          {currentRating > 0 ? `${currentRating}/5` : "Rate this book"}
        </Typography>
      )}
    </Box>
  );
};

export default StarRating;
