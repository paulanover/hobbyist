import React, { createContext, useState, useMemo, useContext } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { grey } from '@mui/material/colors'; // Keep grey for potential fallback or specific elements
import theme from '../theme'; // Import the custom theme object

// Define the new palette colors
const charcoalGray = '#2C2C2C';
const burgundy = '#800020';
const offWhite = '#F7F7F7';
const subtleGold = '#D4AF37'; // Highlight/Accent 2

// Dark mode variations
const darkBackground = '#1A1A1A'; // Very dark grey, almost black
const darkPaper = charcoalGray; // Use charcoal for paper
const lightCharcoal = '#4A4A4A'; // Lighter charcoal for primary in dark mode
const lightBurgundy = '#A04050'; // Lighter burgundy for accent in dark mode
const darkGold = '#B89B2E'; // Slightly darker gold for dark mode highlight

// Function to create theme based on mode
const getDesignTokens = (mode) => ({
  palette: {
    mode, // Set the mode ('light' or 'dark')
    ...(mode === 'light'
      ? {
          // --- Light Mode Palette ---
          primary: {
            main: charcoalGray, // Charcoal Gray
            contrastText: offWhite, // Contrast text for primary buttons
          },
          secondary: {
            main: burgundy, // Burgundy
            contrastText: offWhite, // Contrast text for secondary buttons
          },
          appBar: {
            main: '#ffffff', // White AppBar background
            contrastText: charcoalGray, // Charcoal text/icons on white AppBar
          },
          background: {
            default: offWhite, // Off-White page background
            paper: '#ffffff', // Pure white for Paper components for contrast
          },
          text: {
            primary: charcoalGray, // Charcoal for primary text
            secondary: grey[700], // A standard grey for secondary text
          },
          accent: { // Custom accent color (optional usage)
            main: subtleGold,
            contrastText: charcoalGray,
          },
        }
      : {
          // --- Dark Mode Palette ---
          primary: {
            main: lightCharcoal, // Lighter Charcoal
            contrastText: offWhite, // Contrast text for primary buttons
          },
          secondary: {
            main: lightBurgundy, // Lighter Burgundy
            contrastText: offWhite, // Contrast text for secondary buttons
          },
          appBar: {
            main: '#ffffff', // White AppBar background
            contrastText: charcoalGray, // Charcoal text/icons on white AppBar
          },
          background: {
            default: darkBackground, // Very Dark Grey page background
            paper: darkPaper, // Charcoal for Paper components
          },
          text: {
            primary: offWhite, // Off-White for primary text
            secondary: grey[400], // Lighter grey for secondary text
          },
          accent: { // Custom accent color (optional usage)
            main: darkGold, // Darker Gold for dark mode
            contrastText: offWhite,
          },
        }),
  },
  shape: {
    borderRadius: 6, // Slightly less rounded for a more formal look
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        colorPrimary: ({ theme }) => ({
          backgroundColor: theme.palette.appBar.main,
          color: theme.palette.appBar.contrastText,
          boxShadow: theme.shadows[1], // Add a subtle shadow for separation
        }),
      },
    },
    MuiButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: theme.shape.borderRadius,
          textTransform: 'none',
        }),
        containedPrimary: ({ theme }) => ({
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
        }),
        containedSecondary: ({ theme }) => ({
          backgroundColor: theme.palette.secondary.main,
          color: theme.palette.secondary.contrastText,
        }),
        // Use accent color for specific buttons if desired, e.g., via sx prop or custom variant
        // containedAccent: ({ theme }) => ({
        //   backgroundColor: theme.palette.accent.main,
        //   color: theme.palette.accent.contrastText,
        // }),
        outlined: ({ theme }) => ({
          borderColor: theme.palette.mode === 'dark' ? theme.palette.text.secondary : theme.palette.primary.main, // Use primary color border in light mode
        }),
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: theme.shape.borderRadius,
          backgroundColor: theme.palette.background.paper,
        }),
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: ({ theme }) => ({
          '.MuiPaper-root > &': {
            borderRadius: theme.shape.borderRadius,
          },
        }),
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: ({ theme }) => ({
          '& .MuiOutlinedInput-root': {
            borderRadius: theme.shape.borderRadius,
            '& fieldset': { // Style the border
              borderColor: theme.palette.mode === 'dark' ? grey[600] : grey[400],
            },
            '&:hover fieldset': {
              borderColor: theme.palette.mode === 'dark' ? grey[400] : grey[600],
            },
            '&.Mui-focused fieldset': { // Focused border uses primary color by default
              borderColor: theme.palette.primary.main,
            },
          },
          '& label': {
            color: theme.palette.text.secondary,
          },
          '& label.Mui-focused': {
            color: theme.palette.primary.main, // Focused label uses primary color
          },
        }),
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: theme.shape.borderRadius,
        }),
        icon: ({ theme }) => ({
          color: theme.palette.text.secondary,
        }),
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        root: ({ theme }) => ({
          '& .MuiOutlinedInput-root': {
            borderRadius: theme.shape.borderRadius,
            paddingTop: '2px !important',
            paddingBottom: '2px !important',
          },
        }),
        clearIndicator: ({ theme }) => ({
          color: theme.palette.text.secondary,
        }),
        popupIndicator: ({ theme }) => ({
          color: theme.palette.text.secondary,
        }),
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: ({ theme }) => ({
          backgroundColor: theme.palette.mode === 'dark' ? lightCharcoal : grey[200], // Lighter charcoal or light grey header
          color: theme.palette.mode === 'dark' ? offWhite : charcoalGray, // Contrast text for header
          fontWeight: 'bold',
        }),
        body: ({ theme }) => ({
          color: theme.palette.text.primary,
        }),
      },
    },
    MuiChip: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: theme.shape.borderRadius / 2,
        }),
        // Example: Use accent color for 'success' or specific chips
        // colorSuccess: ({ theme }) => ({
        //   backgroundColor: theme.palette.accent.main,
        //   color: theme.palette.accent.contrastText,
        // }),
        outlined: ({ theme }) => ({
          borderColor: theme.palette.mode === 'dark' ? theme.palette.text.secondary : undefined,
        }),
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          // Ensure icon buttons in the AppBar use the AppBar's contrast text color
          // This specifically targets the theme toggle button if it's color="inherit"
          '.MuiAppBar-root &': {
            color: theme.palette.appBar.contrastText,
          },
          // General icon button color for other contexts
          ':not(.MuiAppBar-root) &': {
            color: theme.palette.mode === 'dark' ? theme.palette.text.secondary : theme.palette.primary.main,
          },
        }),
      },
    },
    // Adjust Footer color in Layout if needed
    // MuiContainer: { ... } // If specific container styles needed
  },
});

// Create the context
export const ThemeModeContext = createContext({
  toggleColorMode: () => {},
});

// Create the provider component
export function ThemeProviderWrapper({ children }) {
  const activeTheme = theme;

  return (
    <ThemeProvider theme={activeTheme}>
      {children}
    </ThemeProvider>
  );
}

export const useThemeMode = () => useContext(ThemeModeContext);
