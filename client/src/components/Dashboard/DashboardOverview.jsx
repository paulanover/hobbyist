import React from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

const DashboardOverview = () => {
  return (
    <Box 
      display="flex" 
      justifyContent="center" 
      alignItems="center" 
      minHeight="400px" // Give it some height
    >
      <Typography variant="h6" color="textSecondary">
        This page is under development.
      </Typography>
    </Box>
  );
};

export default DashboardOverview;