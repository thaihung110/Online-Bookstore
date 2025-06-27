
import React from 'react';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';

const TestGrid: React.FC = () => {
  return (
    <Box>
      <h1>Test Grid</h1>
      <Grid container spacing={2}>
        <Grid size={8}>
          <Box>xs=8</Box>
        </Grid>
        <Grid size={4}>
          <Box>xs=4</Box>
        </Grid>
        <Grid size={4}>
          <Box>xs=4</Box>
        </Grid>
        <Grid size={8}>
          <Box>xs=8</Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TestGrid;
